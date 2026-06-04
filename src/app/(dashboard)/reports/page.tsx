import { baseUrl } from '@/lib/base-url'
import type { DashboardPayload } from '@/types/domain'

async function getData(): Promise<DashboardPayload | null> {
  try {
    const res = await fetch(`${await baseUrl()}/api/orchestrator`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const RANGES = ['1W', '1M', '3M', '6M', '1Y', 'All']

export default async function ReportsPage() {
  const data = await getData()
  const positions = data?.positions ?? []
  const totalValue = data?.totalValue ?? 0
  const totalPnl = data?.totalPnl ?? 0
  const totalPnlPct = data?.totalPnlPct ?? 0
  const risk = data?.riskMetrics

  const pnlPos = totalPnl >= 0

  return (
    <div className="p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Portfolio performance over time</p>
        </div>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          {RANGES.map((r, i) => (
            <button key={r} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              i === 2 ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4">
        {[
          { label: 'Total Return', value: `${pnlPos ? '+' : ''}$${fmt(totalPnl)}`, sub: `${pnlPos ? '+' : ''}${totalPnlPct.toFixed(2)}%`, color: pnlPos ? 'text-success' : 'text-destructive' },
          { label: 'Portfolio Value', value: `$${fmt(totalValue)}`, sub: `${positions.length} positions`, color: 'text-foreground' },
          { label: 'Diversification', value: `${(risk?.diversificationScore ?? 0).toFixed(0)} / 100`, sub: `${Object.keys(risk?.sectorExposure ?? {}).length} asset types`, color: 'text-foreground' },
          { label: 'Active Alerts', value: String(data?.activeAlerts.length ?? 0), sub: 'Monitoring', color: 'text-foreground' },
        ].map(c => (
          <div key={c.label} className="flex-1 bg-card border border-border rounded-lg p-5 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="flex gap-5 flex-1">

        {/* Asset Allocation */}
        <div className="w-[280px] bg-card border border-border rounded-lg flex flex-col shrink-0">
          <div className="px-4 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Asset Allocation</h2>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            {Object.keys(risk?.sectorExposure ?? {}).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No positions yet</p>
            ) : (
              <>
                {/* Donut-style bar chart */}
                <div className="flex flex-col gap-2">
                  {Object.entries(risk?.sectorExposure ?? {}).map(([sector, pct]) => (
                    <div key={sector} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary capitalize">{sector}</span>
                        <span className="text-xs font-semibold text-foreground">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-4 border-t border-border flex flex-col gap-2">
                  {Object.entries(risk?.sectorExposure ?? {}).map(([sector, pct]) => {
                    const value = totalValue * (pct / 100)
                    return (
                      <div key={sector} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground capitalize">{sector}</span>
                        <span className="text-xs font-semibold text-foreground">${fmt(value)}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Position Performance */}
        <div className="flex-1 bg-card border border-border rounded-lg flex flex-col min-w-0">
          <div className="px-4 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Position Performance</h2>
          </div>
          {positions.length === 0 ? (
            <div className="flex items-center justify-center flex-1 py-16 text-muted-foreground text-sm">
              No positions to report
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border text-xs font-semibold text-muted-foreground">
                  {['Symbol', 'Type', 'Unrealized P&L', 'Return %', '7-Day Trend'].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions
                  .sort((a, b) => (b.unrealizedPnl ?? 0) - (a.unrealizedPnl ?? 0))
                  .map((p, i) => {
                    const pos = (p.unrealizedPnl ?? 0) >= 0
                    const barH = [40, 55, 62, 70, 78, 85, 90]
                    return (
                      <tr key={p.id} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/40' : 'bg-card'}`}>
                        <td className="px-4 py-3 font-semibold text-foreground">{p.symbol}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{p.assetType}</td>
                        <td className={`px-4 py-3 font-semibold ${pos ? 'text-success' : 'text-destructive'}`}>
                          {p.unrealizedPnl != null ? `${pos ? '+' : ''}$${fmt(p.unrealizedPnl)}` : '—'}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${pos ? 'text-success' : 'text-destructive'}`}>
                          {p.unrealizedPnlPct != null ? `${pos ? '+' : ''}${p.unrealizedPnlPct.toFixed(2)}%` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-end gap-0.5 h-8">
                            {barH.map((h, idx) => (
                              <div
                                key={idx}
                                className={`w-2.5 rounded-t-sm ${
                                  idx === barH.length - 1
                                    ? (pos ? 'bg-success' : 'bg-destructive')
                                    : (pos ? 'bg-success/20' : 'bg-destructive/20')
                                }`}
                                style={{ height: `${(h / 100) * 100}%` }}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
