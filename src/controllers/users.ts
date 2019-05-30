// Dependencies
import { Context } from 'koa'
import { Controller, Get, Post, Delete } from 'koa-router-ts'
import { UserModel, User } from '../models'
import {
  leaderboardBalanceUp,
  leaderboardBalanceDown,
  leaderboardSubscribersUp,
  leaderboardSubscribersDown,
} from '../helpers/leaderboard'
import { errors } from '../helpers/errors'
import { authenticate } from '../middlewares/authenticate'
import { InstanceType } from 'typegoose'
const randomToken = require('random-token')

@Controller('/users')
export default class {
  @Get('/leaderboard')
  leadeboard(ctx: Context) {
    if (ctx.query.sortBy === 'subscribers') {
      if (ctx.query.descending === 'false') {
        ctx.body = leaderboardSubscribersDown.slice(0, 10)
      } else {
        ctx.body = leaderboardSubscribersUp.slice(0, 10)
      }
    } else {
      if (ctx.query.descending === 'false') {
        ctx.body = leaderboardBalanceDown.slice(0, 10)
      } else {
        ctx.body = leaderboardBalanceUp.slice(0, 10)
      }
    }
  }

  @Get('/leaderboard/position/:id')
  async leadeboardPosition(ctx: Context) {
    const user = await UserModel.findById(ctx.params.id)
    if (!user) {
      return ctx.throw(404, JSON.stringify(errors.noUser))
    }
    // If no orders, then return it
    if (!user.orders.length) {
      ctx.body = { ordersCount: 0 }
      return
    }
    const userCount = leaderboardBalanceDown.length
    const userPosition = leaderboardBalanceDown.findIndex(
      u => u._id === user._id
    )
    if (userPosition < 0) {
      ctx.throw(500)
    }
    ctx.body = {
      ordersCount: user.orders.length,
      absoluteNumberOfUsersAbove: userPosition,
      relativeNumberOfUsersAbove: Math.ceil(userPosition / userCount),
    }
  }

  @Get('/keys', authenticate)
  keys(ctx: Context) {
    let user = ctx.state.user as InstanceType<User>
    ctx.body = user.apiKeys
    ctx.status = 200
  }

  @Post('/keys', authenticate)
  async addKey(ctx: Context) {
    let user = ctx.state.user as InstanceType<User>
    const key = `${user.id}-${randomToken(20)}`
    user.apiKeys.push(key)
    await user.save()
    ctx.body = key
  }

  @Delete('/key/:id', authenticate)
  async deleteKey(ctx: Context) {
    let user = ctx.state.user as InstanceType<User>
    user.apiKeys = user.apiKeys.filter(k => k !== ctx.params.id)
    await user.save()
    ctx.status = 200
  }

  @Get('/:id')
  async user(ctx: Context) {
    const user = await UserModel.findById(ctx.params.id).populate('orders')
    if (!user) {
      return ctx.throw(404, JSON.stringify(errors.noUser))
    }
    ctx.body = user.strippedAndFilled()
  }

  @Post('/reset', authenticate)
  async reset(ctx: Context) {
    let user = ctx.state.user as InstanceType<User>
    user.balance = { usd: 10000 }
    user.markModified('balance')
    user.orders = []
    user = await user.save()
    ctx.body = user
  }
}
