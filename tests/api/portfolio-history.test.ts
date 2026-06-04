import { describe, it, expect } from 'vitest'
import { buildWeeklySnapshots } from '@/lib/portfolio-snapshots'

describe('buildWeeklySnapshots', () => {
  it('returns empty array when no trades', () => {
    const result = buildWeeklySnapshots([], 0)
    expect(result).toEqual([])
  })

  it('accumulates cost basis from buy trades', () => {
    const trades = [
      { side: 'buy', quantity: '10', price: '100', fee: '1', executedAt: new Date('2026-05-01') },
      { side: 'buy', quantity: '5', price: '200', fee: '0', executedAt: new Date('2026-05-08') },
    ] as any[]
    const result = buildWeeklySnapshots(trades, 10)
    expect(result.length).toBeGreaterThan(0)
    expect(result[result.length - 1].costBasis).toBeCloseTo(2001)
    expect(result[result.length - 1].estimatedValue).toBeGreaterThan(result[result.length - 1].costBasis)
  })

  it('reduces cost basis on sell trades', () => {
    const trades = [
      { side: 'buy', quantity: '10', price: '100', fee: '0', executedAt: new Date('2026-05-01') },
      { side: 'sell', quantity: '5', price: '100', fee: '0', executedAt: new Date('2026-05-08') },
    ] as any[]
    const result = buildWeeklySnapshots(trades, 0)
    const last = result[result.length - 1]
    expect(last.costBasis).toBeCloseTo(500)
  })

  it('labels weeks as "MMM Wn" format', () => {
    const trades = [
      { side: 'buy', quantity: '1', price: '100', fee: '0', executedAt: new Date('2026-05-04') },
    ] as any[]
    const result = buildWeeklySnapshots(trades, 0)
    expect(result[0].week).toMatch(/^[A-Z][a-z]{2} W[1-4]$/)
  })
})
