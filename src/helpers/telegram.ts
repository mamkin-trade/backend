// Dependencies
import { UserModel } from '../models/user'
import Telegraf from 'telegraf'
import {
  unsubscribe,
  subscribe,
  unsubscribeAll,
  subscriptions,
} from './subscribe'

export const bot = new Telegraf(process.env.TELEGRAM_LOGIN_TOKEN, {
  channelMode: true,
} as any)

const helpMessage =
  'Hi there! Please, use this bot to login to mamkin.trade and to subscribe to user\'s orders by sending message like <code>/sub 5cdaee8e90284b6080988ea1</code>. You can also unsubscribe by sending message like <code>/unsubscribe 5cdaee8e90284b6080988ea1</code> or /unsubscribeAll to unsubscribe from all users. Use /subscriptions to view the current list of subscriptions.\n\nForward any questions to our <a href="https://t.me/joinchat/BIlEBxNgY3QDF3bzmigJsQ">trading group</a>. Thank you!'

bot.help(async ctx => {
  await ctx.replyWithHTML(helpMessage, {
    disable_web_page_preview: true,
  })
})
bot.start(async ctx => {
  const msg = ctx.message || ctx.channelPost
  const id = msg.text.substr(7)
  if (!msg || !msg.text || !id) {
    return ctx.replyWithHTML(helpMessage)
  }
  const user = await UserModel.findById(id)
  if (!user) {
    return ctx.reply(`No user found with id ${id}.`)
  }
  await subscribe(ctx.chat.id, user)
  await ctx.reply('All done!')
})
bot.command('subscribe', async ctx => {
  const msg = ctx.message || ctx.channelPost
  const id = msg.text.substr(11)
  if (!msg || !msg.text || !id) {
    return ctx.replyWithHTML(helpMessage)
  }
  const user = await UserModel.findById(id)
  if (!user) {
    return ctx.reply(`No user found with id ${id}.`)
  }
  await subscribe(ctx.chat.id, user)
  await ctx.reply('All done!')
})
bot.command('unsubscribe', async ctx => {
  const msg = ctx.message || ctx.channelPost
  const id = msg.text.substr(13)
  if (!msg || !msg.text || !id) {
    return ctx.replyWithHTML(helpMessage)
  }
  const user = await UserModel.findById(id)
  if (!user) {
    return ctx.reply(`No user found with id ${id}.`)
  }
  await unsubscribe(ctx.chat.id, user)
  await ctx.reply('All done!')
})
bot.command('unsubscribeAll', async ctx => {
  await unsubscribeAll(ctx.chat.id)
  await ctx.reply('All done!')
})
bot.command('subscriptions', async ctx => {
  const subs = await subscriptions(ctx.chat.id)
  if (!subs.length) {
    return ctx.reply('No subscriptions yet.')
  }
  let text = 'Subscriptions:\n'
  for (const sub of subs) {
    text = `${text}\n<a href="https://mamkin.trade/users/${sub}">${sub}</a>`
  }
  await ctx.replyWithHTML(text, { disable_web_page_preview: true })
})
bot.catch(console.error)

bot.launch()
