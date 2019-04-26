// Dependencies
import { Context } from 'koa'
import { Controller, Get } from 'koa-router-ts'
import { tickers } from '../helpers/bitfinex'

@Controller('/market')
export default class {
  @Get('/tickers')
  async tickers(ctx: Context) {
    ctx.body = tickers
  }
}
