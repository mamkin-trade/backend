// Dependencies
import { bot } from '../telegram'
import { User, UserModel } from '../models/user'
import { executeLocked } from './locker'
import { Order } from '../models/order'
import { InstanceType } from 'typegoose'
import { report } from './report'

export async function subscribe(telegramId: number, user: InstanceType<User>) {
  await executeLocked(user.id, async () => {
    // Get fresh user
    user = await UserModel.findById(user.id)
    // Add subscription
    if (user.subscribers.indexOf(telegramId) > -1) {
      return
    }
    user.subscribers.push(telegramId)
    await user.save()
  })
}

export async function unsubscribe(
  telegramId: number,
  user: InstanceType<User>
) {
  await executeLocked(user.id, async () => {
    // Get fresh user
    user = await UserModel.findById(user.id)
    // Remove subscription
    user.subscribers = user.subscribers.filter(n => n !== telegramId)
    await user.save()
  })
}

export function subscriptions(telegramId: number) {
  return UserModel.find({ subscribers: telegramId })
}

export async function unsubscribeAll(telegramId: number) {
  const users = await UserModel.find({ subscribers: telegramId })
  for (const user of users) {
    await unsubscribe(telegramId, user)
  }
}

export async function notify(order: Order) {
  try {
    let user = order.user as InstanceType<User>
    if (!user || !user.id || !user.name) {
      user = await UserModel.findOne({ _id: order.user })
    }
    let text = ''
    if (order.type === 'market') {
      text = `<a href="https://mamkin.trade/user/${user.id}">${
        user.name
      }</a>\nExecuted: ${order.type} - ${order.symbol} - ${order.side} - ${
        order.price
      } - ${order.amount}`
    } else if (order.cancelled) {
      text = `<a href="https://mamkin.trade/user/${user.id}">${
        user.name
      }</a>\nCancelled: ${order.type} - ${order.symbol} - ${order.side} - ${
        order.price
      } - ${order.amount}`
    } else if (order.completed) {
      text = `<a href="https://mamkin.trade/user/${user.id}">${
        user.name
      }</a>\nExecuted: ${order.type} - ${order.symbol} - ${order.side} - ${
        order.price
      } - ${order.amount}`
    } else {
      text = `<a href="https://mamkin.trade/user/${user.id}">${
        user.name
      }</a>\nCreated: ${order.type} - ${order.symbol} - ${order.side} - ${
        order.price
      } - ${order.amount}`
    }
    for (const subscriberId of user.subscribers) {
      try {
        await bot.telegram.sendMessage(subscriberId, text, {
          disable_web_page_preview: true,
          parse_mode: 'HTML',
        })
      } catch (err) {
        await report(err)
      }
    }
  } catch (err) {
    await report(err)
  }
}
