const BASE_URL = 'https://api.frankfurter.app'

export type SupportedCurrency = 'USD' | 'MYR' | 'SGD' | 'JPY'

export interface FxRates {
  base: string
  rates: Record<string, number>
}

/** Returns how many units of `currency` equal 1 USD.
 *  USD→USD is always 1. Result is cached per process for 10 min. */
const cache = new Map<string, { rate: number; expiresAt: number }>()

export async function getFxRateToUsd(currency: SupportedCurrency): Promise<number> {
  if (currency === 'USD') return 1

  const cached = cache.get(currency)
  if (cached && cached.expiresAt > Date.now()) return cached.rate

  const res = await fetch(`${BASE_URL}/latest?from=USD&to=${currency}`, {
    next: { revalidate: 600 },
  })
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`)

  const data: FxRates = await res.json()
  const rate = data.rates[currency]
  if (!rate) throw new Error(`No rate returned for ${currency}`)

  cache.set(currency, { rate, expiresAt: Date.now() + 10 * 60 * 1000 })
  return rate
}

/** Fetch current rates for USD → MYR, SGD, JPY in one request. */
export async function getAllFxRates(): Promise<Record<SupportedCurrency, number>> {
  const res = await fetch(`${BASE_URL}/latest?from=USD&to=MYR,SGD,JPY`, {
    next: { revalidate: 600 },
  })
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`)

  const data: FxRates = await res.json()
  return {
    USD: 1,
    MYR: data.rates['MYR'] ?? 1,
    SGD: data.rates['SGD'] ?? 1,
    JPY: data.rates['JPY'] ?? 1,
  }
}
