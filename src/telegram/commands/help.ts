// Dependencies
import Telegraf, { ContextMessageUpdate } from 'telegraf'

export function setupHelp(bot: Telegraf<ContextMessageUpdate>) {
  bot.help(async ctx => {
    await ctx.replyWithHTML(ctx.i18n.t('help'), {
      disable_web_page_preview: true,
      reply_to_message_id: (ctx.message || ctx.channelPost).message_id,
    })
  })
}
