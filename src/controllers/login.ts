// Dependencies
import { Context } from 'koa'
import { getOrCreateUser } from '../models'
import { Controller, Post } from 'koa-router-ts'
import Facebook = require('facebook-node-sdk')
const TelegramLogin = require('node-telegram-login');
const Login = new TelegramLogin(process.env.TELEGRAM_LOGIN_TOKEN);

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
    console.log(data)
    // verify the data
    if (!Login.checkLoginData(data)) {
      throw new Error()
    }

    const user = await getOrCreateUser({
      name: `${data.first_name}${data.last_name ? ` ${data.last_name}` : ''}`, 
      telegramId: data.id,
    })
    ctx.body = user.strippedAndFilled(true)
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
