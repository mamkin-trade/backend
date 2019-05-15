// Dependencies
import { Context } from 'koa'
import { Controller, Get } from 'koa-router-ts'
import { stats } from '../helpers/stats'

@Controller('/')
export default class {
  @Get('stats')
  stats(ctx: Context) {
    ctx.body = stats
  }

  @Get('/')
  async index(ctx: Context) {
    ctx.redirect('https://github.com/mamkin-trade/backend/tree/master/docs')
  }
}
