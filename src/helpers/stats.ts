// Dependencies
import { UserModel, OrderModel } from '../models'
import { report } from './report'

export let stats = {}

async function updateStats() {
  try {
    const userCount = await UserModel.find().countDocuments()
    const ordersCount = await OrderModel.find().countDocuments()
    const users = await UserModel.find().populate('orders')
    const filledUsers: any[] = users.map(u => {
      try {
        return u.strippedAndFilled()
      } catch (err) {
        return undefined
      }
    })
    const totalUSDTraded = filledUsers.reduce((prev, cur) => {
      return cur ? prev + cur.overallBalance : prev
    }, 0)
    stats = {
      userCount,
      ordersCount,
      totalUSDTraded,
    }
  } catch (err) {
    report(err)
  }
}

let isUpdating = false
;(async function startUpdatingStats() {
  await updateStats()
  setInterval(async () => {
    if (isUpdating) {
      return
    }
    isUpdating = true
    await updateStats()
    isUpdating = false
  }, 60 * 1000)
})()
