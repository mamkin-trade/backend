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

@Controller('/orders')
export default class {
  @Get('/user/:id')
  async orders(ctx: Context) {
    // Construct query
    const query: any = { _id: ctx.params.id }
    if (ctx.params.completed !== undefined) {
      query.completed = ctx.params.completed
    }
    if (ctx.params.cancelled !== undefined) {
      query.cancelled = ctx.params.cancelled
    }
    // Run query
    const user = await UserModel.findOne(query).populate('orders')
    if (!user) {
      return ctx.throw(404, 'No user found')
    }
    const orders = user.orders
      .sort((a: InstanceType<Order>, b: InstanceType<Order>) =>
        a._doc.createdAt > b._doc.createdAt ? -1 : 1
      )
      .slice(ctx.request.body.skip || 0, ctx.request.body.limit || 20)
      .map((o: InstanceType<Order>) => o.stripped())
    ctx.body = orders
  }

  @Post('/order', authenticate)
  async postOrder(ctx: Context) {
    // Destruct params
    const { symbol, amount, side, type } = ctx.request.body
    let price = ctx.request.body.price
    // Get current price
    if (type === 'market') {
      const uppercaseSymbol = symbol.toUpperCase()
      price =
        side === OrderSide.buy
          ? tickers[uppercaseSymbol].ask
          : tickers[uppercaseSymbol].bid
    }
    // Create order
    const isTypeMarket = type === OrderType.market
    let order = new OrderModel({
      symbol,
      amount,
      side,
      type,
      completed: isTypeMarket,
      price,
      user: ctx.state.user,
      heldAmount: side === OrderSide.buy ? amount * price : amount,
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
          user.balance[second] < amount * price) ||
        (order.side === OrderSide.sell && (user.balance[first] || 0) < amount)
      ) {
        return ctx.throw(403, 'Insufficient funds')
      }
      // Execute
      if (side === OrderSide.buy) {
        user.balance[second] = user.balance[second] - order.heldAmount
        if (type === OrderType.market) {
          user.balance[first] = (user.balance[first] || 0) + amount
        }
      } else {
        user.balance[first] = user.balance[first] - order.heldAmount
        if (type === OrderType.market) {
          user.balance[second] = (user.balance[second] || 0) + amount * price
        }
      }
      user.markModified('balance')
      order.completionDate = new Date()
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
      return ctx.throw(404, 'Order not found')
    }
    if (order.completed) {
      return ctx.throw(403, 'Order is already completed')
    }
    if (order.cancelled) {
      return ctx.throw(403, 'Order is already cancelled')
    }
    // Cancel order
    await executeLocked(user.id, async () => {
      // Get fresh order
      order = await OrderModel.findOne({ _id: order.id })
      // Get fresh user
      user = await UserModel.findOne({ _id: user.id })
      // Cancel it
      order.cancelled = true
      // Refund the money
      const first = order.symbol.substr(0, 3).toLowerCase()
      const second = order.symbol.substr(3, 3).toLowerCase()
      const incrementField = order.side === OrderSide.buy ? second : first
      user.balance[incrementField] =
        user.balance[incrementField] + order.heldAmount
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
