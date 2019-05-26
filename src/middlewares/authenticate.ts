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
    const key = ctx.headers.key
    if (token) {
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
    } else if (key) {
      const userId = key.split('-')[0]
      if (!userId) {
        return ctx.throw(403, errors.noUser)
      }
      const user = await UserModel.findById(userId)
      if (!user) {
        return ctx.throw(403, errors.noUser)
      }
      if (user.apiKeys.indexOf(key) < 0) {
        return ctx.throw(403, JSON.stringify(errors.authentication))
      }
    } else {
      return ctx.throw(403, JSON.stringify(errors.authentication))
    }
  } catch (err) {
    await report(err)
    return ctx.throw(403, JSON.stringify(errors.authentication))
  }
  await next()
}
