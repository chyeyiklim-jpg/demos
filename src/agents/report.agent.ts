import { BaseAgent } from './base.agent'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { Position, MarketPrice, RiskMetrics, Alert, DashboardPayload } from '@/types/domain'

interface BuildDashboardInput {
  positions: Position[]
  prices: Record<string, MarketPrice>
  riskMetrics: RiskMetrics
  insights: string
  activeAlerts: Alert[]
}

export class ReportAgent extends BaseAgent {
  constructor() {
    super('ReportAgent')
  }

  async buildDashboardPayload(input: BuildDashboardInput): Promise<AgentResult<DashboardPayload>> {
    return this.run(async () => {
      const totalValue = input.positions.reduce(
        (sum, p) => sum + (p.currentPrice ?? p.avgCost) * p.quantity,
        0
      )
      const totalCost = input.positions.reduce(
        (sum, p) => sum + p.avgCost * p.quantity,
        0
      )
      const totalPnl = totalValue - totalCost
      const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

      return ok({
        positions: input.positions,
        totalValue,
        totalPnl,
        totalPnlPct,
        riskMetrics: input.riskMetrics,
        insights: input.insights,
        activeAlerts: input.activeAlerts,
      })
    })
  }
}
