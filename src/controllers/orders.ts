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
import { executeLocked } from '../helpers/locker'
import { InstanceType } from 'typegoose'
import { errors } from '../helpers/errors'
import { Big } from 'big.js'
import { precision, round } from '../helpers/precision'
import { minimumOrderSize, maximumOrderSize } from '../helpers/orderSize'

const baseFee = 0.002

@Controller('/orders')
export default class {
  @Get('/user/:id')
  async orders(ctx: Context) {
    // Run query
    const user = await UserModel.findOne({ _id: ctx.params.id }).populate(
      'orders'
    )
    if (!user) {
      return ctx.throw(404, errors.noUser)
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
      return ctx.throw(404, errors.noUser)
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
    const amount = new Big(ctx.request.body.amount || 0)
    const fee = amount.mul(baseFee)
    let price = new Big(ctx.request.body.price || 0)
    // Split symbol
    const firstCurrency = symbol.substr(0, 3)
    const secondCurrency = symbol.substr(3)
    // Get current price
    if (type === 'market') {
      const uppercaseSymbol = symbol.toUpperCase()
      price =
        side === OrderSide.buy
          ? new Big(tickers[uppercaseSymbol].ask)
          : new Big(tickers[uppercaseSymbol].bid)
    }
    // Check price
    if (price.lte(0)) {
      return ctx.throw(400, errors.priceLessThanZero)
    }
    if (
      price.lt(
        new Big(1).div(
          new Big(10).pow(precision(firstCurrency) + precision(secondCurrency))
        )
      )
    ) {
      return ctx.throw(400, errors.priceLessThanMinimum)
    }
    if (price.gt(100000000)) {
      return ctx.throw(400, errors.priceMoreThanMaximum)
    }
    // Check amount
    if (amount.lte(0)) {
      return ctx.throw(400, errors.amountLessThanZero)
    }
    if (amount.lt(minimumOrderSize(symbol))) {
      return ctx.throw(400, errors.amountLessThanMinimumOrder)
    }
    if (amount.gt(maximumOrderSize(symbol))) {
      return ctx.throw(400, errors.amountMoreThanMaximumOrder)
    }
    // Create order
    const isTypeMarket = type === OrderType.market
    let order = new OrderModel({
      symbol,
      amount: Number(amount),
      side,
      type,
      completed: isTypeMarket,
      price: Number(price),
      user: ctx.state.user,
      heldAmount: Number(side === OrderSide.buy ? price.mul(amount) : amount),
      fee: Number(fee),
    })
    // Check if user can afford this order and add or execute it
    let user = ctx.state.user as InstanceType<User>
    await executeLocked(user.id, async () => {
      // Destruct symbols
      const first = symbol.substr(0, 3).toLowerCase()
      const second = symbol.substr(3, 3).toLowerCase()
      // Get fresh user
      user = await UserModel.findOne({ _id: user.id })
      // Check if user has enough currency
      if (
        (order.side === OrderSide.buy &&
          (user.balance[second] || 0) < Number(price.mul(amount))) ||
        (order.side === OrderSide.sell && (user.balance[first] || 0) < amount)
      ) {
        return ctx.throw(403, errors.insufficientFunds)
      }
      // Execute
      if (side === OrderSide.buy) {
        user.balance[second] = round(user.balance[second] - order.heldAmount, {
          currency: second,
        })
        if (type === OrderType.market) {
          user.balance[first] = round(
            amount.minus(fee).add(user.balance[first] || 0),
            { currency: first }
          )
        }
      } else {
        user.balance[first] = round(user.balance[first] - order.heldAmount, {
          currency: first,
        })
        if (type === OrderType.market) {
          user.balance[second] = round(
            price.mul(amount.minus(fee)).add(user.balance[second] || 0),
            { currency: second }
          )
        }
      }
      user.markModified('balance')
      if (type === OrderType.market) {
        order.completionDate = new Date()
      }
      // Add order and save user
      order = await order.save()
      user.orders.push(order)
      user = await user.save()
      // Return ok
      ctx.body = order.stripped()
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
      return ctx.throw(404, errors.orderNotFound)
    }
    if (order.completed) {
      return ctx.throw(403, errors.orderCompleted)
    }
    if (order.cancelled) {
      return ctx.throw(403, errors.orderCancelled)
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
      const first = order.symbol.substr(0, 3).toLowerCase()
      const second = order.symbol.substr(3, 3).toLowerCase()
      const incrementField = order.side === OrderSide.buy ? second : first
      user.balance[incrementField] = round(
        user.balance[incrementField] + order.heldAmount,
        { currency: incrementField }
      )
      user.markModified('balance')
      // Save user
      await user.save()
      // Save the order
      await order.save()
      // Return ok
      ctx.body = order.stripped()
    })
  }
}
