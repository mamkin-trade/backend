// Dependencies
import { tickers } from './bitfinex'
import { Big } from 'big.js'

export function minimumOrderSize(currency: string) {
  for (const ticker of Object.values(tickers)) {
    if (ticker.pair.toUpperCase() === currency.toUpperCase()) {
      return new Big(ticker.minimumOrderSize)
    }
  }
  throw new Error()
}

export function maximumOrderSize(currency: string) {
  for (const ticker of Object.values(tickers)) {
    if (ticker.pair.toUpperCase() === currency.toUpperCase()) {
      return new Big(ticker.maximumOrderSize)
    }
  }
  throw new Error()
}
