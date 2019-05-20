// Dependencies
import Telegraf, { ContextMessageUpdate } from 'telegraf'
import { attachUser } from '../helpers/checkId'
import { subscribe } from '../../helpers/subscribe'

export function setupStart(bot: Telegraf<ContextMessageUpdate>) {
  bot.start(attachUser('start'), async ctx => {
    await subscribe(ctx.chat.id, ctx.dbuser)
    await ctx.reply(ctx.i18n.t('done'), {
      reply_to_message_id: (ctx.message || ctx.channelPost).message_id,
    })
  })
}
