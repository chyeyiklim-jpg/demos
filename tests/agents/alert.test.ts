import { describe, it, expect, beforeEach } from 'vitest'
import { AlertAgent } from '@/agents/alert.agent'
import { db } from '@/db/client'
import { alerts } from '@/db/schema'

const agent = new AlertAgent()

beforeEach(async () => {
  await db.delete(alerts)
})

describe('AlertAgent', () => {
  it('creates an alert', async () => {
    const result = await agent.createAlert({
      symbol: 'AAPL',
      condition: 'above',
      threshold: 200,
    })
    expect(result.success).toBe(true)
  })

  it('detects triggered alerts given current prices', async () => {
    await agent.createAlert({ symbol: 'AAPL', condition: 'above', threshold: 150 })
    const result = await agent.checkAlerts({ AAPL: 160 })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.triggered).toHaveLength(1)
    expect(result.data.triggered[0].symbol).toBe('AAPL')
  })
})
