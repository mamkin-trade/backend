// Dependencies
import { UserModel, User } from '../models'
import { report } from './report'

export let leaderboardBalanceUp = []
export let leaderboardBalanceDown = []
export let leaderboardSubscribersUp = []
export let leaderboardSubscribersDown = []

async function updateLeaderboard() {
  try {
    const users = (await UserModel.find({
      'orders.0': { $exists: true },
    }).populate('orders')).map(u => u.strippedAndFilled())

    leaderboardBalanceUp = users
      .sort((a: User, b: User) =>
        a.overallBalance > b.overallBalance ? -1 : 1
      )
      .slice(0, 10)
    leaderboardBalanceDown = users
      .sort((a: User, b: User) =>
        a.overallBalance < b.overallBalance ? -1 : 1
      )
      .slice(0, 10)
    leaderboardSubscribersUp = users
      .sort((a: any, b: any) => (a.subCount > b.subCount ? -1 : 1))
      .slice(0, 10)
    leaderboardSubscribersDown = users
      .sort((a: any, b: any) => (a.subCount > b.subCount ? -1 : 1))
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
