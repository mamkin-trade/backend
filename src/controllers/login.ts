// Dependencies
import { Context } from 'koa'
import * as jwt from '../helpers/jwt'

export async function facebook(context: Context) {
  const accessToken = await jwt.sign({})
  context.body = {
    accessToken,
  }
}
