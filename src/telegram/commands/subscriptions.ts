// Dependencies
import Telegraf, { ContextMessageUpdate } from 'telegraf'
import { subscriptions } from '../../helpers/subscribe'

export function setupSubscriptions(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('subscriptions', async ctx => {
    const subs = await subscriptions(ctx.chat.id)
    if (!subs.length) {
      return ctx.reply(ctx.i18n.t('no_subs'), {
        reply_to_message_id: (ctx.message || ctx.channelPost).message_id,
      })
    }
    let text = `${ctx.i18n.t('subscriptions')}:\n`
    let i = 1
    for (const sub of subs) {
      text = `${text}\n${i++}. <a href="https://mamkin.trade/user/${sub.id}">${
        sub.name
      }</a>`
    }
    await ctx.replyWithHTML(text, {
      disable_web_page_preview: true,
      reply_to_message_id: (ctx.message || ctx.channelPost).message_id,
    })
  })
}
