// Dependencies
import { Context } from 'koa'

export async function smoke(context: Context) {
  context.status = 200
}
