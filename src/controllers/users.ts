// Dependencies
import { Context } from 'koa'
import { Controller, Get, Post } from 'koa-router-ts'
import { UserModel, User } from '../models'
import { leaderboard } from '../helpers/leaderboard'
import { errors } from '../helpers/errors'
import { authenticate } from '../middlewares/authenticate'
import { InstanceType } from 'typegoose'

@Controller('/users')
export default class {
  @Get('/leaderboard')
  async leadeboard(ctx: Context) {
    ctx.body = leaderboard
  }

  @Get('/:id')
  async user(ctx: Context) {
    const user = await UserModel.findOne({ _id: ctx.params.id }).populate(
      'orders'
    )
    if (!user) {
      return ctx.throw(404, errors.noUser)
    }
    ctx.body = user.strippedAndFilled()
  }

  @Post('/reset', authenticate)
  async reset(ctx: Context) {
    let user = ctx.state.user as InstanceType<User>
    console.log(user)
    user.balance = { usd: 10000 }
    user.markModified('balance')
    user.orders = []
    user = await user.save()
    ctx.body = user
  }
}
