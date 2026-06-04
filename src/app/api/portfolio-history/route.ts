import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { trades } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { OrchestratorAgent } from '@/agents/orchestrator.agent'
import { buildWeeklySnapshots } from '@/lib/portfolio-snapshots'

export type { WeekSnapshot } from '@/lib/portfolio-snapshots'

const orchestrator = new OrchestratorAgent()

export async function GET() {
  try {
    const rows = await db
      .select({
        side: trades.side,
        quantity: trades.quantity,
        price: trades.price,
        fee: trades.fee,
        executedAt: trades.executedAt,
      })
      .from(trades)
      .orderBy(asc(trades.executedAt))

    const dashResult = await orchestrator.getDashboard()
    const totalPnlPct = dashResult.success ? dashResult.data.totalPnlPct : 0

    const snapshots = buildWeeklySnapshots(rows, totalPnlPct)
    return NextResponse.json(snapshots)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
