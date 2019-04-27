// Dependencies
import { Context } from 'koa'
import { Controller, Get } from 'koa-router-ts'

@Controller('/')
export default class {
  @Get('/')
  async index(ctx: Context) {
    ctx.redirect('https://github.com/mamkin-trade/backend/tree/master/docs')
  }
}
