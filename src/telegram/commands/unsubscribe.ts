// Dependencies
import Telegraf, { ContextMessageUpdate } from 'telegraf'
import { attachUser } from '../helpers/checkId'
import { unsubscribe } from '../../helpers/subscribe'

export function setupUnsubscribe(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('unsubscribe', attachUser('unsubscribe'), async ctx => {
    await unsubscribe(ctx.chat.id, ctx.dbuser)
    await ctx.reply(ctx.i18n.t('done'), {
      reply_to_message_id: (ctx.message || ctx.channelPost).message_id,
    })
  })
}
