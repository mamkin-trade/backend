// Dependencies
import Telegraf from 'telegraf'
import { checkTime } from './middlewares/checkTime'
import { attachChat } from './middlewares/attachChat'
import { setupI18N } from './middlewares/i18n'
import { setupLanguage } from './commands/language'
import { setupHelp } from './commands/help'
import { setupStart } from './commands/start'
import { setupSubscribe } from './commands/subscribe'
import { setupUnsubscribe } from './commands/unsubscribe'
import { setupUnsubscribeAll } from './commands/unsubscribeAll'
import { setupSubscriptions } from './commands/subscriptions'
import { report } from '../helpers/report'

export const bot = new Telegraf(process.env.TELEGRAM_LOGIN_TOKEN, {
  channelMode: true,
} as any)

// Middlewares
bot.use(checkTime)
bot.use(attachChat)
// i18n
setupI18N(bot)
// Commands
setupLanguage(bot)
setupHelp(bot)
setupStart(bot)
setupSubscribe(bot)
setupUnsubscribe(bot)
setupUnsubscribeAll(bot)
setupSubscriptions(bot)
// Start bot
bot.catch(report)
bot.launch()
