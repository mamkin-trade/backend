// Dependencies
import { UserModel } from '../../models/user'
import { ContextMessageUpdate } from 'telegraf'

export function attachUser(command: string) {
  return async (ctx: ContextMessageUpdate, next) => {
    const msg = ctx.message || ctx.channelPost
    const id = msg.text.substr(command.length + 2)
    // Check if command with user id
    if (!msg || !msg.text || !id) {
      try {
        await ctx.replyWithHTML(ctx.i18n.t('help'), {
          reply_to_message_id: msg.message_id,
        })
      } finally {
        return undefined
      }
    }
    // Check if user with this id exists
    try {
      const user = await UserModel.findById(id)
      if (!user) {
        try {
          await ctx.reply(ctx.i18n.t('no_user', { id }), {
            reply_to_message_id: msg.message_id,
          })
        } finally {
          return undefined
        }
      }
      // Attach user and continue
      ctx.dbuser = user
      next()
    } catch (err) {
      console.error(err)
      try {
        await ctx.reply(ctx.i18n.t('no_user', { id }), {
          reply_to_message_id: msg.message_id,
        })
      } finally {
        return undefined
      }
    }
  }
}
