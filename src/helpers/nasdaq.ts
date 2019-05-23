// Dependencies
import axios from 'axios'
import * as Client from 'ftp'

export interface NasdaqTicker {
  symbol: string
  currentPrice: {
    raw: number
    fmt: string
  }
  totalCash: {
    raw: number
    fmt: string
    longFmt: string
  }
  totalCashPerShare: {
    raw: number
    fmt: string
  }
  totalRevenue: {
    raw: number
    fmt: string
    longFmt: string
  }
  grossProfits: {
    raw: number
    fmt: string
    longFmt: string
  }
  earningsGrowth: {
    raw: number
    fmt: string
  }
  revenueGrowth: {
    raw: number
    fmt: string
  }
}

export let nasdaq: { [index: string]: NasdaqTicker } = {}

async function updateSymbolDetails() {
  try {
    const symbols = await getSymbols()
    await fillSymbols(symbols)
  } catch (err) {
    console.error('Error')
  }
}

let fetchingSymbolDetails = false
;(async function setup() {
  await updateSymbolDetails()
  setInterval(async () => {
    if (fetchingSymbolDetails) {
      return
    }
    fetchingSymbolDetails = true
    try {
      await updateSymbolDetails()
    } finally {
      fetchingSymbolDetails = false
    }
  }, 30 * 60 * 1000)
})()

function getSymbols(): Promise<string[]> {
  return new Promise((res, rej) => {
    const ftpClient = new Client()
    ftpClient.on('ready', () => {
      let string = ''
      ftpClient.get('SymbolDirectory/nasdaqlisted.txt', (err, stream) => {
        if (err) {
          ftpClient.end()
          return rej(err)
        }
        stream.once('error', err => {
          ftpClient.end()
          rej(err)
        })
        stream.on('data', data => {
          string += data.toString()
        })
        stream.once('close', () => {
          ftpClient.end()
          const result = string.split('\n')
          result.splice(-2, 2)
          result.splice(0, 1)
          res(result.map(s => s.split('|')[0]))
        })
      })
    })
    ftpClient.connect({
      host: 'ftp.nasdaqtrader.com',
    })
  })
}

async function fillSymbols(symbols: string[]) {
  while (symbols.length) {
    const symbolsToFetch = symbols.splice(0, 100)
    const promises = []
    for (const symbol of symbolsToFetch) {
      promises.push(
        new Promise(async res => {
          try {
            const data = (await axios(
              `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=financialData`
            )).data.quoteSummary.result[0].financialData
            if (!data.currentPrice.raw) {
              return res()
            }
            res({
              symbol,
              currentPrice: data.currentPrice,
              totalCash: data.totalCash.raw ? data.totalCash : undefined,
              totalCashPerShare: data.totalCashPerShare.raw
                ? data.totalCashPerShare
                : undefined,
              totalRevenue: data.totalRevenue.raw
                ? data.totalRevenue
                : undefined,
              grossProfits: data.grossProfits.raw
                ? data.grossProfits
                : undefined,
              earningsGrowth: data.earningsGrowth.raw
                ? data.earningsGrowth
                : undefined,
              revenueGrowth: data.revenueGrowth.raw
                ? data.revenueGrowth
                : undefined,
            })
          } catch (err) {
            res()
          }
        })
      )
    }
    const result = (await Promise.all(promises)).filter(v => !!v)
    for (const ticker of result) {
      nasdaq[ticker.symbol] = ticker
    }
  }
}
