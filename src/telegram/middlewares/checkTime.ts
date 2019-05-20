import { ContextMessageUpdate } from 'telegraf'

export async function checkTime(ctx: ContextMessageUpdate, next: () => any) {
  if (ctx.updateType === 'message') {
    const message = ctx.message || ctx.channelPost
    if (new Date().getTime() / 1000 - message.date < 5 * 60) {
      next()
    } else {
      console.log(
        `Ignoring message from ${ctx.from.id} at ${
          ctx.chat.id
        } (${new Date().getTime() / 1000}:${message.date})`
      )
    }
  } else {
    next()
  }
}
