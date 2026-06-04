import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { BaseAgent } from './base.agent'
import { db } from '@/db/client'
import { alerts } from '@/db/schema'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { Alert } from '@/types/domain'

interface CreateAlertInput {
  symbol: string
  condition: 'above' | 'below'
  threshold: number
}

interface CheckAlertsResult {
  triggered: Alert[]
  active: Alert[]
}

export class AlertAgent extends BaseAgent {
  constructor() {
    super('AlertAgent')
  }

  async createAlert(input: CreateAlertInput): Promise<AgentResult<Alert>> {
    return this.run(async () => {
      const id = randomUUID()
      await db.insert(alerts).values({
        id,
        symbol: input.symbol,
        condition: input.condition,
        threshold: String(input.threshold),
        active: true,
      })
      return ok<Alert>({
        id,
        symbol: input.symbol,
        condition: input.condition,
        threshold: input.threshold,
        active: true,
        triggeredAt: null,
      })
    })
  }

  async checkAlerts(prices: Record<string, number>): Promise<AgentResult<CheckAlertsResult>> {
    return this.run(async () => {
      const activeAlerts = await db
        .select()
        .from(alerts)
        .where(eq(alerts.active, true))

      const triggered: Alert[] = []
      const active: Alert[] = []

      for (const alert of activeAlerts) {
        const price = prices[alert.symbol]
        const threshold = Number(alert.threshold)
        const isTriggered =
          price != null &&
          ((alert.condition === 'above' && price >= threshold) ||
            (alert.condition === 'below' && price <= threshold))

        if (isTriggered) {
          const now = new Date()
          await db
            .update(alerts)
            .set({ active: false, triggeredAt: now })
            .where(eq(alerts.id, alert.id))
          triggered.push({
            id: alert.id,
            symbol: alert.symbol,
            condition: alert.condition as 'above' | 'below',
            threshold,
            active: false,
            triggeredAt: now,
          })
        } else {
          active.push({
            id: alert.id,
            symbol: alert.symbol,
            condition: alert.condition as 'above' | 'below',
            threshold,
            active: true,
            triggeredAt: null,
          })
        }
      }

      return ok({ triggered, active })
    })
  }
}
