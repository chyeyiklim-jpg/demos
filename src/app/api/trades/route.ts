import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { trades, positions } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    const rows = await db
      .select({
        id: trades.id,
        symbol: trades.symbol,
        side: trades.side,
        quantity: trades.quantity,
        price: trades.price,
        fee: trades.fee,
        executedAt: trades.executedAt,
        positionId: trades.positionId,
        assetType: positions.assetType,
      })
      .from(trades)
      .leftJoin(positions, eq(trades.positionId, positions.id))
      .orderBy(desc(trades.executedAt))

    const result = rows.map(r => ({
      id: r.id,
      symbol: r.symbol,
      side: r.side,
      assetType: r.assetType ?? 'stock',
      quantity: Number(r.quantity),
      price: Number(r.price),
      fee: Number(r.fee ?? '0'),
      total: Number(r.quantity) * Number(r.price) + Number(r.fee ?? '0'),
      executedAt: r.executedAt,
      status: 'Filled',
    }))

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
