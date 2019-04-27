// Dependencies
import { OrderModel, OrderSide, Order, User, UserModel } from '../models'
import { tickers } from './bitfinex'
import { executeLocked } from './locker'
import { InstanceType } from 'typegoose'
import { report } from './report'

let checking = false

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
            // Get fresh user
            user = await UserModel.findOne({ id: user.id })
            // Destruct symbols
            const first = freshOrder.symbol.substr(0, 3).toLowerCase()
            const second = freshOrder.symbol.substr(3, 3).toLowerCase()
            // Modify user
            if (freshOrder.side === OrderSide.buy) {
              user.balance[first] =
                (user.balance[first] || 0) + freshOrder.amount
            } else {
              user.balance[second] =
                (user.balance[second] || 0) +
                freshOrder.amount * freshOrder.price
            }
            user.markModified('balance')
            // Save user
            await user.save()
            // Modify and save order
            freshOrder.completed = true
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
