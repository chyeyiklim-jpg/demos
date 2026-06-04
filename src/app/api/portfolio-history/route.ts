import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { trades } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { buildWeeklySnapshots } from '@/lib/portfolio-snapshots'

export type { WeekSnapshot } from '@/lib/portfolio-snapshots'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const totalPnlPct = Number(searchParams.get('pnlPct') ?? '0')

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

    const snapshots = buildWeeklySnapshots(rows, totalPnlPct)
    return NextResponse.json(snapshots)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
