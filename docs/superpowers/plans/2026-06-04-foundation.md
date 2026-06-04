# Finance Track — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Next.js 14 TypeScript project with libSQL (local-first), Drizzle ORM, Redis, shared agent types, and a working skeleton for all 7 agents.

**Architecture:** Orchestrator + Specialists pattern. Next.js App Router handles both frontend and API routes. All agents are TypeScript classes under `src/agents/`. The Orchestrator is the only agent called by API routes — it fans out to specialists internally.

**Tech Stack:** Next.js 14 (App Router), TypeScript, `@libsql/client`, Drizzle ORM, `ioredis`, `@anthropic-ai/sdk`, Vitest, Playwright

---

## File Map

| File | Purpose |
|------|---------|
| `src/types/agents.ts` | Shared `AgentResult<T>`, `AgentErrorCode`, base types |
| `src/types/domain.ts` | Domain types: Position, Trade, Alert, MarketPrice |
| `src/db/client.ts` | libSQL client (local + VPS sync URL) |
| `src/db/schema.ts` | Drizzle table definitions |
| `src/db/migrations/` | Drizzle migration files |
| `src/lib/cache/redis.ts` | Redis client singleton |
| `src/lib/market/yahoo.ts` | Yahoo Finance HTTP client |
| `src/agents/base.agent.ts` | Abstract base class all agents extend |
| `src/agents/orchestrator.agent.ts` | Routes requests, fans out to specialists |
| `src/agents/market-data.agent.ts` | Fetches live prices (Yahoo Finance) |
| `src/agents/portfolio.agent.ts` | CRUD positions + P&L calculation |
| `src/agents/risk.agent.ts` | Sector exposure, diversification score |
| `src/agents/intelligence.agent.ts` | Claude API insights |
| `src/agents/alert.agent.ts` | Price target / stop-loss rules |
| `src/agents/report.agent.ts` | Chart-ready JSON payloads |
| `src/app/api/orchestrator/route.ts` | POST handler → OrchestratorAgent |
| `drizzle.config.ts` | Drizzle CLI config |
| `vitest.config.ts` | Vitest config |
| `tests/agents/portfolio.test.ts` | Portfolio agent unit tests |
| `tests/agents/risk.test.ts` | Risk agent unit tests |

---

## Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.local`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/chyeyik.lim/Desktop/Project/finance-track
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-git --import-alias "@/*"
```

Expected: Next.js project created with App Router and `src/` directory.

- [ ] **Step 2: Install agent + DB dependencies**

```bash
npm install @anthropic-ai/sdk @libsql/client drizzle-orm ioredis
npm install -D drizzle-kit vitest @vitejs/plugin-react @playwright/test supertest @types/supertest
```

- [ ] **Step 3: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
# libSQL
LIBSQL_URL=file:local.db
LIBSQL_SYNC_URL=http://YOUR_VPS_IP:8080
LIBSQL_AUTH_TOKEN=

# Redis
REDIS_URL=redis://localhost:6379

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Market Data
YAHOO_FINANCE_BASE_URL=https://query1.finance.yahoo.com
EOF
```

- [ ] **Step 4: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 14 project with TypeScript"
```

---

## Task 2: Configure Drizzle + libSQL

**Files:**
- Create: `drizzle.config.ts`, `src/db/client.ts`

- [ ] **Step 1: Write failing test for DB client**

Create `tests/db/client.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { db } from '@/db/client'

describe('db client', () => {
  it('connects to local SQLite database', async () => {
    const result = await db.execute('SELECT 1 as value')
    expect(result.rows[0]).toEqual({ value: 1 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/db/client.test.ts
```

Expected: FAIL — `Cannot find module '@/db/client'`

- [ ] **Step 3: Create `drizzle.config.ts`**

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.LIBSQL_URL ?? 'file:local.db',
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  },
} satisfies Config
```

- [ ] **Step 4: Create `src/db/client.ts`**

```typescript
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const client = createClient({
  url: process.env.LIBSQL_URL ?? 'file:local.db',
  syncUrl: process.env.LIBSQL_SYNC_URL,
  authToken: process.env.LIBSQL_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
export { client }
```

- [ ] **Step 5: Create placeholder `src/db/schema.ts`** (expanded in Task 3)

```typescript
// schema defined in Task 3
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx vitest run tests/db/client.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add libSQL client and Drizzle config"
```

---

## Task 3: Define database schema

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/` (generated)

- [ ] **Step 1: Write failing test for schema**

Create `tests/db/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { db } from '@/db/client'
import { positions, trades, alerts } from '@/db/schema'

describe('schema', () => {
  it('can insert and read a position', async () => {
    await db.insert(positions).values({
      id: 'test-pos-1',
      symbol: 'AAPL',
      assetType: 'stock',
      quantity: '10',
      avgCost: '150.00',
    })
    const rows = await db.select().from(positions)
    expect(rows.some(r => r.symbol === 'AAPL')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/db/schema.test.ts
```

Expected: FAIL — schema tables not defined

- [ ] **Step 3: Write `src/db/schema.ts`**

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const positions = sqliteTable('positions', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  assetType: text('asset_type', { enum: ['stock', 'crypto', 'etf'] }).notNull(),
  quantity: text('quantity').notNull(),
  avgCost: text('avg_cost').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const trades = sqliteTable('trades', {
  id: text('id').primaryKey(),
  positionId: text('position_id').references(() => positions.id),
  symbol: text('symbol').notNull(),
  side: text('side', { enum: ['buy', 'sell'] }).notNull(),
  quantity: text('quantity').notNull(),
  price: text('price').notNull(),
  fee: text('fee').default('0'),
  executedAt: integer('executed_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  condition: text('condition', { enum: ['above', 'below'] }).notNull(),
  threshold: text('threshold').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  triggeredAt: integer('triggered_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

- [ ] **Step 4: Generate and run migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: Migration files created in `src/db/migrations/`, tables created in `local.db`

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/db/schema.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: define database schema for positions, trades, alerts"
```

---

## Task 4: Define shared TypeScript types

**Files:**
- Create: `src/types/agents.ts`, `src/types/domain.ts`

- [ ] **Step 1: Create `src/types/agents.ts`**

```typescript
export type AgentErrorCode =
  | 'NETWORK_ERROR'
  | 'DB_ERROR'
  | 'VALIDATION_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'CACHE_ERROR'
  | 'AI_ERROR'

export type AgentResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: AgentErrorCode }

export function ok<T>(data: T): AgentResult<T> {
  return { success: true, data }
}

export function fail(error: string, code: AgentErrorCode): AgentResult<never> {
  return { success: false, error, code }
}
```

- [ ] **Step 2: Create `src/types/domain.ts`**

```typescript
export type AssetType = 'stock' | 'crypto' | 'etf'

export interface Position {
  id: string
  symbol: string
  assetType: AssetType
  quantity: number
  avgCost: number
  currentPrice?: number
  unrealizedPnl?: number
  unrealizedPnlPct?: number
}

export interface Trade {
  id: string
  positionId: string | null
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  fee: number
  executedAt: Date
}

export interface MarketPrice {
  symbol: string
  price: number
  change: number
  changePct: number
  volume: number
  fetchedAt: Date
}

export interface Alert {
  id: string
  symbol: string
  condition: 'above' | 'below'
  threshold: number
  active: boolean
  triggeredAt: Date | null
}

export interface RiskMetrics {
  diversificationScore: number
  topHoldingPct: number
  sectorExposure: Record<string, number>
  beta: number | null
}

export interface DashboardPayload {
  positions: Position[]
  totalValue: number
  totalPnl: number
  totalPnlPct: number
  riskMetrics: RiskMetrics
  insights: string
  activeAlerts: Alert[]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/
git commit -m "feat: add shared agent result types and domain types"
```

---

## Task 5: Set up Redis client

**Files:**
- Create: `src/lib/cache/redis.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/redis.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { cache } from '@/lib/cache/redis'

describe('redis cache', () => {
  it('sets and gets a value', async () => {
    await cache.set('test:key', JSON.stringify({ value: 42 }), 'EX', 60)
    const raw = await cache.get('test:key')
    expect(JSON.parse(raw!)).toEqual({ value: 42 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/redis.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/cache/redis'`

- [ ] **Step 3: Create `src/lib/cache/redis.ts`**

```typescript
import Redis from 'ioredis'

let instance: Redis | null = null

export function getRedis(): Redis {
  if (!instance) {
    instance = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    })
  }
  return instance
}

export const cache = getRedis()
```

- [ ] **Step 4: Run test to verify it passes**

```bash
# Ensure Redis is running locally first
redis-server --daemonize yes
npx vitest run tests/lib/redis.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Redis client singleton"
```

---

## Task 6: Create Yahoo Finance market data client

**Files:**
- Create: `src/lib/market/yahoo.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/yahoo.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { fetchPrice } from '@/lib/market/yahoo'

describe('yahoo finance client', () => {
  it('returns a MarketPrice for a valid symbol', async () => {
    // Mock fetch to avoid real network call in tests
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [{
            meta: { regularMarketPrice: 178.5, previousClose: 175.0 },
            indicators: { quote: [{ volume: [1000000] }] }
          }]
        }
      })
    }))

    const price = await fetchPrice('AAPL')
    expect(price.symbol).toBe('AAPL')
    expect(price.price).toBe(178.5)
    expect(price.change).toBeCloseTo(3.5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/yahoo.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/market/yahoo'`

- [ ] **Step 3: Create `src/lib/market/yahoo.ts`**

```typescript
import type { MarketPrice } from '@/types/domain'

const BASE_URL = process.env.YAHOO_FINANCE_BASE_URL ?? 'https://query1.finance.yahoo.com'

export async function fetchPrice(symbol: string): Promise<MarketPrice> {
  const url = `${BASE_URL}/v8/finance/chart/${symbol}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`Yahoo Finance fetch failed: ${res.status}`)

  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`No data for symbol: ${symbol}`)

  const price: number = result.meta.regularMarketPrice
  const prevClose: number = result.meta.previousClose ?? price
  const volume: number = result.indicators?.quote?.[0]?.volume?.at(-1) ?? 0

  return {
    symbol,
    price,
    change: price - prevClose,
    changePct: ((price - prevClose) / prevClose) * 100,
    volume,
    fetchedAt: new Date(),
  }
}

export async function fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
  return Promise.all(symbols.map(fetchPrice))
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/lib/yahoo.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Yahoo Finance market data client"
```

---

## Task 7: Create base agent class

**Files:**
- Create: `src/agents/base.agent.ts`

- [ ] **Step 1: Create `src/agents/base.agent.ts`**

```typescript
import type { AgentResult } from '@/types/agents'
import { fail } from '@/types/agents'

export abstract class BaseAgent {
  protected readonly name: string

  constructor(name: string) {
    this.name = name
  }

  protected async run<T>(fn: () => Promise<AgentResult<T>>): Promise<AgentResult<T>> {
    try {
      return await fn()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return fail(`[${this.name}] ${message}`, 'NETWORK_ERROR')
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/base.agent.ts
git commit -m "feat: add BaseAgent abstract class"
```

---

## Task 8: Implement Portfolio Agent

**Files:**
- Create: `src/agents/portfolio.agent.ts`
- Create: `tests/agents/portfolio.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/agents/portfolio.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { PortfolioAgent } from '@/agents/portfolio.agent'
import { db } from '@/db/client'
import { positions, trades } from '@/db/schema'

const agent = new PortfolioAgent()

beforeEach(async () => {
  await db.delete(trades)
  await db.delete(positions)
})

describe('PortfolioAgent', () => {
  it('adds a position', async () => {
    const result = await agent.addTrade({
      symbol: 'AAPL',
      assetType: 'stock',
      side: 'buy',
      quantity: 10,
      price: 150,
      fee: 0,
      executedAt: new Date(),
    })
    expect(result.success).toBe(true)
  })

  it('calculates unrealized P&L', async () => {
    await agent.addTrade({
      symbol: 'AAPL',
      assetType: 'stock',
      side: 'buy',
      quantity: 10,
      price: 150,
      fee: 0,
      executedAt: new Date(),
    })
    const result = await agent.getPositions({ AAPL: 160 })
    expect(result.success).toBe(true)
    if (!result.success) return
    const pos = result.data.find(p => p.symbol === 'AAPL')!
    expect(pos.unrealizedPnl).toBeCloseTo(100) // (160-150) * 10
    expect(pos.unrealizedPnlPct).toBeCloseTo(6.67, 1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/agents/portfolio.test.ts
```

Expected: FAIL — `Cannot find module '@/agents/portfolio.agent'`

- [ ] **Step 3: Implement `src/agents/portfolio.agent.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/agents/portfolio.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: implement PortfolioAgent with trade recording and P&L"
```

---

## Task 9: Implement Market Data Agent

**Files:**
- Create: `src/agents/market-data.agent.ts`

- [ ] **Step 1: Write failing test**

Create `tests/agents/market-data.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { MarketDataAgent } from '@/agents/market-data.agent'

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    chart: {
      result: [{
        meta: { regularMarketPrice: 178.5, previousClose: 175.0 },
        indicators: { quote: [{ volume: [1000000] }] }
      }]
    }
  })
}))

const agent = new MarketDataAgent()

describe('MarketDataAgent', () => {
  it('returns live prices for symbols', async () => {
    const result = await agent.getPrices(['AAPL'])
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data['AAPL'].price).toBe(178.5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/agents/market-data.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `src/agents/market-data.agent.ts`**

```typescript
import { BaseAgent } from './base.agent'
import { cache } from '@/lib/cache/redis'
import { fetchPrices } from '@/lib/market/yahoo'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { MarketPrice } from '@/types/domain'

const CACHE_TTL_SECONDS = 300

export class MarketDataAgent extends BaseAgent {
  constructor() {
    super('MarketDataAgent')
  }

  async getPrices(symbols: string[]): Promise<AgentResult<Record<string, MarketPrice>>> {
    return this.run(async () => {
      const result: Record<string, MarketPrice> = {}
      const toFetch: string[] = []

      for (const symbol of symbols) {
        const cached = await cache.get(`price:${symbol}`)
        if (cached) {
          result[symbol] = JSON.parse(cached)
        } else {
          toFetch.push(symbol)
        }
      }

      if (toFetch.length > 0) {
        const fresh = await fetchPrices(toFetch)
        for (const price of fresh) {
          result[price.symbol] = price
          await cache.set(`price:${price.symbol}`, JSON.stringify(price), 'EX', CACHE_TTL_SECONDS)
        }
      }

      return ok(result)
    })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/agents/market-data.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: implement MarketDataAgent with Redis caching"
```

---

## Task 10: Implement Risk Agent

**Files:**
- Create: `src/agents/risk.agent.ts`
- Create: `tests/agents/risk.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/agents/risk.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { RiskAgent } from '@/agents/risk.agent'
import type { Position } from '@/types/domain'

const agent = new RiskAgent()

const mockPositions: Position[] = [
  { id: '1', symbol: 'AAPL', assetType: 'stock', quantity: 10, avgCost: 150, currentPrice: 160 },
  { id: '2', symbol: 'GOOGL', assetType: 'stock', quantity: 5, avgCost: 130, currentPrice: 140 },
  { id: '3', symbol: 'BTC', assetType: 'crypto', quantity: 0.5, avgCost: 40000, currentPrice: 45000 },
]

describe('RiskAgent', () => {
  it('computes diversification score', async () => {
    const result = await agent.analyze(mockPositions)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.diversificationScore).toBeGreaterThan(0)
    expect(result.data.diversificationScore).toBeLessThanOrEqual(100)
  })

  it('computes sector exposure by asset type', async () => {
    const result = await agent.analyze(mockPositions)
    if (!result.success) return
    expect(result.data.sectorExposure).toHaveProperty('stock')
    expect(result.data.sectorExposure).toHaveProperty('crypto')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/agents/risk.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `src/agents/risk.agent.ts`**

```typescript
import { BaseAgent } from './base.agent'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { Position, RiskMetrics } from '@/types/domain'

export class RiskAgent extends BaseAgent {
  constructor() {
    super('RiskAgent')
  }

  async analyze(positions: Position[]): Promise<AgentResult<RiskMetrics>> {
    return this.run(async () => {
      const totalValue = positions.reduce(
        (sum, p) => sum + (p.currentPrice ?? p.avgCost) * p.quantity,
        0
      )

      if (totalValue === 0) {
        return ok({ diversificationScore: 0, topHoldingPct: 0, sectorExposure: {}, beta: null })
      }

      const sectorExposure: Record<string, number> = {}
      let topHoldingValue = 0

      for (const pos of positions) {
        const value = (pos.currentPrice ?? pos.avgCost) * pos.quantity
        const pct = (value / totalValue) * 100
        sectorExposure[pos.assetType] = (sectorExposure[pos.assetType] ?? 0) + pct
        if (value > topHoldingValue) topHoldingValue = value
      }

      const topHoldingPct = (topHoldingValue / totalValue) * 100
      // Simple diversification score: penalises concentration
      // 100 = perfectly spread, 0 = single holding
      const n = positions.length
      const diversificationScore = n <= 1 ? 0 : Math.max(0, 100 - topHoldingPct)

      return ok({ diversificationScore, topHoldingPct, sectorExposure, beta: null })
    })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/agents/risk.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: implement RiskAgent with diversification and sector exposure"
```

---

## Task 11: Implement Intelligence Agent

**Files:**
- Create: `src/agents/intelligence.agent.ts`

- [ ] **Step 1: Write failing test**

Create `tests/agents/intelligence.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { IntelligenceAgent } from '@/agents/intelligence.agent'
import type { Position } from '@/types/domain'

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Your portfolio looks well diversified.' }]
      })
    }
  }
}))

const agent = new IntelligenceAgent()

describe('IntelligenceAgent', () => {
  it('returns a non-empty insight string', async () => {
    const positions: Position[] = [
      { id: '1', symbol: 'AAPL', assetType: 'stock', quantity: 10, avgCost: 150, currentPrice: 160 }
    ]
    const result = await agent.getInsights(positions)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/agents/intelligence.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `src/agents/intelligence.agent.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { BaseAgent } from './base.agent'
import { ok, fail } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { Position } from '@/types/domain'

export class IntelligenceAgent extends BaseAgent {
  private client: Anthropic

  constructor() {
    super('IntelligenceAgent')
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async getInsights(positions: Position[]): Promise<AgentResult<string>> {
    return this.run(async () => {
      const summary = positions.map(p => ({
        symbol: p.symbol,
        type: p.assetType,
        qty: p.quantity,
        avgCost: p.avgCost,
        currentPrice: p.currentPrice,
        pnlPct: p.unrealizedPnlPct?.toFixed(2),
      }))

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: `You are a concise portfolio analyst. Give 2-3 sentence insights about the portfolio. 
No financial advice. Focus on diversification, concentration risk, and notable movers.`,
        messages: [
          {
            role: 'user',
            content: `Portfolio positions: ${JSON.stringify(summary, null, 2)}`,
          },
        ],
      })

      const text = response.content.find(b => b.type === 'text')?.text
      if (!text) return fail('No insight returned from Claude', 'AI_ERROR')
      return ok(text)
    })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/agents/intelligence.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: implement IntelligenceAgent using Claude API"
```

---

## Task 12: Implement Alert Agent

**Files:**
- Create: `src/agents/alert.agent.ts`

- [ ] **Step 1: Write failing test**

Create `tests/agents/alert.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { AlertAgent } from '@/agents/alert.agent'
import { db } from '@/db/client'
import { alerts } from '@/db/schema'

const agent = new AlertAgent()

beforeEach(async () => {
  await db.delete(alerts)
})

describe('AlertAgent', () => {
  it('creates an alert', async () => {
    const result = await agent.createAlert({
      symbol: 'AAPL',
      condition: 'above',
      threshold: 200,
    })
    expect(result.success).toBe(true)
  })

  it('detects triggered alerts given current prices', async () => {
    await agent.createAlert({ symbol: 'AAPL', condition: 'above', threshold: 150 })
    const result = await agent.checkAlerts({ AAPL: 160 })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.triggered).toHaveLength(1)
    expect(result.data.triggered[0].symbol).toBe('AAPL')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/agents/alert.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `src/agents/alert.agent.ts`**

```typescript
import { randomUUID } from 'crypto'
import { eq, and } from 'drizzle-orm'
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/agents/alert.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: implement AlertAgent with rule evaluation"
```

---

## Task 13: Implement Report Agent

**Files:**
- Create: `src/agents/report.agent.ts`

- [ ] **Step 1: Create `src/agents/report.agent.ts`**

```typescript
import { BaseAgent } from './base.agent'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { Position, MarketPrice, RiskMetrics, Alert, DashboardPayload } from '@/types/domain'

interface BuildDashboardInput {
  positions: Position[]
  prices: Record<string, MarketPrice>
  riskMetrics: RiskMetrics
  insights: string
  activeAlerts: Alert[]
}

export class ReportAgent extends BaseAgent {
  constructor() {
    super('ReportAgent')
  }

  async buildDashboardPayload(input: BuildDashboardInput): Promise<AgentResult<DashboardPayload>> {
    return this.run(async () => {
      const totalValue = input.positions.reduce(
        (sum, p) => sum + (p.currentPrice ?? p.avgCost) * p.quantity,
        0
      )
      const totalCost = input.positions.reduce(
        (sum, p) => sum + p.avgCost * p.quantity,
        0
      )
      const totalPnl = totalValue - totalCost
      const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

      return ok({
        positions: input.positions,
        totalValue,
        totalPnl,
        totalPnlPct,
        riskMetrics: input.riskMetrics,
        insights: input.insights,
        activeAlerts: input.activeAlerts,
      })
    })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/report.agent.ts
git commit -m "feat: implement ReportAgent dashboard payload builder"
```

---

## Task 14: Implement Orchestrator Agent

**Files:**
- Create: `src/agents/orchestrator.agent.ts`
- Create: `tests/agents/orchestrator.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/agents/orchestrator.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { OrchestratorAgent } from '@/agents/orchestrator.agent'

// Light smoke test — agents are tested individually
describe('OrchestratorAgent', () => {
  it('returns a DashboardPayload on getDashboard', async () => {
    const agent = new OrchestratorAgent()
    const result = await agent.getDashboard()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toHaveProperty('positions')
    expect(result.data).toHaveProperty('totalValue')
    expect(result.data).toHaveProperty('riskMetrics')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/agents/orchestrator.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `src/agents/orchestrator.agent.ts`**

```typescript
import { BaseAgent } from './base.agent'
import { PortfolioAgent } from './portfolio.agent'
import { MarketDataAgent } from './market-data.agent'
import { RiskAgent } from './risk.agent'
import { IntelligenceAgent } from './intelligence.agent'
import { AlertAgent } from './alert.agent'
import { ReportAgent } from './report.agent'
import { ok } from '@/types/agents'
import type { AgentResult } from '@/types/agents'
import type { DashboardPayload } from '@/types/domain'

export class OrchestratorAgent extends BaseAgent {
  private portfolio = new PortfolioAgent()
  private marketData = new MarketDataAgent()
  private risk = new RiskAgent()
  private intelligence = new IntelligenceAgent()
  private alerts = new AlertAgent()
  private report = new ReportAgent()

  constructor() {
    super('OrchestratorAgent')
  }

  async getDashboard(): Promise<AgentResult<DashboardPayload>> {
    return this.run(async () => {
      // Phase 1: fetch positions
      const positionsResult = await this.portfolio.getPositions()
      const positions = positionsResult.success ? positionsResult.data : []

      // Phase 2: fetch live prices for all held symbols
      const symbols = positions.map(p => p.symbol)
      const pricesResult = symbols.length > 0
        ? await this.marketData.getPrices(symbols)
        : { success: true as const, data: {} }

      const prices = pricesResult.success ? pricesResult.data : {}
      const priceMap = Object.fromEntries(
        Object.entries(prices).map(([sym, mp]) => [sym, mp.price])
      )

      // Enrich positions with live prices
      const enrichedPositions = positions.map(p => ({
        ...p,
        currentPrice: priceMap[p.symbol] ?? p.avgCost,
        unrealizedPnl: priceMap[p.symbol]
          ? (priceMap[p.symbol] - p.avgCost) * p.quantity
          : 0,
        unrealizedPnlPct: priceMap[p.symbol]
          ? ((priceMap[p.symbol] - p.avgCost) / p.avgCost) * 100
          : 0,
      }))

      // Phase 3: parallel — risk + intelligence + alert checking (all need live prices)
      const [riskResult, insightResult, alertsResult] = await Promise.all([
        this.risk.analyze(enrichedPositions),
        this.intelligence.getInsights(enrichedPositions),
        this.alerts.checkAlerts(priceMap),
      ])

      const activeAlerts = alertsResult.success ? alertsResult.data.active : []

      const riskMetrics = riskResult.success
        ? riskResult.data
        : { diversificationScore: 0, topHoldingPct: 0, sectorExposure: {}, beta: null }

      const insights = insightResult.success ? insightResult.data : ''

      // Phase 4: build report
      const reportResult = await this.report.buildDashboardPayload({
        positions: enrichedPositions,
        prices,
        riskMetrics,
        insights,
        activeAlerts,
      })

      if (!reportResult.success) throw new Error(reportResult.error)
      return ok(reportResult.data)
    })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/agents/orchestrator.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: implement OrchestratorAgent with 3-phase parallel execution"
```

---

## Task 15: Wire Orchestrator to Next.js API route

**Files:**
- Create: `src/app/api/orchestrator/route.ts`

- [ ] **Step 1: Create `src/app/api/orchestrator/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { OrchestratorAgent } from '@/agents/orchestrator.agent'

const orchestrator = new OrchestratorAgent()

export async function GET() {
  const result = await orchestrator.getDashboard()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
```

- [ ] **Step 2: Start dev server and verify endpoint**

```bash
npm run dev
```

In a second terminal:

```bash
curl http://localhost:3000/api/orchestrator
```

Expected: JSON response with `positions`, `totalValue`, `riskMetrics`, `insights`, `activeAlerts`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orchestrator/route.ts
git commit -m "feat: wire OrchestratorAgent to GET /api/orchestrator"
```

---

## Task 16: Configure Vitest

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Create `tests/setup.ts`**

```typescript
import { db } from '@/db/client'
import { positions, trades, alerts } from '@/db/schema'
import { afterAll } from 'vitest'

afterAll(async () => {
  await db.delete(trades)
  await db.delete(positions)
  await db.delete(alerts)
})
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/setup.ts
git commit -m "chore: configure Vitest with path aliases and cleanup"
```

---

## Task 17: Basic dashboard page

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Create dashboard page**

```tsx
// src/app/(dashboard)/page.tsx
import type { DashboardPayload } from '@/types/domain'

async function getDashboard(): Promise<DashboardPayload | null> {
  try {
    const res = await fetch('http://localhost:3000/api/orchestrator', {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboard()

  if (!data) {
    return <div className="p-8 text-red-500">Failed to load dashboard.</div>
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Portfolio</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-xl font-semibold">${data.totalValue.toFixed(2)}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Total P&L</p>
          <p className={`text-xl font-semibold ${data.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.totalPnl >= 0 ? '+' : ''}{data.totalPnl.toFixed(2)} ({data.totalPnlPct.toFixed(2)}%)
          </p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Diversification</p>
          <p className="text-xl font-semibold">{data.riskMetrics.diversificationScore.toFixed(0)}/100</p>
        </div>
      </div>

      <div className="rounded border p-4">
        <h2 className="font-semibold mb-2">AI Insights</h2>
        <p className="text-sm text-gray-700">{data.insights || 'No insights available.'}</p>
      </div>

      <div className="rounded border p-4">
        <h2 className="font-semibold mb-2">Positions</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-1">Symbol</th>
              <th>Qty</th>
              <th>Avg Cost</th>
              <th>Current</th>
              <th>P&L %</th>
            </tr>
          </thead>
          <tbody>
            {data.positions.map(p => (
              <tr key={p.id} className="border-t">
                <td className="py-1 font-medium">{p.symbol}</td>
                <td>{p.quantity}</td>
                <td>${p.avgCost.toFixed(2)}</td>
                <td>${(p.currentPrice ?? 0).toFixed(2)}</td>
                <td className={p.unrealizedPnlPct != null && p.unrealizedPnlPct >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {p.unrealizedPnlPct?.toFixed(2) ?? '—'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000` — expected: dashboard with empty portfolio, $0 total value, AI insights section.

- [ ] **Step 3: Commit**

```bash
git add src/app/
git commit -m "feat: add basic dashboard page with portfolio summary"
```

---

## Done

All 7 agents are scaffolded, tested, and wired to the dashboard. Next plans:
- `2026-06-04-moomoo-integration.md` — replace Yahoo Finance with moomoo API
- `2026-06-04-alert-notifications.md` — email/push delivery for triggered alerts
- `2026-06-04-vps-sqld-setup.md` — deploy sqld to Tencent Lighthouse Ubuntu VPS
