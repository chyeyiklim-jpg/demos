import { describe, it, expect } from 'vitest'
import { db } from '@/db/client'
import { positions, trades, alerts } from '@/db/schema'

describe('schema', () => {
  it('can insert and read a position', async () => {
    await db.insert(positions).values({
      id: 'test-pos-1',
      symbol: 'AAPL',
      assetType: 'stock',
      quantity: '10',
      avgCost: '150.00',
    })
    const rows = await db.select().from(positions)
    expect(rows.some(r => r.symbol === 'AAPL')).toBe(true)
  })
})
