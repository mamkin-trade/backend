// Dependencies
import { findChat } from '../../models/Chat'
import { ContextMessageUpdate } from 'telegraf'

export async function attachChat(ctx: ContextMessageUpdate, next) {
  const dbchat = await findChat(ctx.chat.id)
  ctx.dbchat = dbchat
  next()
}
