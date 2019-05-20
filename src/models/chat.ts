// Dependencies
import { prop, Typegoose } from 'typegoose'

export class Chat extends Typegoose {
  @prop({ required: true, index: true, unique: true })
  id: number
  @prop({ required: true, default: 'en' })
  language: string
}

// Get Chat model
const ChatModel = new Chat().getModelForClass(Chat, {
  schemaOptions: { timestamps: true },
})

// Get or create user
export async function findChat(id: number) {
  let chat = await ChatModel.findOne({ id })
  if (!chat) {
    try {
      chat = await new ChatModel({ id }).save()
    } catch (err) {
      chat = await ChatModel.findOne({ id })
    }
  }
  return chat
}
