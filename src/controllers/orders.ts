// Dependencies
import { Context } from 'koa'
import { Controller, Get } from 'koa-router-ts'
import { authenticate } from '../middlewares/authenticate'
import { UserModel } from '../models'

@Controller('/orders')
export default class {
  @Get('/user/:id')
  async orders(ctx: Context) {
    const user = await UserModel.findOne(
      { _id: ctx.params.id },
      { orders: { $slice: [ctx.params.skip || 0, ctx.params.limit || 20] } }
    )
    if (!user) {
      return ctx.throw(404, 'No user found')
    }
    ctx.body = user.orders
  }

  @Get('/:id', authenticate)
  async user(ctx: Context) {
    const user = await UserModel.findOne({ _id: ctx.params.id })
    if (!user) {
      return ctx.throw(404, 'No user found')
    }
    ctx.body = user.strippedAndFilled()
  }
}
