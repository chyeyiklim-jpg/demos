export interface WeekSnapshot {
  week: string
  costBasis: number
  estimatedValue: number
}

type TradeRow = {
  side: string
  quantity: string
  price: string
  fee: string | null
  executedAt: Date | null
}

function getWeekLabel(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = date.getDate()
  const weekOfMonth = Math.ceil(day / 7)
  return `${month} W${weekOfMonth}`
}

export function buildWeeklySnapshots(rows: TradeRow[], totalPnlPct: number): WeekSnapshot[] {
  if (rows.length === 0) return []

  const sorted = [...rows].sort((a, b) => {
    const ta = a.executedAt ? new Date(a.executedAt).getTime() : 0
    const tb = b.executedAt ? new Date(b.executedAt).getTime() : 0
    return ta - tb
  })

  const weekMap = new Map<string, number>()
  let running = 0

  for (const row of sorted) {
    const date = row.executedAt ? new Date(row.executedAt) : new Date()
    const label = getWeekLabel(date)
    const qty = Number(row.quantity)
    const price = Number(row.price)
    const fee = Number(row.fee ?? '0')

    if (row.side === 'buy') {
      running += qty * price + fee
    } else {
      // Approximation: subtracts sell price × qty rather than avg cost × qty.
      // This slightly underreports cost basis after profitable sells, which is
      // acceptable for the chart's illustrative purpose.
      running -= qty * price
      if (running < 0) running = 0
    }
    weekMap.set(label, running)
  }

  const multiplier = 1 + totalPnlPct / 100

  return Array.from(weekMap.entries()).map(([week, costBasis]) => ({
    week,
    costBasis: Math.round(costBasis * 100) / 100,
    estimatedValue: Math.round(costBasis * multiplier * 100) / 100,
  }))
}
