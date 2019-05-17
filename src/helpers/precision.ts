// Dependencies
import { tickers } from './bitfinex'
import { Big } from 'big.js'

export function precision(pairOrCurrency: string) {
  const currency = pairOrCurrency.substr(0, 3)
  for (const ticker of Object.values(tickers)) {
    if (ticker.pair.substr(0, 3).toUpperCase() === currency.toUpperCase()) {
      return ticker.pricePrecision
    }
  }
  return 2
}

interface FormatNumberOptions {
  sig?: number
  currency?: string
}

export function round(n: number | Big, options: FormatNumberOptions = {}) {
  let res = new Big(n)
  if (options.sig !== undefined) {
    res = res.round(options.sig, 0)
  } else if (options.currency) {
    res = res.round(precision(options.currency), 0)
  }
  return Number(res)
}
