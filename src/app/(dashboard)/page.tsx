import { headers } from 'next/headers'
import type { DashboardPayload } from '@/types/domain'

async function getDashboard(): Promise<DashboardPayload | null> {
  try {
    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const res = await fetch(`${proto}://${host}/api/orchestrator`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboard()

  if (!data) {
    return <div className="p-8 text-red-500">Failed to load dashboard.</div>
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Portfolio</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-xl font-semibold">${data.totalValue.toFixed(2)}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Total P&L</p>
          <p className={`text-xl font-semibold ${data.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.totalPnl >= 0 ? '+' : ''}{data.totalPnl.toFixed(2)} ({data.totalPnlPct.toFixed(2)}%)
          </p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Diversification</p>
          <p className="text-xl font-semibold">{data.riskMetrics.diversificationScore.toFixed(0)}/100</p>
        </div>
      </div>

      <div className="rounded border p-4">
        <h2 className="font-semibold mb-2">AI Insights</h2>
        <p className="text-sm text-gray-700">{data.insights || 'No insights available.'}</p>
      </div>

      <div className="rounded border p-4">
        <h2 className="font-semibold mb-2">Positions</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-1">Symbol</th>
              <th>Qty</th>
              <th>Avg Cost</th>
              <th>Current</th>
              <th>P&L %</th>
            </tr>
          </thead>
          <tbody>
            {data.positions.map(p => (
              <tr key={p.id} className="border-t">
                <td className="py-1 font-medium">{p.symbol}</td>
                <td>{p.quantity}</td>
                <td>${p.avgCost.toFixed(2)}</td>
                <td>${(p.currentPrice ?? 0).toFixed(2)}</td>
                <td className={p.unrealizedPnlPct != null && p.unrealizedPnlPct >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {p.unrealizedPnlPct?.toFixed(2) ?? '—'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
