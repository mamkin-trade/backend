// Dependencies
import { UserModel, User } from '../models/user'
import { Context } from 'koa'
import { verify } from '../helpers/jwt'
import { errors } from '../helpers/errors'
import { InstanceType } from 'typegoose'
import { report } from '../helpers/report'

export async function authenticate(ctx: Context, next: Function) {
  try {
    const token = ctx.headers.token
    const payload = (await verify(token)) as any
    let user: InstanceType<User>
    if (payload.email) {
      user = await UserModel.findOne({ email: payload.email })
    } else if (payload.facebookId) {
      user = await UserModel.findOne({ facebookId: `${payload.facebookId}` })
    } else if (payload.telegramId) {
      user = await UserModel.findOne({ telegramId: `${payload.telegramId}` })
    } else if (payload.vkId) {
      user = await UserModel.findOne({ vkId: `${payload.vkId}` })
    }
    if (!user) {
      return ctx.throw(403, errors.noUser)
    }
    ctx.state.user = user
  } catch (err) {
    await report(err)
    return ctx.throw(403, JSON.stringify(errors.authentication))
  }
  await next()
}
