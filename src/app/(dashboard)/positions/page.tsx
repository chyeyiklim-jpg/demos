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

export default async function PositionsPage() {
  const data = await getData()
  const positions = data?.positions ?? []
  const totalValue = data?.totalValue ?? 0
  const totalPnl = data?.totalPnl ?? 0

  return (
    <div className="p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">Positions</h1>
          <p className="text-sm text-muted-foreground">Your current holdings with live prices</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Trade
        </button>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4">
        {[
          { label: 'Total Positions', value: String(positions.length) },
          { label: 'Portfolio Value', value: `$${fmt(totalValue)}` },
          { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${fmt(totalPnl)}`, color: totalPnl >= 0 ? 'text-success' : 'text-destructive' },
          { label: 'Asset Types', value: String(new Set(positions.map(p => p.assetType)).size) },
        ].map(c => (
          <div key={c.label} className="flex-1 bg-card border border-border rounded-lg p-5 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color ?? 'text-foreground'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-foreground">All Positions</h2>
        </div>

        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
            <p className="text-sm">No positions yet. Add a trade to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border text-xs font-semibold text-muted-foreground">
                {['Symbol', 'Type', 'Quantity', 'Avg Cost', 'Current Price', 'Market Value', 'P&L', 'P&L %', 'Allocation'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => {
                const value = (p.currentPrice ?? p.avgCost) * p.quantity
                const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0
                const pos = (p.unrealizedPnl ?? 0) >= 0
                return (
                  <tr key={p.id} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/40' : 'bg-card'}`}>
                    <td className="px-4 py-3 font-semibold text-foreground">{p.symbol}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground capitalize">{p.assetType}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{p.quantity}</td>
                    <td className="px-4 py-3 text-foreground">${fmt(p.avgCost)}</td>
                    <td className="px-4 py-3 text-foreground">${fmt(p.currentPrice ?? 0)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">${fmt(value)}</td>
                    <td className={`px-4 py-3 font-semibold ${pos ? 'text-success' : 'text-destructive'}`}>
                      {p.unrealizedPnl != null ? `${pos ? '+' : ''}$${fmt(p.unrealizedPnl)}` : '—'}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${pos ? 'text-success' : 'text-destructive'}`}>
                      {p.unrealizedPnlPct != null ? `${pos ? '+' : ''}${p.unrealizedPnlPct.toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(allocation, 100).toFixed(1)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{allocation.toFixed(1)}%</span>
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
  )
}
