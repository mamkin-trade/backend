// Dependencies
import { Context } from 'koa'
import { Controller, Get } from 'koa-router-ts'

@Controller('/market')
export default class {
  @Get('/symbols')
  async leadeboard(ctx: Context) {
    ctx.body = [
      { name: 'James Bond', balance: 1000000 },
      { name: 'Pavel Durov', balance: 500000 },
      { name: 'Send Nudes', balance: 250000 },
      { name: 'Khalesee Dayeneris', balance: 125000 },
      { name: 'Noice Fun', balance: 62500 },
    ]
  }
}
