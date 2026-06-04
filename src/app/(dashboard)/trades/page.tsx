import { baseUrl } from '@/lib/base-url'

interface TradeRow {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  assetType: string
  quantity: number
  price: number
  fee: number
  total: number
  executedAt: Date | null
  status: string
}

async function getTrades(): Promise<TradeRow[]> {
  try {
    const res = await fetch(`${await baseUrl()}/api/trades`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function TradesPage() {
  const trades = await getTrades()
  const buyCount = trades.filter(t => t.side === 'buy').length
  const sellCount = trades.filter(t => t.side === 'sell').length
  const totalVolume = trades.reduce((s, t) => s + t.total, 0)

  return (
    <div className="p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground">Complete log of all your buy and sell transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-secondary hover:bg-muted transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Trade
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {[
          { label: 'Total Trades', value: String(trades.length) },
          { label: 'Buy Orders', value: String(buyCount), color: 'text-success' },
          { label: 'Sell Orders', value: String(sellCount), color: 'text-destructive' },
          { label: 'Total Volume', value: `$${fmt(totalVolume)}` },
        ].map(c => (
          <div key={c.label} className="flex-1 bg-card border border-border rounded-lg p-5 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color ?? 'text-foreground'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden flex-1">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-foreground">All Trades</h2>
          <span className="text-xs text-muted-foreground">Showing {trades.length} transaction{trades.length !== 1 ? 's' : ''}</span>
        </div>

        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            <p className="text-sm">No trades yet. Record your first trade to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border text-xs font-semibold text-muted-foreground">
                  {['Date', 'Symbol', 'Type', 'Side', 'Qty', 'Price', 'Fee', 'Total', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/40' : 'bg-card'}`}>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(t.executedAt)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{t.symbol}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{t.assetType}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.side === 'buy' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {t.side.charAt(0).toUpperCase() + t.side.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{t.quantity}</td>
                    <td className="px-4 py-3 text-foreground">${fmt(t.price)}</td>
                    <td className="px-4 py-3 text-foreground">${fmt(t.fee)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">${fmt(t.total)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success">{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
