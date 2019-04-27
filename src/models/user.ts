// Dependencies
import { sign } from '../helpers/jwt'
import { prop, Typegoose, instanceMethod, arrayProp, Ref } from 'typegoose'
import { omit } from 'lodash'
import { tickers } from '../helpers/bitfinex'
import { Order } from './order'

export class User extends Typegoose {
  @prop({ required: true, index: true, unique: true, lowercase: true })
  email: string
  @prop({ required: true, index: true, unique: true })
  name: string

  @prop({ required: true, index: true, unique: true })
  token: string

  @prop({ required: true, default: { usd: 10000 } })
  balance: object

  @arrayProp({ required: true, itemsRef: Order, default: [] })
  orders: Ref<Order>[]

  @instanceMethod
  strippedAndFilled(withToken = false) {
    const stripFields = ['createdAt', 'updatedAt', '__v']
    if (!withToken) {
      stripFields.push('token')
    }
    this._doc.overallBalance = this.overallBalance
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

export async function getOrCreateUser(email: string, name: string) {
  let user = await UserModel.findOne({ email })
  if (!user) {
    user = await new UserModel({
      email,
      name,
      token: await sign({ email }),
    }).save()
  }
  return user
}
