// Dependencies
import { tickers } from './bitfinex'
import { Big } from 'big.js'
import { isCrypto } from './isCrypto'

export function minimumOrderSize(currency: string) {
  for (const ticker of Object.values(tickers)) {
    if (ticker.pair.toUpperCase() === currency.toUpperCase()) {
      return new Big(ticker.minimumOrderSize)
    }
  }
  if (!isCrypto(currency)) {
    return 1
  }
  throw new Error()
}

export function maximumOrderSize(currency: string) {
  for (const ticker of Object.values(tickers)) {
    if (ticker.pair.toUpperCase() === currency.toUpperCase()) {
      return new Big(ticker.maximumOrderSize)
    }
  }
  if (!isCrypto(currency)) {
    return 1000000000
  }
  throw new Error()
}
