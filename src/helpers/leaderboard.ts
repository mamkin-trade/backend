// Dependencies
import { UserModel, User } from '../models'
import { report } from './report'

export let leaderboard = []

async function updateLeaderboard() {
  try {
    leaderboard = (await UserModel.find({
      'orders.0': { $exists: true },
    }).populate('orders'))
      .map(u => u.strippedAndFilled())
      .sort((a: User, b: User) =>
        a.overallBalance > b.overallBalance ? -1 : 1
      )
      .slice(0, 10)
  } catch (err) {
    report(err)
  }
}

let isUpdating = false
;(async function startUpdatingLeaderboard() {
  await updateLeaderboard()
  setInterval(async () => {
    if (isUpdating) {
      return
    }
    isUpdating = true
    await updateLeaderboard()
    isUpdating = false
  }, 15 * 1000)
})()
