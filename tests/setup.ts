import { db } from '@/db/client'
import { positions, trades, alerts } from '@/db/schema'
import { afterAll } from 'vitest'

afterAll(async () => {
  await db.delete(trades)
  await db.delete(positions)
  await db.delete(alerts)
})
