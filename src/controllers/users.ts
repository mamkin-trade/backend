// Dependencies
import { Context } from 'koa'
import { Controller, Get } from 'koa-router-ts'
import { UserModel } from '../models'

@Controller('/users')
export default class {
  @Get('/leaderboard')
  async leadeboard(ctx: Context) {
    ctx.body = [
      { name: 'James Bond', balance: 1000000 },
      { name: 'Pavel Durov', balance: 500000 },
      { name: 'Send Nudes', balance: 250000 },
      { name: 'Khalesee Dayeneris', balance: 125000 },
      { name: 'Noice Fun', balance: 62500 },
    ]
  }

  @Get('/:id')
  async user(ctx: Context) {
    const user = await UserModel.findOne({ _id: ctx.params.id })
    if (!user) {
      return ctx.throw(404, 'No user found')
    }
    ctx.body = user.strippedAndFilled()
  }
}
