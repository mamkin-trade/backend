// Dependencies
import { Context } from 'koa'
import { Controller, Get } from 'koa-router-ts'
import { UserModel } from '../models'
import { leaderboard } from '../helpers/leaderboard'

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
      return ctx.throw(404, 'No user found')
    }
    ctx.body = user.strippedAndFilled()
  }
}
