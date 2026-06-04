import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { BaseAgent } from './base.agent'
import { db } from '@/db/client'
import { positions, trades } from '@/db/schema'
import { ok, fail } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { Position, Trade, AssetType } from '@/types/domain'

interface AddTradeInput {
  symbol: string
  assetType: AssetType
  side: 'buy' | 'sell'
  quantity: number
  price: number
  fee: number
  executedAt: Date
}

export class PortfolioAgent extends BaseAgent {
  constructor() {
    super('PortfolioAgent')
  }

  async addTrade(input: AddTradeInput): Promise<AgentResult<Trade>> {
    return this.run(async () => {
      const existing = await db
        .select()
        .from(positions)
        .where(eq(positions.symbol, input.symbol))
        .limit(1)

      let positionId: string

      if (existing.length === 0) {
        positionId = randomUUID()
        await db.insert(positions).values({
          id: positionId,
          symbol: input.symbol,
          assetType: input.assetType,
          quantity: String(input.quantity),
          avgCost: String(input.price),
        })
      } else {
        positionId = existing[0].id
        const pos = existing[0]
        const prevQty = Number(pos.quantity)
        const prevCost = Number(pos.avgCost)

        if (input.side === 'buy') {
          const newQty = prevQty + input.quantity
          const newAvgCost = (prevQty * prevCost + input.quantity * input.price) / newQty
          await db
            .update(positions)
            .set({ quantity: String(newQty), avgCost: String(newAvgCost) })
            .where(eq(positions.id, positionId))
        } else {
          const newQty = prevQty - input.quantity
          await db
            .update(positions)
            .set({ quantity: String(Math.max(0, newQty)) })
            .where(eq(positions.id, positionId))
        }
      }

      const tradeId = randomUUID()
      await db.insert(trades).values({
        id: tradeId,
        positionId,
        symbol: input.symbol,
        side: input.side,
        quantity: String(input.quantity),
        price: String(input.price),
        fee: String(input.fee),
        executedAt: input.executedAt,
      })

      return ok<Trade>({
        id: tradeId,
        positionId,
        symbol: input.symbol,
        side: input.side,
        quantity: input.quantity,
        price: input.price,
        fee: input.fee,
        executedAt: input.executedAt,
      })
    })
  }

  async getPositions(livePrices: Record<string, number> = {}): Promise<AgentResult<Position[]>> {
    return this.run(async () => {
      const rows = await db.select().from(positions)
      const result: Position[] = rows.map(row => {
        const qty = Number(row.quantity)
        const avgCost = Number(row.avgCost)
        const currentPrice = livePrices[row.symbol]
        const unrealizedPnl = currentPrice != null ? (currentPrice - avgCost) * qty : undefined
        const unrealizedPnlPct =
          currentPrice != null && avgCost > 0
            ? ((currentPrice - avgCost) / avgCost) * 100
            : undefined

        return {
          id: row.id,
          symbol: row.symbol,
          assetType: row.assetType as AssetType,
          quantity: qty,
          avgCost,
          currentPrice,
          unrealizedPnl,
          unrealizedPnlPct,
        }
      })
      return ok(result)
    })
  }
}
