// Dependencies
import axios from 'axios'
import camelcaseKeysDeep = require('camelcase-keys-deep')
import BFX = require('bitfinex-api-node')
import { report } from './report'
import { delay } from './delay'

export interface Symbol {
  pair: string
  pricePrecision: number
  initialMargin: string
  minimumMargin: string
  maximumOrderSize: string
  minimumOrderSize: string
}

export interface Ticker {
  mid: string
  bid: string
  ask: string
  lastPrice: string
  low: string
  high: string
  volume: string
  timestamp: string
}

export let symbolDetails: Symbol[]
async function updateSymbolDetails() {
  const symbolDetailsResponse = await axios.get(
    'https://api.bitfinex.com/v1/symbols_details'
  )
  symbolDetails = symbolDetailsResponse.data.map(v =>
    camelcaseKeysDeep(v)
  ) as Symbol[]
}

function startFetchingSymbolDetails() {
  setInterval(async () => {
    await updateSymbolDetails()
  }, 5 * 60 * 1000)
}

const bfx = new BFX()
const ws = bfx.ws()

ws.on('error', async err => {
  await report(err)
})
ws.on('open', () => {
  ws.subscribeTrades('BTCUSD')
  subscribeToTickers()
})
ws.on('close', async () => {
  await delay(5)
  ws.open()
})

function subscribeToTickers() {}

;(async function setup() {
  await updateSymbolDetails()
  ws.open()

  startFetchingSymbolDetails()
})()
