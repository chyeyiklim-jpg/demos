import type { MarketPrice } from '@/types/domain'

const BASE_URL = process.env.YAHOO_FINANCE_BASE_URL ?? 'https://query1.finance.yahoo.com'

export async function fetchPrice(symbol: string): Promise<MarketPrice> {
  const url = `${BASE_URL}/v8/finance/chart/${symbol}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  if (!res.ok) throw new Error(`Yahoo Finance fetch failed: ${res.status}`)

  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`No data for symbol: ${symbol}`)

  const price: number = result.meta.regularMarketPrice
  const prevClose: number = result.meta.previousClose ?? price
  const volume: number = result.indicators?.quote?.[0]?.volume?.at(-1) ?? 0

  return {
    symbol,
    price,
    change: price - prevClose,
    changePct: ((price - prevClose) / prevClose) * 100,
    volume,
    fetchedAt: new Date(),
  }
}

export async function fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
  return Promise.all(symbols.map(fetchPrice))
}
