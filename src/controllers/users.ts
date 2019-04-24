// Dependencies
import { Context } from 'koa'

export async function leaderboard(context: Context) {
  console.log(123)
  context.body = [
    { name: 'James Bond', balance: 1000000 },
    { name: 'Pavel Durov', balance: 500000 },
    { name: 'Send Nudes', balance: 250000 },
    { name: 'Khalesee Dayeneris', balance: 125000 },
    { name: 'Noice Fun', balance: 62500 },
  ]
}
