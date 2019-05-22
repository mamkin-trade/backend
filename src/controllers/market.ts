// Dependencies
import { Context } from 'koa'
import { Controller, Get } from 'koa-router-ts'
import { tickers } from '../helpers/bitfinex'
import { nasdaq } from '../helpers/nasdaq'

@Controller('/market')
export default class {
  @Get('/tickers')
  async tickers(ctx: Context) {
    ctx.body = tickers
  }

  @Get('/nasdaq')
  async nasdaq(ctx: Context) {
    ctx.body = nasdaq
  }
}
