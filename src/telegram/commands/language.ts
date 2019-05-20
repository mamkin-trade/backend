// Dependencies
import { Telegraf, ContextMessageUpdate, Markup as m, Extra } from 'telegraf'
import { readdirSync, readFileSync } from 'fs'
import { safeLoad } from 'js-yaml'
import { ExtraEditMessage } from 'telegraf/typings/telegram-types'

export function setupLanguage(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('language', ctx => {
    ctx.reply(ctx.i18n.t('language'), {
      reply_markup: languageKeyboard(),
      reply_to_message_id: (ctx.message || ctx.channelPost).message_id,
    })
  })

  bot.action(localesFiles().map(file => file.split('.')[0]), async ctx => {
    let chat = ctx.dbchat
    chat.language = ctx.callbackQuery.data
    chat = await chat.save()
    const message = ctx.callbackQuery.message

    const anyI18N = ctx.i18n
    anyI18N.locale(ctx.callbackQuery.data)

    await ctx.telegram.editMessageText(
      message.chat.id,
      message.message_id,
      undefined,
      ctx.i18n.t('language_selected'),
      Extra.HTML(true) as ExtraEditMessage
    )
  })
}

function languageKeyboard() {
  const locales = localesFiles()
  const result = []
  locales.forEach((locale, index) => {
    const localeCode = locale.split('.')[0]
    const localeName = safeLoad(
      readFileSync(`${__dirname}/../../../locales/${locale}`, 'utf8')
    ).name
    if (index % 2 == 0) {
      if (index === 0) {
        result.push([m.callbackButton(localeName, localeCode)])
      } else {
        result[result.length - 1].push(m.callbackButton(localeName, localeCode))
      }
    } else {
      result[result.length - 1].push(m.callbackButton(localeName, localeCode))
      if (index < locales.length - 1) {
        result.push([])
      }
    }
  })
  return m.inlineKeyboard(result)
}

function localesFiles() {
  return readdirSync(`${__dirname}/../../../locales`)
}
