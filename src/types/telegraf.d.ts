// Dependencies
import I18N from 'telegraf-i18n'
import * as tt from 'telegraf/typings/telegram-types.d'
import { Chat } from '../models/chat'
import { User } from '../models/user'
import { InstanceType } from 'typegoose'

declare module 'telegraf' {
  export class ContextMessageUpdate {
    dbchat: InstanceType<Chat>
    i18n: I18N
    dbuser: InstanceType<User>
  }

  export interface Composer<TContext extends ContextMessageUpdate> {
    action(
      action: string | string[] | RegExp,
      middleware: Middleware<TContext>,
      ...middlewares: Array<Middleware<TContext>>
    ): Composer<TContext>
  }
}
