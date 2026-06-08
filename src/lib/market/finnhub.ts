import type { MarketPrice } from '@/types/domain'

const BASE_URL = 'https://finnhub.io/api/v1'

// Finnhub uses exchange-prefixed symbols for crypto
const CRYPTO_MAP: Record<string, string> = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT',
  BNB: 'BINANCE:BNBUSDT',
}

function toFinnhubSymbol(symbol: string): string {
  return CRYPTO_MAP[symbol] ?? symbol
}

interface FinnhubQuote {
  c: number  // current price
  d: number  // change
  dp: number // percent change
  h: number  // high
  l: number  // low
  pc: number // previous close
}

async function fetchQuote(symbol: string, token: string): Promise<MarketPrice> {
  const finnhubSymbol = toFinnhubSymbol(symbol)
  const url = `${BASE_URL}/quote?symbol=${finnhubSymbol}&token=${token}`
  const res = await fetch(url, { next: { revalidate: 0 } })

  if (!res.ok) throw new Error(`Finnhub fetch failed for ${symbol}: ${res.status}`)

  const q: FinnhubQuote = await res.json()
  if (!q.c) throw new Error(`No data from Finnhub for ${symbol}`)

  return {
    symbol,
    price: q.c,
    change: q.d,
    changePct: q.dp,
    volume: 0,
    fetchedAt: new Date(),
  }
}

export async function fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
  const token = process.env.FINNHUB_API_KEY
  if (!token) throw new Error('FINNHUB_API_KEY is not set')

  return Promise.all(symbols.map(s => fetchQuote(s, token)))
}
