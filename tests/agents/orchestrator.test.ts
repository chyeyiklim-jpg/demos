import { describe, it, expect, vi } from 'vitest'

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Portfolio looks balanced.' }]
      })
    }
  }
}))

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

import { OrchestratorAgent } from '@/agents/orchestrator.agent'

describe('OrchestratorAgent', () => {
  it('returns a DashboardPayload on getDashboard', async () => {
    const agent = new OrchestratorAgent()
    const result = await agent.getDashboard()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveProperty('positions')
    expect(result.data).toHaveProperty('totalValue')
    expect(result.data).toHaveProperty('riskMetrics')
  })
})
