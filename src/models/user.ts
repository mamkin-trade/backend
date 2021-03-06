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
import { isCrypto } from '../helpers/isCrypto'
import { nasdaq } from '../helpers/nasdaq'
import { NasdaqTicker } from '../helpers/nasdaq'

export class User extends Typegoose {
  @prop({ index: true, lowercase: true })
  email?: string
  @prop({ index: true, lowercase: true })
  facebookId?: string
  @prop({ index: true, lowercase: true })
  telegramId?: string
  @prop({ index: true, lowercase: true })
  vkId?: string
  @prop({ required: true, index: true })
  name: string

  @prop({ required: true, index: true, unique: true })
  token: string
  @arrayProp({ required: true, index: true, items: String, default: [] })
  apiKeys: string[]

  @prop({ required: true, default: { usd: 10000 } })
  balance: object
  @arrayProp({ required: true, itemsRef: Order, default: [] })
  orders: Ref<Order>[]
  @arrayProp({ required: true, items: Number, default: [] })
  subscribers: number[]

  @instanceMethod
  strippedAndFilled(withExtra = false, withToken = true) {
    this._doc.subCount = this.subscribers.length
    const stripFields = [
      'createdAt',
      'updatedAt',
      '__v',
      'orders',
      'subscribers',
      'apiKeys',
    ]
    if (!withExtra) {
      stripFields.push('token')
      stripFields.push('email')
      stripFields.push('facebookId')
      stripFields.push('telegramId')
      stripFields.push('vkId')
    }
    if (!withToken) {
      stripFields.push('token')
    }
    this._doc.overallBalance = this.overallBalance
    let ordersBalance = 0
    for (const activeOrder of this.orders.filter(
      (o: Order) => !o.completed && !o.cancelled,
    ) as Order[]) {
      // Destruct symbols
      const first = isCrypto(activeOrder.symbol)
        ? activeOrder.symbol.substr(0, 3).toLowerCase()
        : activeOrder.symbol.toLowerCase()
      const second = isCrypto(activeOrder.symbol)
        ? activeOrder.symbol.substr(3, 3).toLowerCase()
        : 'usd'
      // Add balances from orders
      if (activeOrder.side === OrderSide.buy) {
        if (second === 'usd') {
          ordersBalance += activeOrder.heldAmount
        } else {
          const conversionRate = tickers[`${second.toUpperCase()}USD`]
          if (conversionRate && conversionRate.bid) {
            ordersBalance += activeOrder.heldAmount * conversionRate.bid
          }
        }
      } else {
        if (isCrypto(activeOrder.symbol)) {
          const value = activeOrder.heldAmount
          const simpleRate = tickers[`${first.toUpperCase()}USD`]
          if (simpleRate && simpleRate.bid) {
            ordersBalance += value * simpleRate.bid
          } else {
            const firstConversionRate = tickers[`${first.toUpperCase()}BTC`]
            const secondConversionRate = tickers['BTCUSD']
            if (
              !firstConversionRate ||
              !secondConversionRate ||
              !firstConversionRate.bid ||
              !secondConversionRate.bid
            ) {
              continue
            }
            ordersBalance +=
              value * firstConversionRate.bid * secondConversionRate.bid
          }
        } else {
          const value = activeOrder.heldAmount
          const ticker = nasdaq[first.toUpperCase()] as NasdaqTicker
          if (ticker) {
            ordersBalance += value * ticker.currentPrice.raw
          }
        }
      }
    }
    this._doc.overallBalance += ordersBalance
    this._doc.ordersBalance = ordersBalance
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
      if (simpleRate && simpleRate.bid) {
        balance += value * simpleRate.bid
      } else {
        const firstConversionRate = tickers[`${key.toUpperCase()}BTC`]
        const secondConversionRate = tickers['BTCUSD']
        if (
          !firstConversionRate ||
          !secondConversionRate ||
          !firstConversionRate.bid ||
          !secondConversionRate.bid
        ) {
          // Try stocks
          const nasdaqTicker = nasdaq[key.toUpperCase()]
          if (nasdaqTicker) {
            balance += value * nasdaqTicker.currentPrice.raw
          }
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
  vkId?: string

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
      'orders',
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
  // Try vk id
  if (!user && loginOptions.vkId) {
    user = await UserModel.findOne({
      vkId: loginOptions.vkId,
    }).populate('orders')
  }
  if (!user) {
    // Check if we have credentials
    if (
      !(
        loginOptions.email ||
        loginOptions.facebookId ||
        loginOptions.telegramId ||
        loginOptions.vkId
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
    if (loginOptions.vkId) {
      params.vkId = loginOptions.vkId
    }
    user = await new UserModel({
      ...params,
      token: await sign(params),
    }).save()
  }
  return user
}
