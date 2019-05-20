/// Dependencies
import { User, UserModel } from '../models/user'
import { InstanceType } from 'typegoose'
import { executeLocked } from './locker'

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
