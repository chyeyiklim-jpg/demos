import Anthropic from '@anthropic-ai/sdk'
import { BaseAgent } from './base.agent'
import { ok, fail } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { Position } from '@/types/domain'

export class IntelligenceAgent extends BaseAgent {
  private client: Anthropic

  constructor() {
    super('IntelligenceAgent')
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async getInsights(positions: Position[]): Promise<AgentResult<string>> {
    return this.run(async () => {
      const summary = positions.map(p => ({
        symbol: p.symbol,
        type: p.assetType,
        qty: p.quantity,
        avgCost: p.avgCost,
        currentPrice: p.currentPrice,
        pnlPct: p.unrealizedPnlPct?.toFixed(2),
      }))

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: `You are a concise portfolio analyst. Give 2-3 sentence insights about the portfolio.
No financial advice. Focus on diversification, concentration risk, and notable movers.`,
        messages: [
          {
            role: 'user',
            content: `Portfolio positions: ${JSON.stringify(summary, null, 2)}`,
          },
        ],
      })

      const text = response.content.find(b => b.type === 'text')?.text
      if (!text) return fail('No insight returned from Claude', 'AI_ERROR')
      return ok(text)
    })
  }
}
