// Dependencies
import { UserModel } from '../models'
import { report } from './report'

export let leaderboard = []

async function updateLeaderboard() {
  try {
    leaderboard = (await UserModel.find()
      .limit(10)
      .populate('orders'))
      .map(u => u.strippedAndFilled())
      .sort((a, b) => (a.overallBalance > b.overallBalance ? -1 : 1))
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
