import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { db } from '@/db/client'
import { positions, trades } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { getFxRateToUsd, type SupportedCurrency } from '@/lib/fx/frankfurter'

const execAsync = promisify(exec)

interface MoomooPosition {
  code: string
  name: string
  qty: number
  average_cost: number
  nominal_price: number
}

function isOption(code: string) {
  return /[A-Z]\d{6}[PC]\d+$/.test(code)
}

function parseMarket(code: string): { market: string; symbol: string } {
  const [market, ...rest] = code.split('.')
  return { market, symbol: rest.join('.') }
}

function currencyFromMarket(market: string): SupportedCurrency | null {
  const map: Record<string, SupportedCurrency> = { US: 'USD', SG: 'SGD', JP: 'JPY' }
  return map[market] ?? null
}

function assetTypeFromName(name: string): 'stock' | 'crypto' | 'etf' {
  const lower = name.toLowerCase()
  if (lower.includes('etf') || lower.includes('fund') || lower.includes('trust')) return 'etf'
  return 'stock'
}

export async function POST() {
  try {
    const accId = process.env.MOOMOO_ACC_ID
    const firm = process.env.MOOMOO_SECURITY_FIRM
    const script = process.env.MOOMOO_SCRIPT_PATH

    if (!accId || !firm || !script) {
      return NextResponse.json({ error: 'moomoo env vars not configured' }, { status: 500 })
    }

    const { stdout, stderr } = await execAsync(
      `python3 "${script}" --trd-env REAL --acc-id ${accId} --security-firm ${firm} --json`,
      { timeout: 30000 }
    )

    // strip python log lines from stderr mixed into output
    const jsonLine = [...stdout.split('\n'), ...stderr.split('\n')]
      .find(l => l.trim().startsWith('{'))

    if (!jsonLine) {
      return NextResponse.json({ error: 'No JSON output from moomoo script' }, { status: 502 })
    }

    const data = JSON.parse(jsonLine)
    const rawPositions: MoomooPosition[] = data.positions ?? []

    const eligible = rawPositions.filter(p => !isOption(p.code) && p.qty > 0)

    const results: { symbol: string; action: 'created' | 'updated' | 'skipped'; reason?: string }[] = []

    for (const p of eligible) {
      const { market, symbol } = parseMarket(p.code)
      const currency = currencyFromMarket(market)

      if (!currency) {
        results.push({ symbol, action: 'skipped', reason: `unsupported market ${market}` })
        continue
      }

      const assetType = assetTypeFromName(p.name)
      const fxRate = await getFxRateToUsd(currency)

      const existing = await db
        .select()
        .from(positions)
        .where(and(eq(positions.symbol, symbol), eq(positions.assetType, assetType)))
        .limit(1)

      if (existing.length > 0) {
        await db
          .update(positions)
          .set({
            quantity: String(p.qty),
            avgCost: String(p.average_cost),
            currency,
            updatedAt: new Date(),
          })
          .where(eq(positions.id, existing[0].id))

        results.push({ symbol, action: 'updated' })
      } else {
        const posId = randomUUID()
        await db.insert(positions).values({
          id: posId,
          symbol,
          assetType,
          quantity: String(p.qty),
          avgCost: String(p.average_cost),
          currency,
        })

        await db.insert(trades).values({
          id: randomUUID(),
          positionId: posId,
          symbol,
          side: 'buy',
          quantity: String(p.qty),
          price: String(p.average_cost),
          fee: '0',
          currency,
          fxRateToUsd: String(fxRate),
          executedAt: new Date(),
        })

        results.push({ symbol, action: 'created' })
      }
    }

    return NextResponse.json({ synced: results.length, results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
