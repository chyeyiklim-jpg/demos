import { describe, it, expect, vi } from 'vitest'
import { IntelligenceAgent } from '@/agents/intelligence.agent'
import type { Position } from '@/types/domain'

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Your portfolio looks well diversified.' }]
      })
    }
  }
}))

const agent = new IntelligenceAgent()

describe('IntelligenceAgent', () => {
  it('returns a non-empty insight string', async () => {
    const positions: Position[] = [
      { id: '1', symbol: 'AAPL', assetType: 'stock', quantity: 10, avgCost: 150, currentPrice: 160 }
    ]
    const result = await agent.getInsights(positions)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.length).toBeGreaterThan(0)
  })
})
