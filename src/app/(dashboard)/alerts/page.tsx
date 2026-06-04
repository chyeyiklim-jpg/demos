import { baseUrl } from '@/lib/base-url'

interface AlertRow {
  id: string
  symbol: string
  condition: 'above' | 'below'
  threshold: number
  active: boolean | null
  triggeredAt: Date | null
  createdAt: Date | null
}

async function getAlerts(): Promise<AlertRow[]> {
  try {
    const res = await fetch(`${await baseUrl()}/api/alerts`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

function formatDate(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ alert }: { alert: AlertRow }) {
  if (alert.triggeredAt) {
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-warning/10 text-warning">Triggered</span>
  }
  if (alert.active) {
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success/10 text-success">Active</span>
  }
  return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">Resolved</span>
}

export default async function AlertsPage() {
  const alerts = await getAlerts()
  const active = alerts.filter(a => a.active && !a.triggeredAt).length
  const triggered = alerts.filter(a => a.triggeredAt).length
  const resolved = alerts.filter(a => !a.active && !a.triggeredAt).length

  return (
    <div className="p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground">Manage your price targets and stop-loss rules</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Alert
        </button>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4">
        {[
          { label: 'Total Alerts', value: String(alerts.length), color: 'text-foreground' },
          { label: 'Active', value: String(active), color: 'text-foreground' },
          { label: 'Triggered Today', value: String(triggered), color: triggered > 0 ? 'text-warning' : 'text-foreground' },
          { label: 'Resolved', value: String(resolved), color: resolved > 0 ? 'text-success' : 'text-foreground' },
        ].map(c => (
          <div key={c.label} className="flex-1 bg-card border border-border rounded-lg p-5 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden flex-1">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-foreground">All Alerts</h2>
          <div className="flex items-center gap-2">
            {[['All', true], ['Active', false], ['Triggered', false], ['Resolved', false]].map(([label, active]) => (
              <button key={String(label)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p className="text-sm">No alerts yet. Create one to monitor price targets.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border text-xs font-semibold text-muted-foreground">
                {['Symbol', 'Condition', 'Threshold', 'Status', 'Created', 'Triggered At', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={a.id} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/40' : 'bg-card'}`}>
                  <td className="px-4 py-3 font-semibold text-foreground">{a.symbol}</td>
                  <td className="px-4 py-3 text-foreground capitalize">
                    Price {a.condition}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">${a.threshold.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge alert={a} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(a.triggeredAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button className="text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="text-destructive hover:opacity-70 transition-opacity" title="Delete">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
