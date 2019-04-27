// Dependencies
import { User } from './user'
import { Typegoose, prop, Ref } from 'typegoose'

export enum OrderSide {
  buy,
  sell,
}

export enum OrderType {
  market,
  limit,
}

export class Order extends Typegoose {
  @prop({ required: true, ref: User })
  user: Ref<User>

  @prop({ required: true, index: true })
  symbol: string
  @prop({ required: true })
  amount: number
  @prop({ required: true })
  price: number
  @prop({ required: true, enum: OrderSide })
  side: OrderSide
  @prop({ required: true, enum: OrderType })
  type: OrderType

  @prop({ required: true, default: false })
  completed: boolean
}
