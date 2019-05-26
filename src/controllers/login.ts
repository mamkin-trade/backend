// Dependencies
import axios from 'axios'
import { Context } from 'koa'
import { getOrCreateUser, UserModel } from '../models'
import { Controller, Post } from 'koa-router-ts'
import Facebook = require('facebook-node-sdk')
const TelegramLogin = require('node-telegram-login')
const Login = new TelegramLogin(process.env.TELEGRAM_LOGIN_TOKEN)
import * as md5 from 'md5'

@Controller('/login')
export default class {
  @Post('/facebook')
  async facebook(ctx: Context) {
    const fbProfile: any = await getFBUser(ctx.request.body.accessToken)
    const user = await getOrCreateUser({
      name: fbProfile.name,

      email: fbProfile.email,
      facebookId: fbProfile.id,
    })
    ctx.body = user.strippedAndFilled(true)
  }

  @Post('/telegram')
  async telegram(ctx: Context) {
    const data = ctx.request.body
    // verify the data
    if (!Login.checkLoginData(data)) {
      return ctx.throw(403)
    }

    const user = await getOrCreateUser({
      name: `${data.first_name}${data.last_name ? ` ${data.last_name}` : ''}`,
      telegramId: data.id,
    })
    ctx.body = user.strippedAndFilled(true)
  }

  @Post('/google')
  async google(ctx: Context) {
    const accessToken = ctx.request.body.accessToken

    const userData: any = (await axios(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${accessToken}`
    )).data

    const user = await getOrCreateUser({
      name: userData.name,

      email: userData.email,
    })
    ctx.body = user.strippedAndFilled(true)
  }

  @Post('/vk')
  async vk(ctx: Context) {
    const data = ctx.request.body
    const name = `${data.first_name}${
      data.last_name ? ` ${data.last_name}` : ''
    }`
    const id = data.uid
    const hash = data.hash
    if (!hash) {
      return ctx.throw(403)
    }
    // verify the data
    const stringToVerify = `${process.env.VK_APP_ID}${id}${
      process.env.VK_SECRET
    }`
    if (md5(stringToVerify) !== hash) {
      return ctx.throw(403)
    }
    const user = await getOrCreateUser({
      name,
      vkId: `${id}`,
    })
    ctx.body = user.strippedAndFilled(true)
  }

  @Post('/key')
  async key(ctx: Context) {
    const data = ctx.request.body
    const key = data.key
    if (!key) {
      return ctx.throw(403)
    }
    const userId = key.split('-')[0]
    if (!userId) {
      return ctx.throw(403)
    }
    const user = await UserModel.findById(userId)
    if (!user) {
      return ctx.throw(403)
    }
    if (user.apiKeys.indexOf(key) < 0) {
      return ctx.throw(403)
    }
    ctx.body = user.strippedAndFilled(true, false)
  }
}

function getFBUser(accessToken: string) {
  return new Promise((res, rej) => {
    const fb = new Facebook({
      appID: process.env.FACEBOOK_APP_ID,
      secret: process.env.FACEBOOK_APP_SECRET,
    })
    fb.setAccessToken(accessToken)
    fb.api('/me?fields=name,email,id', (err, user) => {
      return err ? rej(err) : res(user)
    })
  })
}
