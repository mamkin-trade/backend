// Dependencies
import { UserModel } from '../models/user'
import { Context } from 'koa'
import { verify } from '../helpers/jwt'
import { errors } from '../helpers/errors'

export async function authenticate(ctx: Context, next: Function) {
  try {
    const token = ctx.headers.token
    const payload = (await verify(token)) as any
    const user = await UserModel.findOne({ email: payload.email })
    if (!user) {
      return ctx.throw(403, errors.noUser)
    }
    ctx.state.user = user
  } catch (err) {
    return ctx.throw(403, errors.authentication)
  }
  await next()
}
