// Dependencies
import axios from 'axios'
import camelcaseKeysDeep = require('camelcase-keys-deep')
import BFX = require('bitfinex-api-node')
import { report } from './report'
import { delay } from './delay'

export let tickers: { [index: string]: Symbol & Ticker } = {}

export interface Symbol {
  pair: string
  pricePrecision: number
  initialMargin: string
  minimumMargin: string
  maximumOrderSize: string
  minimumOrderSize: string
}

export interface Ticker {
  bid: number
  bidSize: number
  ask: number
  askSize: number
  dailyChange: number
  dailyChangePerc: number
  lastPrice: number
  volume: number
  high: number
  low: number
}

async function updateSymbolDetails() {
  try {
    const symbolDetailsResponse = await axios.get(
      'https://api.bitfinex.com/v1/symbols_details',
    )
    const symbolDetails = symbolDetailsResponse.data.map(v =>
      camelcaseKeysDeep(v),
    ) as Symbol[]
    for (const symbolDetail of symbolDetails) {
      const skipCurrencies = ['eur', 'gbp', 'jpy', 'usdt']
      let skip = false
      for (const skipCurrency of skipCurrencies) {
        if (symbolDetail.pair.toLowerCase().indexOf(skipCurrency) > -1) {
          skip = true
        }
      }
      if (skip) {
        continue
      }
      symbolDetail.pair = symbolDetail.pair.toUpperCase()
      tickers[symbolDetail.pair] = Object.assign(
        tickers[symbolDetail.pair] || {},
        symbolDetail,
      ) as Symbol & Ticker
    }
  } catch (err) {
    if (err.response && err.response.status === 408) {
      console.error(err)
      return
    }
    throw err
  }
}

function startFetchingSymbolDetails() {
  setInterval(async () => {
    await updateSymbolDetails()
  }, 5 * 60 * 1000)
}

let wss = []
for (let i = 0; i < 4; i++) {
  const j = i
  const bfx = new BFX()
  const ws = bfx.ws()
  wss.push(ws)

  ws.on('error', async err => {
    err.message = `${j} ${err.message}`
    await report(err)
  })

  ws.on('open', () => {
    console.log(`${j} Bitfinex sockets opened`)
    subscribeToTickers(j, ws)
  })
  ws.on('close', async () => {
    console.log(`${j} Bitfinex sockets closed`)
    await delay(5)
    ws.open()
  })
  ws.on('ticker', async (...args) => {
    const symbol = args[0].substr(1)
    tickers[symbol] = Object.assign(tickers[symbol], {
      bid: args[1][0],
      bidSize: args[1][1],
      ask: args[1][2],
      askSize: args[1][3],
      dailyChange: args[1][4],
      dailyChangePerc: args[1][5],
      lastPrice: args[1][6],
      volume: args[1][7],
      high: args[1][8],
      low: args[1][9],
    }) as Symbol & Ticker
  })
}

function subscribeToTickers(j: number, ws: any) {
  Object.keys(tickers).forEach((symbol, i) => {
    const k = Math.floor(i / 100)
    if (k === j) {
      wss[k].subscribeTicker(symbol.toUpperCase())
    }
  })
}

;(async function setup() {
  await updateSymbolDetails()
  wss.forEach(ws => ws.open())

  startFetchingSymbolDetails()
})()
