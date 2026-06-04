export type AssetType = 'stock' | 'crypto' | 'etf'

export interface Position {
  id: string
  symbol: string
  assetType: AssetType
  quantity: number
  avgCost: number
  currentPrice?: number
  unrealizedPnl?: number
  unrealizedPnlPct?: number
}

export interface Trade {
  id: string
  positionId: string | null
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  fee: number
  executedAt: Date
}

export interface MarketPrice {
  symbol: string
  price: number
  change: number
  changePct: number
  volume: number
  fetchedAt: Date
}

export interface Alert {
  id: string
  symbol: string
  condition: 'above' | 'below'
  threshold: number
  active: boolean
  triggeredAt: Date | null
}

export interface RiskMetrics {
  diversificationScore: number
  topHoldingPct: number
  sectorExposure: Record<string, number>
  beta: number | null
}

export interface DashboardPayload {
  positions: Position[]
  totalValue: number
  totalPnl: number
  totalPnlPct: number
  riskMetrics: RiskMetrics
  insights: string
  activeAlerts: Alert[]
}
