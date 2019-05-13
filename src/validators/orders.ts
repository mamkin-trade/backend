// Dependencies
import { KoaJoiValidator } from 'koa2-joi-validator'
import * as Joi from 'joi'
import * as Koa from 'koa'

export const postOrder = KoaJoiValidator({
  body: {
    symbol: Joi.string().required(),
    amount: Joi.number().required(),
    side: Joi.string().required(),
    type: Joi.string().required(),
    price: Joi.number(),
  },
  failure(ctx: Koa.Context, err: Joi.ValidationError) {
    console.error(err)
    ctx.throw(400)
  },
})
