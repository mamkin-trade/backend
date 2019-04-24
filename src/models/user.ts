// Dependencies
import { prop, Typegoose } from 'typegoose'

export class User extends Typegoose {
  @prop({ required: true, index: true, unique: true })
  token: string
}

export const UserModel = new User().getModelForClass(User, {
  schemaOptions: { timestamps: true },
})
