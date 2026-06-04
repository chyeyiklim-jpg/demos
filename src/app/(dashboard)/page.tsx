import { headers } from 'next/headers'
import type { DashboardPayload, Position } from '@/types/domain'

async function getDashboard(): Promise<DashboardPayload | null> {
  try {
    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const res = await fetch(`${proto}://${host}/api/orchestrator`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function MetricCard({ label, value, sub, valueColor = 'text-foreground' }: {
  label: string; value: string; sub: string; valueColor?: string
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-2 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

function PnlBadge({ value }: { value: number | undefined }) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  const pos = value >= 0
  return (
    <span className={`font-semibold text-sm ${pos ? 'text-success' : 'text-destructive'}`}>
      {pos ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

function PositionsTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 3h18v18H3z" strokeLinejoin="round" />
          <path d="M9 9h6M9 12h6M9 15h4" strokeLinecap="round" />
        </svg>
        <p className="text-sm">No positions yet. Add a trade to get started.</p>
      </div>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-muted text-xs font-semibold text-muted-foreground">
          {['Symbol', 'Type', 'Qty', 'Avg Cost', 'Current', 'P&L', 'P&L %'].map(h => (
            <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {positions.map((p, i) => {
          const pnl = p.unrealizedPnl
          const pnlPct = p.unrealizedPnlPct
          const pos = (pnl ?? 0) >= 0
          return (
            <tr key={p.id} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/40' : 'bg-card'}`}>
              <td className="px-3 py-2.5 font-semibold text-foreground">{p.symbol}</td>
              <td className="px-3 py-2.5 text-muted-foreground capitalize">{p.assetType}</td>
              <td className="px-3 py-2.5 text-foreground">{p.quantity}</td>
              <td className="px-3 py-2.5 text-foreground">${fmt(p.avgCost)}</td>
              <td className="px-3 py-2.5 text-foreground">${fmt(p.currentPrice ?? 0)}</td>
              <td className={`px-3 py-2.5 font-semibold ${pnl != null ? (pos ? 'text-success' : 'text-destructive') : 'text-muted-foreground'}`}>
                {pnl != null ? `${pos ? '+' : ''}$${fmt(pnl)}` : '—'}
              </td>
              <td className="px-3 py-2.5"><PnlBadge value={pnlPct} /></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default async function DashboardPage() {
  const data = await getDashboard()

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive text-sm">Failed to load dashboard.</p>
      </div>
    )
  }

  const totalPnlPos = data.totalPnl >= 0

  return (
    <div className="p-8 flex flex-col gap-6 h-full">

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">Portfolio Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of your investments</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-secondary hover:bg-muted transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Trade
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="flex gap-4">
        <MetricCard
          label="Total Portfolio Value"
          value={`$${fmt(data.totalValue)}`}
          sub="Across all positions"
        />
        <MetricCard
          label="Unrealized P&L"
          value={`${totalPnlPos ? '+' : ''}$${fmt(data.totalPnl)}`}
          sub={`${totalPnlPos ? '+' : ''}${data.totalPnlPct.toFixed(2)}% all time`}
          valueColor={totalPnlPos ? 'text-success' : 'text-destructive'}
        />
        <MetricCard
          label="Diversification"
          value={`${data.riskMetrics.diversificationScore.toFixed(0)} / 100`}
          sub={`${Object.keys(data.riskMetrics.sectorExposure).length} asset types`}
        />
        <MetricCard
          label="Active Alerts"
          value={String(data.activeAlerts.length)}
          sub="Monitoring price targets"
          valueColor={data.activeAlerts.length > 0 ? 'text-warning' : 'text-foreground'}
        />
      </div>

      {/* Bottom Section */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Positions Table */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-lg overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <h2 className="text-[15px] font-semibold text-foreground">Positions</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-xs font-medium text-secondary hover:bg-border transition-colors">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Position
            </button>
          </div>
          <div className="overflow-auto flex-1">
            <PositionsTable positions={data.positions} />
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-[280px] flex flex-col gap-4 shrink-0">

          {/* AI Insights */}
          <div className="bg-card border border-border rounded-lg flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-foreground">AI Insights</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">Beta</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-secondary leading-relaxed">
                {data.insights || 'Add your Anthropic API key to enable AI-powered portfolio insights.'}
              </p>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="bg-card border border-border rounded-lg flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
              <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span className="text-sm font-semibold text-foreground">Risk Metrics</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                ['Diversification', `${data.riskMetrics.diversificationScore.toFixed(0)} / 100`],
                ['Top Holding', data.riskMetrics.topHoldingPct > 0 ? `${data.riskMetrics.topHoldingPct.toFixed(1)}%` : '—'],
                ...Object.entries(data.riskMetrics.sectorExposure).map(([k, v]) => [
                  k.charAt(0).toUpperCase() + k.slice(1),
                  `${v.toFixed(1)}%`,
                ]),
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
