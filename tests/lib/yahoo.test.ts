import { describe, it, expect, vi } from 'vitest'
import { fetchPrice } from '@/lib/market/yahoo'

describe('yahoo finance client', () => {
  it('returns a MarketPrice for a valid symbol', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [{
            meta: { regularMarketPrice: 178.5, previousClose: 175.0 },
            indicators: { quote: [{ volume: [1000000] }] }
          }]
        }
      })
    }))

    const price = await fetchPrice('AAPL')
    expect(price.symbol).toBe('AAPL')
    expect(price.price).toBe(178.5)
    expect(price.change).toBeCloseTo(3.5)
  })
})
