import { describe, it, expect, beforeEach } from 'vitest'
import { PortfolioAgent } from '@/agents/portfolio.agent'
import { db } from '@/db/client'
import { positions, trades } from '@/db/schema'

const agent = new PortfolioAgent()

beforeEach(async () => {
  await db.delete(trades)
  await db.delete(positions)
})

describe('PortfolioAgent', () => {
  it('adds a position', async () => {
    const result = await agent.addTrade({
      symbol: 'AAPL',
      assetType: 'stock',
      side: 'buy',
      quantity: 10,
      price: 150,
      fee: 0,
      executedAt: new Date(),
    })
    expect(result.success).toBe(true)
  })

  it('calculates unrealized P&L', async () => {
    await agent.addTrade({
      symbol: 'AAPL',
      assetType: 'stock',
      side: 'buy',
      quantity: 10,
      price: 150,
      fee: 0,
      executedAt: new Date(),
    })
    const result = await agent.getPositions({ AAPL: 160 })
    expect(result.success).toBe(true)
    if (!result.success) return
    const pos = result.data.find(p => p.symbol === 'AAPL')!
    expect(pos.unrealizedPnl).toBeCloseTo(100)
    expect(pos.unrealizedPnlPct).toBeCloseTo(6.67, 1)
  })
})
