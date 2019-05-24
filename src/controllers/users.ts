// Dependencies
import { Context } from 'koa'
import { Controller, Get, Post } from 'koa-router-ts'
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

@Controller('/users')
export default class {
  @Get('/leaderboard')
  async leadeboard(ctx: Context) {
    if (ctx.query.sortBy === 'subscribers') {
      if (ctx.query.descending === 'false') {
        ctx.body = leaderboardSubscribersDown
      } else {
        ctx.body = leaderboardSubscribersUp
      }
    } else {
      if (ctx.query.descending === 'false') {
        ctx.body = leaderboardBalanceDown
      } else {
        ctx.body = leaderboardBalanceUp
      }
    }
  }

  @Get('/:id')
  async user(ctx: Context) {
    const user = await UserModel.findOne({ _id: ctx.params.id }).populate(
      'orders'
    )
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
