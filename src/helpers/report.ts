// Dependencies
import Telegraf from 'telegraf'

export const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

export async function tryReport<T>(fun: (() => T) | Promise<T>) {
  try {
    const result = await (fun instanceof Function ? fun() : fun)
    return result
  } catch (err) {
    await report(err)
    return undefined
  }
}

export async function report(err: Error) {
  const dismissableErrors = ['unexpected server response (429)', 'ECONNRESET']
  try {
    let text = `MT Error:\n<code>${err.message || JSON.stringify(err)}</code>`
    if (err.stack) {
      text = `${text}\n\n<code>${err.stack
        .replace('<', '{{')
        .replace('>', '}}')}</code>`
    }
    for (const errorText of dismissableErrors) {
      if (text.indexOf(errorText) > -1) {
        return
      }
    }
    bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN, text, {
      parse_mode: 'HTML',
    })
  } catch (error) {
    console.error(err)
    console.error(error)
  }
}
