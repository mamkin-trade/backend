// Dependencies
import { OrderModel, OrderSide, Order, User, UserModel } from '../models'
import { tickers } from './bitfinex'
import { executeLocked } from './locker'
import { InstanceType } from 'typegoose'
import { report } from './report'
import { Big } from 'big.js'
import { round } from './precision'

let checking = false
const baseFee = 0.001

export function startCheckingOrders() {
  checkOrders()
  setInterval(async () => {
    if (checking) {
      return
    }
    checking = true
    try {
      await checkOrders()
    } finally {
      checking = false
    }
  }, 5 * 1000)
}

async function checkOrders() {
  // Get acitve orders
  let activeOrders: InstanceType<Order>[] = await OrderModel.find({
    completed: false,
    cancelled: false,
  })
  // Filter only actionable
  activeOrders = activeOrders.filter(o => {
    const ticker = tickers[o.symbol]
    if (!ticker) {
      return false
    }
    if (o.side === OrderSide.buy) {
      return ticker.ask <= o.price
    } else {
      return ticker.bid >= o.price
    }
  })
  // Execute actionable orders
  const promises = []
  for (const order of activeOrders) {
    promises.push(
      new Promise(async res => {
        try {
          let user = order.user as InstanceType<User>
          await executeLocked(user.id, async () => {
            // Get frsh order
            const freshOrder = await OrderModel.findOne({ _id: order.id })
            // Check if order is still ok
            if (freshOrder.completed || freshOrder.cancelled) {
              return
            }
            // Get big amount
            const amount = new Big(freshOrder.amount)
            const fee = amount.mul(baseFee)
            // Get fresh user
            user = await UserModel.findOne({ _id: user._id })
            // Destruct symbols
            const first = freshOrder.symbol.substr(0, 3).toLowerCase()
            const second = freshOrder.symbol.substr(3, 3).toLowerCase()
            // Modify user
            if (freshOrder.side === OrderSide.buy) {
              user.balance[first] = round(
                amount.minus(fee).add(user.balance[first] || 0),
                { currency: first }
              )
            } else {
              user.balance[second] = round(
                amount
                  .minus(fee)
                  .mul(freshOrder.price)
                  .add(user.balance[second] || 0),
                { currency: second }
              )
            }
            user.markModified('balance')
            // Save user
            await user.save()
            // Modify and save order
            freshOrder.completed = true
            freshOrder.completionDate = new Date()
            await freshOrder.save()
          })
        } catch (err) {
          await report(err)
        } finally {
          res()
        }
      })
    )
  }
  await Promise.all(promises)
}
