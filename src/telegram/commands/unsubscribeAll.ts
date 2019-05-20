// Dependencies
import Telegraf, { ContextMessageUpdate } from 'telegraf'
import { unsubscribeAll } from '../../helpers/subscribe'

export function setupUnsubscribeAll(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('unsubscribeAll', async ctx => {
    await unsubscribeAll(ctx.chat.id)
    await ctx.reply(ctx.i18n.t('done'), {
      reply_to_message_id: (ctx.message || ctx.channelPost).message_id,
    })
  })
}
