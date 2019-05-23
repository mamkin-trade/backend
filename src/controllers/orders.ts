// Dependencies
import { Context } from 'koa'
import { Controller, Get, Post, Delete } from 'koa-router-ts'
import { authenticate } from '../middlewares/authenticate'
import {
  UserModel,
  OrderModel,
  OrderType,
  OrderSide,
  User,
  Order,
} from '../models'
import { tickers } from '../helpers/bitfinex'
import { nasdaq } from '../helpers/nasdaq'
import { executeLocked } from '../helpers/locker'
import { InstanceType } from 'typegoose'
import { errors } from '../helpers/errors'
import { Big } from 'big.js'
import { precision, round } from '../helpers/precision'
import { minimumOrderSize, maximumOrderSize } from '../helpers/orderSize'
import { notify } from '../helpers/subscribe'
import { isCrypto } from '../helpers/isCrypto'
import { fee as feePercent } from '../helpers/fee'

@Controller('/orders')
export default class {
  @Get('/user/:id')
  async orders(ctx: Context) {
    // Run query
    const user = await UserModel.findOne({ _id: ctx.params.id }).populate(
      'orders'
    )
    if (!user) {
      return ctx.throw(404, JSON.stringify(errors.noUser))
    }
    let orders = user.orders
      .filter((o: Order) => {
        let valid = true
        if (ctx.params.completed !== undefined) {
          if (o.completed !== ctx.params.completed) {
            valid = false
          }
        }
        if (ctx.params.cancelled !== undefined) {
          if (o.cancelled !== ctx.params.cancelled) {
            valid = false
          }
        }
        return valid
      })
      .sort((a: InstanceType<Order>, b: InstanceType<Order>) =>
        a._doc.createdAt > b._doc.createdAt ? -1 : 1
      )
    const count = orders.length
    const skip = parseInt(ctx.request.query.skip || 0, 10)
    const limit = parseInt(ctx.request.query.limit || 20, 10)
    const tempOrders = orders
      .slice(skip, skip + limit)
      .map((o: InstanceType<Order>) => o.stripped())
    ctx.body = { orders: tempOrders, count }
  }

  @Get('/user/:id/count')
  async count(ctx: Context) {
    // Run query
    const user = await UserModel.findOne({ _id: ctx.params.id }).populate(
      'orders'
    )
    if (!user) {
      return ctx.throw(404, JSON.stringify(errors.noUser))
    }
    const orders = user.orders.filter((o: Order) => {
      let valid = true
      if (ctx.params.completed !== undefined) {
        if (o.completed !== ctx.params.completed) {
          valid = false
        }
      }
      if (ctx.params.cancelled !== undefined) {
        if (o.cancelled !== ctx.params.cancelled) {
          valid = false
        }
      }
      return valid
    })
    ctx.body = { count: orders.length }
  }

  @Post('/order', authenticate)
  async postOrder(ctx: Context) {
    // Destruct params
    const { symbol, side, type } = ctx.request.body
    const crypto = isCrypto(symbol)
    const amount = new Big(ctx.request.body.amount || 0)
    let price = new Big(ctx.request.body.price || 0)
    const isMarket = type === 'market'
    const isBuy = side === OrderSide.buy
    const feeAmount = feePercent(isMarket)
    const fee = crypto
      ? amount.mul(feeAmount)
      : amount.mul(price).mul(feeAmount)
    // Split symbol
    const firstCurrency = crypto
      ? symbol.substr(0, 3).toLowerCase()
      : symbol.toLowerCase()
    const secondCurrency = crypto ? symbol.substr(3).toLowerCase() : 'usd'
    // Get current price
    const uppercaseSymbol = symbol.toUpperCase()
    const currentPrice = (price = isBuy
      ? crypto
        ? new Big(tickers[uppercaseSymbol].ask)
        : new Big(nasdaq[uppercaseSymbol].currentPrice.raw)
      : crypto
      ? new Big(tickers[uppercaseSymbol].bid)
      : new Big(nasdaq[uppercaseSymbol].currentPrice.raw))
    if (isMarket) {
      price = currentPrice
    }
    // Check price
    if (price.lte(0)) {
      return ctx.throw(400, JSON.stringify(errors.priceLessThanZero))
    }
    if (
      price.lt(
        new Big(1).div(
          new Big(10).pow(precision(firstCurrency) + precision(secondCurrency))
        )
      )
    ) {
      return ctx.throw(400, JSON.stringify(errors.priceLessThanMinimum))
    }
    if (price.gt(100000000)) {
      return ctx.throw(400, JSON.stringify(errors.priceMoreThanMaximum))
    }
    if (type === 'limit') {
      if (isBuy && price.gt(currentPrice)) {
        return ctx.throw(400, JSON.stringify(errors.priceMoreThanCurrent))
      } else if (!isBuy && price.lt(currentPrice)) {
        return ctx.throw(400, JSON.stringify(errors.priceLessThanCurrent))
      }
    } else if (type === 'stop') {
      if (!isBuy && price.gt(currentPrice)) {
        return ctx.throw(400, JSON.stringify(errors.priceMoreThanCurrent))
      } else if (isBuy && price.lt(currentPrice)) {
        return ctx.throw(400, JSON.stringify(errors.priceLessThanCurrent))
      }
    }
    // Check amount
    if (amount.lte(0)) {
      return ctx.throw(400, JSON.stringify(errors.amountLessThanZero))
    }
    if (amount.lt(minimumOrderSize(symbol))) {
      return ctx.throw(400, JSON.stringify(errors.amountLessThanMinimumOrder))
    }
    if (amount.gt(maximumOrderSize(symbol))) {
      return ctx.throw(400, JSON.stringify(errors.amountMoreThanMaximumOrder))
    }
    if (!crypto && !amount.mod(1).eq(0)) {
      return ctx.throw(400, JSON.stringify(errors.amountNotInteger))
    }
    // Create order
    let order = new OrderModel({
      symbol,
      amount: Number(amount),
      side,
      type,
      completed: isMarket,
      price: Number(price),
      user: ctx.state.user,
      heldAmount: Number(isBuy ? price.mul(amount) : amount),
      fee: Number(fee),
      crypto,
    })
    // Check if user can afford this order and add or execute it
    let user = ctx.state.user as InstanceType<User>
    await executeLocked(user.id, async () => {
      // Get fresh user
      user = await UserModel.findOne({ _id: user.id })
      // Check if user has enough currency
      if (
        (isBuy &&
          (user.balance[secondCurrency] || 0) <
            (crypto
              ? Number(price.mul(amount))
              : Number(price.mul(amount).add(fee)))) ||
        (!isBuy && (user.balance[firstCurrency] || 0)) < amount
      ) {
        return ctx.throw(403, JSON.stringify(errors.insufficientFunds))
      }
      // Execute
      if (isBuy) {
        user.balance[secondCurrency] = round(
          user.balance[secondCurrency] -
            order.heldAmount -
            (crypto ? 0 : Number(fee)),
          {
            currency: secondCurrency,
          }
        )
        if (isMarket) {
          user.balance[firstCurrency] = round(
            amount
              .minus(crypto ? fee : 0)
              .add(user.balance[firstCurrency] || 0),
            { currency: firstCurrency }
          )
        }
      } else {
        user.balance[firstCurrency] = round(
          user.balance[firstCurrency] - order.heldAmount,
          {
            currency: firstCurrency,
          }
        )
        if (isMarket) {
          user.balance[secondCurrency] = round(
            price
              .mul(amount.minus(crypto ? fee : 0))
              .minus(crypto ? 0 : fee)
              .add(user.balance[secondCurrency] || 0),
            { currency: secondCurrency }
          )
        }
      }
      user.markModified('balance')
      if (isMarket) {
        order.completionDate = new Date()
      }
      // Add order and save user
      order = await order.save()
      user.orders.push(order)
      user = await user.save()
      // Return ok
      ctx.body = order.stripped()
      // Report
      notify(order)
    })
  }

  @Delete('/order/:id', authenticate)
  async deleteOrder(ctx: Context) {
    // Get user
    let user = ctx.state.user as InstanceType<User>
    // Get order
    let order = await OrderModel.findOne({ _id: ctx.params.id })
    // Validate order
    if (
      !order ||
      (order.user as InstanceType<User>)._id.toString() !== ctx.state.user.id
    ) {
      return ctx.throw(404, JSON.stringify(errors.orderNotFound))
    }
    if (order.completed) {
      return ctx.throw(403, JSON.stringify(errors.orderCompleted))
    }
    if (order.cancelled) {
      return ctx.throw(403, JSON.stringify(errors.orderCancelled))
    }
    // Cancel order
    await executeLocked(user.id, async () => {
      // Get fresh order
      order = await OrderModel.findOne({ _id: order.id })
      // Get fresh user
      user = await UserModel.findOne({ _id: user.id })
      // Cancel it
      order.cancelled = true
      // Add completion date
      order.completionDate = new Date()
      // Refund the money
      const first = order.crypto
        ? order.symbol.substr(0, 3).toLowerCase()
        : order.symbol.toLowerCase()
      const second = order.crypto
        ? order.symbol.substr(3, 3).toLowerCase()
        : 'usd'
      const isBuy = order.side === OrderSide.buy
      const incrementField = isBuy ? second : first
      user.balance[incrementField] = round(
        user.balance[incrementField] +
          order.heldAmount +
          (!order.crypto && isBuy ? order.fee : 0),
        { currency: incrementField }
      )
      user.markModified('balance')
      // Save user
      await user.save()
      // Save the order
      await order.save()
      // Return ok
      ctx.body = order.stripped()
      // Notify
      notify(order)
    })
  }
}
