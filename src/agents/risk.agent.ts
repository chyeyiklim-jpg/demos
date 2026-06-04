import { BaseAgent } from './base.agent'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { Position, RiskMetrics } from '@/types/domain'

export class RiskAgent extends BaseAgent {
  constructor() {
    super('RiskAgent')
  }

  async analyze(positions: Position[]): Promise<AgentResult<RiskMetrics>> {
    return this.run(async () => {
      const totalValue = positions.reduce(
        (sum, p) => sum + (p.currentPrice ?? p.avgCost) * p.quantity,
        0
      )

      if (totalValue === 0) {
        return ok({ diversificationScore: 0, topHoldingPct: 0, sectorExposure: {}, beta: null })
      }

      const sectorExposure: Record<string, number> = {}
      let topHoldingValue = 0

      for (const pos of positions) {
        const value = (pos.currentPrice ?? pos.avgCost) * pos.quantity
        const pct = (value / totalValue) * 100
        sectorExposure[pos.assetType] = (sectorExposure[pos.assetType] ?? 0) + pct
        if (value > topHoldingValue) topHoldingValue = value
      }

      const topHoldingPct = (topHoldingValue / totalValue) * 100
      const n = positions.length
      const diversificationScore = n <= 1 ? 0 : Math.max(0, 100 - topHoldingPct)

      return ok({ diversificationScore, topHoldingPct, sectorExposure, beta: null })
    })
  }
}
