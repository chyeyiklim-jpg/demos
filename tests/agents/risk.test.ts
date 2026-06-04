import { describe, it, expect } from 'vitest'
import { RiskAgent } from '@/agents/risk.agent'
import type { Position } from '@/types/domain'

const agent = new RiskAgent()

const mockPositions: Position[] = [
  { id: '1', symbol: 'AAPL', assetType: 'stock', quantity: 10, avgCost: 150, currentPrice: 160 },
  { id: '2', symbol: 'GOOGL', assetType: 'stock', quantity: 5, avgCost: 130, currentPrice: 140 },
  { id: '3', symbol: 'BTC', assetType: 'crypto', quantity: 0.5, avgCost: 40000, currentPrice: 45000 },
]

describe('RiskAgent', () => {
  it('computes diversification score', async () => {
    const result = await agent.analyze(mockPositions)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.diversificationScore).toBeGreaterThan(0)
    expect(result.data.diversificationScore).toBeLessThanOrEqual(100)
  })

  it('computes sector exposure by asset type', async () => {
    const result = await agent.analyze(mockPositions)
    if (!result.success) return
    expect(result.data.sectorExposure).toHaveProperty('stock')
    expect(result.data.sectorExposure).toHaveProperty('crypto')
  })
})
