import { BaseAgent } from './base.agent'
import { cache } from '@/lib/cache/redis'
import { fetchPrices } from '@/lib/market/finnhub'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { MarketPrice } from '@/types/domain'

const CACHE_TTL_SECONDS = 300

export class MarketDataAgent extends BaseAgent {
  constructor() {
    super('MarketDataAgent')
  }

  async getPrices(symbols: string[]): Promise<AgentResult<Record<string, MarketPrice>>> {
    return this.run(async () => {
      const result: Record<string, MarketPrice> = {}
      const toFetch: string[] = []

      for (const symbol of symbols) {
        const cached = await cache.get(`price:${symbol}`)
        if (cached) {
          result[symbol] = JSON.parse(cached)
        } else {
          toFetch.push(symbol)
        }
      }

      if (toFetch.length > 0) {
        const fresh = await fetchPrices(toFetch)
        for (const price of fresh) {
          result[price.symbol] = price
          await cache.set(`price:${price.symbol}`, JSON.stringify(price), 'EX', CACHE_TTL_SECONDS)
        }
      }

      return ok(result)
    })
  }
}
