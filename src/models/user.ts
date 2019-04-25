// Dependencies
import { sign } from '../helpers/jwt'
import { prop, Typegoose } from 'typegoose'

export class User extends Typegoose {
  @prop({ required: true, index: true, unique: true })
  email: string

  @prop({ required: true, index: true, unique: true })
  token: string

  @prop({ required: true, default: 10000 })
  balance: number
}

export const UserModel = new User().getModelForClass(User, {
  schemaOptions: { timestamps: true },
})

export async function getOrCreateUser(email: string) {
  let user = await UserModel.findOne({ email })
  if (!user) {
    user = await new UserModel({ email, token: await sign({ email }) }).save()
  }
  return user
}
