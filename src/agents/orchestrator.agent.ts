import { BaseAgent } from './base.agent'
import { PortfolioAgent } from './portfolio.agent'
import { MarketDataAgent } from './market-data.agent'
import { RiskAgent } from './risk.agent'
import { IntelligenceAgent } from './intelligence.agent'
import { AlertAgent } from './alert.agent'
import { ReportAgent } from './report.agent'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { DashboardPayload } from '@/types/domain'

export class OrchestratorAgent extends BaseAgent {
  private portfolio = new PortfolioAgent()
  private marketData = new MarketDataAgent()
  private risk = new RiskAgent()
  private intelligence = new IntelligenceAgent()
  private alerts = new AlertAgent()
  private report = new ReportAgent()

  constructor() {
    super('OrchestratorAgent')
  }

  async getDashboard(): Promise<AgentResult<DashboardPayload>> {
    return this.run(async () => {
      // Phase 1: fetch positions
      const positionsResult = await this.portfolio.getPositions()
      const positions = positionsResult.success ? positionsResult.data : []

      // Phase 2: fetch live prices for all held symbols
      const symbols = positions.map(p => p.symbol)
      const pricesResult = symbols.length > 0
        ? await this.marketData.getPrices(symbols)
        : { success: true as const, data: {} }

      const prices = pricesResult.success ? pricesResult.data : {}
      const priceMap = Object.fromEntries(
        Object.entries(prices).map(([sym, mp]) => [sym, mp.price])
      )

      // Enrich positions with live prices
      const enrichedPositions = positions.map(p => ({
        ...p,
        currentPrice: priceMap[p.symbol] ?? p.avgCost,
        unrealizedPnl: priceMap[p.symbol]
          ? (priceMap[p.symbol] - p.avgCost) * p.quantity
          : 0,
        unrealizedPnlPct: priceMap[p.symbol]
          ? ((priceMap[p.symbol] - p.avgCost) / p.avgCost) * 100
          : 0,
      }))

      // Phase 3: parallel — risk + intelligence + alert checking
      const [riskResult, insightResult, alertsResult] = await Promise.all([
        this.risk.analyze(enrichedPositions),
        this.intelligence.getInsights(enrichedPositions),
        this.alerts.checkAlerts(priceMap),
      ])

      const activeAlerts = alertsResult.success ? alertsResult.data.active : []
      const riskMetrics = riskResult.success
        ? riskResult.data
        : { diversificationScore: 0, topHoldingPct: 0, sectorExposure: {}, beta: null }
      const insights = insightResult.success ? insightResult.data : ''

      // Phase 4: build report
      const reportResult = await this.report.buildDashboardPayload({
        positions: enrichedPositions,
        prices,
        riskMetrics,
        insights,
        activeAlerts,
      })

      if (!reportResult.success) throw new Error(reportResult.error)
      return ok(reportResult.data)
    })
  }
}
