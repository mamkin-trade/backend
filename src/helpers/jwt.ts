// Dependencies
import * as jwt from 'jsonwebtoken'

const secret = process.env.JWT

export function sign(payload: object) {
  return new Promise((res, rej) => {
    jwt.sign(payload, secret, undefined, (err, token) => {
      return err ? rej(err) : res(token)
    })
  })
}
