// Dependencies
import { sign } from '../helpers/jwt'
import {
  prop,
  Typegoose,
  instanceMethod,
  arrayProp,
  Ref,
  InstanceType,
} from 'typegoose'
import { omit } from 'lodash'
import { tickers } from '../helpers/bitfinex'
import { Order, OrderSide } from './order'

export class User extends Typegoose {
  @prop({ index: true, lowercase: true })
  email?: string
  @prop({ index: true, lowercase: true })
  facebookId?: string
  @prop({ index: true, lowercase: true })
  telegramId?: string

  @prop({ required: true, index: true })
  name: string

  @prop({ required: true, index: true, unique: true })
  token: string

  @prop({ required: true, default: { usd: 10000 } })
  balance: object

  @arrayProp({ required: true, itemsRef: Order, default: [] })
  orders: Ref<Order>[]

  @arrayProp({ required: true, items: Number, default: [] })
  subscribers: number[]

  @instanceMethod
  strippedAndFilled(withToken = false) {
    const stripFields = [
      'createdAt',
      'updatedAt',
      '__v',
      'orders',
      'subscribers',
    ]
    if (!withToken) {
      stripFields.push('token')
      stripFields.push('email')
      stripFields.push('facebookId')
      stripFields.push('telegramId')
    }
    this._doc.overallBalance = this.overallBalance
    for (const activeOrder of this.orders.filter(
      (o: Order) => !o.completed && !o.cancelled
    ) as Order[]) {
      // Destruct symbols
      const first = activeOrder.symbol.substr(0, 3).toLowerCase()
      const second = activeOrder.symbol.substr(3, 3).toLowerCase()
      // Add balances from orders
      if (activeOrder.side === OrderSide.buy) {
        if (second === 'usd') {
          this._doc.overallBalance += activeOrder.heldAmount
        } else {
          const conversionRate = tickers[`${second.toUpperCase()}USD`]
          this._doc.overallBalance +=
            activeOrder.heldAmount * conversionRate.bid
        }
      } else {
        const value = activeOrder.heldAmount
        const simpleRate = tickers[`${first.toUpperCase()}USD`]
        if (simpleRate) {
          this._doc.overallBalance += value * simpleRate.bid
        } else {
          const firstConversionRate = tickers[`${first.toUpperCase()}BTC`]
          const secondConversionRate = tickers['BTCUSD']
          if (!firstConversionRate || !secondConversionRate) {
            continue
          }
          this._doc.overallBalance +=
            value * firstConversionRate.bid * secondConversionRate.bid
        }
      }
    }
    return omit(this._doc, stripFields)
  }

  @prop()
  get overallBalance() {
    let balance = 0
    for (const key of Object.keys(this.balance)) {
      const value = this.balance[key]
      if (key === 'usd') {
        balance += value
        continue
      }
      const simpleRate = tickers[`${key.toUpperCase()}USD`]
      if (simpleRate) {
        balance += value * simpleRate.bid
      } else {
        const firstConversionRate = tickers[`${key.toUpperCase()}BTC`]
        const secondConversionRate = tickers['BTCUSD']
        if (!firstConversionRate || !secondConversionRate) {
          continue
        }
        balance += value * firstConversionRate.bid * secondConversionRate.bid
      }
    }
    return balance
  }

  // Mongo property
  _doc: any
}

export const UserModel = new User().getModelForClass(User, {
  schemaOptions: { timestamps: true },
})

interface LoginOptions {
  email?: string
  facebookId?: string
  telegramId?: string

  name: string
}
export async function getOrCreateUser(loginOptions: LoginOptions) {
  if (!loginOptions.name) {
    throw new Error()
  }
  let user: InstanceType<User> | undefined
  // Try email
  if (loginOptions.email) {
    user = await UserModel.findOne({ email: loginOptions.email }).populate(
      'orders'
    )
  }
  // Try facebook id
  if (!user && loginOptions.facebookId) {
    user = await UserModel.findOne({
      facebookId: loginOptions.facebookId,
    }).populate('orders')
  }
  // Try telegram id
  if (!user && loginOptions.telegramId) {
    user = await UserModel.findOne({
      telegramId: loginOptions.telegramId,
    }).populate('orders')
  }
  if (!user) {
    // Check if we have credentials
    if (
      !(
        loginOptions.email ||
        loginOptions.facebookId ||
        loginOptions.telegramId
      )
    ) {
      throw new Error()
    }
    const params = {
      name: loginOptions.name,
    } as any
    if (loginOptions.email) {
      params.email = loginOptions.email
    }
    if (loginOptions.facebookId) {
      params.facebookId = loginOptions.facebookId
    }
    if (loginOptions.telegramId) {
      params.telegramId = loginOptions.telegramId
    }
    user = await new UserModel({
      ...params,
      token: await sign(params),
    }).save()
  }
  return user
}
