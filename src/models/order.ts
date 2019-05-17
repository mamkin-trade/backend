// Dependencies
import { User } from './user'
import { Typegoose, prop, Ref, instanceMethod } from 'typegoose'
import { omit } from 'lodash'

export enum OrderSide {
  buy = 'buy',
  sell = 'sell',
}

export enum OrderType {
  market = 'market',
  limit = 'limit',
}

export class Order extends Typegoose {
  @prop({ required: true, ref: User })
  user: Ref<User>

  @prop({ required: true, index: true, uppercase: true })
  symbol: string
  @prop({ required: true, validate: v => v > 0 })
  amount: number
  @prop({ required: true })
  heldAmount: number
  @prop({ required: true, validate: v => v > 0 })
  price: number
  @prop({ required: true, enum: OrderSide })
  side: OrderSide
  @prop({ required: true, enum: OrderType })
  type: OrderType

  @prop({ required: true, default: false })
  completed: boolean
  @prop()
  completionDate?: Date
  @prop({ required: true, default: false })
  cancelled: boolean

  @prop({ required: true, default: 0 })
  fee: number

  @instanceMethod
  stripped() {
    const stripFields = ['__v', 'user', 'updatedAt']
    return omit(this._doc, stripFields)
  }

  // Mongo property
  _doc: any
}

export const OrderModel = new Order().getModelForClass(Order, {
  schemaOptions: { timestamps: true },
})
