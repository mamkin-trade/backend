// Dependencies
import { Context } from 'koa'
import * as jwt from '../helpers/jwt'
import { getOrCreateUser } from '../models'
import { Controller, Post } from 'koa-router-ts'

@Controller('/login')
export default class {
  @Post('/facebook')
  async facebook(ctx: Context) {
    const accessToken = await jwt.sign({})
    ctx.body = {
      accessToken,
    }
  }

  @Post('/email')
  async email(ctx: Context) {
    const email = ctx.request.body.email
    const user = await getOrCreateUser(email)
    ctx.body = {
      accessToken: user.token,
    }
  }
}
