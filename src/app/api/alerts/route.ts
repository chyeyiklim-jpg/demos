import { NextResponse } from 'next/server'
import { AlertAgent } from '@/agents/alert.agent'
import { db } from '@/db/client'
import { alerts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { desc } from 'drizzle-orm'

const agent = new AlertAgent()

export async function GET() {
  try {
    const rows = await db.select().from(alerts).orderBy(desc(alerts.createdAt))
    return NextResponse.json(rows.map(r => ({
      id: r.id,
      symbol: r.symbol,
      condition: r.condition,
      threshold: Number(r.threshold),
      active: r.active,
      triggeredAt: r.triggeredAt,
      createdAt: r.createdAt,
    })))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { symbol, condition, threshold } = body
    if (!symbol || !condition || threshold == null) {
      return NextResponse.json({ error: 'symbol, condition, threshold required' }, { status: 400 })
    }
    const result = await agent.createAlert({ symbol: symbol.toUpperCase(), condition, threshold: Number(threshold) })
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json(result.data, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.delete(alerts).where(eq(alerts.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
