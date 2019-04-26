// Dependencies
import { sign } from '../helpers/jwt'
import { prop, Typegoose, instanceMethod } from 'typegoose'
import { omit } from 'lodash'

export class User extends Typegoose {
  @prop({ required: true, index: true, unique: true, lowercase: true })
  email: string

  @prop({ required: true, index: true, unique: true })
  token: string

  @prop({ required: true, default: 10000 })
  balance: number

  @instanceMethod
  stripped(withToken = false) {
    const stripFields = ['createdAt', 'updatedAt', '__v']
    if (!withToken) {
      stripFields.push('token')
    }
    return omit(this._doc, stripFields)
  }

  // Mongo property
  _doc: object
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
