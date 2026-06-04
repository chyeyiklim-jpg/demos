/**
 * Seed script — populates DB with dummy portfolio data.
 * Run: npx tsx scripts/seed.ts
 */
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { positions, trades, alerts } from '../src/db/schema'

const client = createClient({ url: 'file:local.db' })
const db = drizzle(client)

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await db.delete(trades)
  await db.delete(positions)
  await db.delete(alerts)
  console.log('  ✓ Cleared existing data')

  // ─── Positions & Trades ───────────────────────────────────────────────────

  const posData = [
    {
      symbol: 'AAPL', assetType: 'stock' as const,
      trades: [
        { side: 'buy' as const, qty: 10, price: 150.00, fee: 1.50, date: '2026-04-10' },
      ],
    },
    {
      symbol: 'GOOGL', assetType: 'stock' as const,
      trades: [
        { side: 'buy' as const, qty: 5,  price: 130.00, fee: 0.65, date: '2026-04-18' },
      ],
    },
    {
      symbol: 'BTC', assetType: 'crypto' as const,
      trades: [
        { side: 'buy' as const, qty: 0.5, price: 40000.00, fee: 20.00, date: '2026-05-02' },
      ],
    },
    {
      symbol: 'TSLA', assetType: 'stock' as const,
      trades: [
        { side: 'buy' as const, qty: 15, price: 176.40, fee: 2.65, date: '2026-04-25' },
        { side: 'sell' as const, qty: 5,  price: 198.50, fee: 2.49, date: '2026-05-10' },
        { side: 'sell' as const, qty: 2,  price: 205.10, fee: 1.02, date: '2026-06-02' },
      ],
    },
    {
      symbol: 'ETH', assetType: 'crypto' as const,
      trades: [
        { side: 'buy' as const, qty: 2, price: 2800.00, fee: 5.60, date: '2026-05-20' },
      ],
    },
  ]

  for (const p of posData) {
    let positionId = randomUUID()
    let runningQty = 0
    let runningCost = 0

    // Insert position row first
    await db.insert(positions).values({
      id: positionId,
      symbol: p.symbol,
      assetType: p.assetType,
      quantity: '0',
      avgCost: '0',
    })

    // Replay trades to compute avg cost
    for (const t of p.trades) {
      const executedAt = new Date(t.date)

      await db.insert(trades).values({
        id: randomUUID(),
        positionId,
        symbol: p.symbol,
        side: t.side,
        quantity: String(t.qty),
        price: String(t.price),
        fee: String(t.fee),
        executedAt,
      })

      if (t.side === 'buy') {
        const newQty = runningQty + t.qty
        runningCost = (runningQty * runningCost + t.qty * t.price) / newQty
        runningQty = newQty
      } else {
        runningQty = Math.max(0, runningQty - t.qty)
      }
    }

    // Update position with final qty + avg cost
    await db.update(positions)
      .set({ quantity: String(runningQty), avgCost: String(runningCost) })
      .where(eq(positions.id, positionId))
  }

  console.log(`  ✓ Inserted ${posData.length} positions`)
  console.log(`  ✓ Inserted ${posData.flatMap(p => p.trades).length} trades`)

  // ─── Alerts ───────────────────────────────────────────────────────────────

  const alertData = [
    { symbol: 'AAPL',  condition: 'above' as const, threshold: 200,   active: true },
    { symbol: 'BTC',   condition: 'below' as const, threshold: 40000,  active: true },
    { symbol: 'TSLA',  condition: 'below' as const, threshold: 190,   active: false, triggered: '2026-05-25' },
    { symbol: 'GOOGL', condition: 'above' as const, threshold: 150,   active: true },
    { symbol: 'ETH',   condition: 'above' as const, threshold: 3500,  active: true },
    { symbol: 'AAPL',  condition: 'below' as const, threshold: 160,   active: false },
  ]

  for (const a of alertData) {
    await db.insert(alerts).values({
      id: randomUUID(),
      symbol: a.symbol,
      condition: a.condition,
      threshold: String(a.threshold),
      active: a.active,
      triggeredAt: a.triggered ? new Date(a.triggered) : null,
    })
  }

  console.log(`  ✓ Inserted ${alertData.length} alerts`)
  console.log('')
  console.log('✅ Seed complete! Run `npm run dev` to see the data.')

  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
