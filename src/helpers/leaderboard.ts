// Dependencies
import { UserModel } from '../models'
import { report } from './report'

export let leaderboard = []

async function updateLeaderboard() {
  try {
    leaderboard = (await UserModel.find().limit(10))
      .map(u => u.strippedAndFilled())
      .sort((a, b) => (a._doc.overallBalance > b._doc.overallBalance ? -1 : 1))
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
