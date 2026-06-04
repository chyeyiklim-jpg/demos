# Finance Track — Sub-Agent Architecture Design

**Date:** 2026-06-04  
**Status:** Approved  
**Platform:** Web (Next.js) — future Mobile (React Native)

---

## Overview

Finance Track is an investment portfolio tracker (stocks, crypto) with live market data, AI-generated insights, risk analysis, automated alerts, and performance reports. The backend is structured as an **Orchestrator + Specialists** multi-agent system built on the Claude Agent SDK in TypeScript.

---

## Architecture

The frontend (Next.js App Router) communicates only with the Orchestrator via Next.js Route Handlers. The Orchestrator interprets user intent, fans out to specialist agents in parallel, and synthesizes results back to the frontend.

```
[Next.js App Router]
      │
      ├── /app              (React frontend — dashboard, pages, components)
      │
      └── /app/api          (Route Handlers = Orchestrator entry point)
              │
              ├──▶ MarketDataAgent     → moomoo / Yahoo Finance APIs
              ├──▶ PortfolioAgent      → Turso (libSQL) via Drizzle ORM
              ├──▶ RiskAgent           → computed from portfolio + market data
              ├──▶ IntelligenceAgent   → Claude API (claude-sonnet-4-6)
              ├──▶ AlertAgent          → rule engine + Redis pub/sub + notifications
              └──▶ ReportAgent         → chart-ready JSON, PDF/CSV export
```

**Key principles:**
- Orchestrator holds no business logic — routes and aggregates only
- Specialists are stateless — all state lives in Turso or Redis cache
- Agents communicate via internal TypeScript function calls (not HTTP)
- Single Next.js project — no separate frontend/backend folders

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Agent SDK | Claude Agent SDK (TypeScript) |
| AI Model | claude-sonnet-4-6 |
| Database | libSQL (local-first) + sqld self-hosted on Tencent Lighthouse (Ubuntu) |
| ORM | Drizzle ORM |
| Cache | Redis (market data, alert queues) |
| Auth | NextAuth.js |
| Testing | Vitest, Supertest, Playwright |

---

## Agent Roles (7 total)

### 1. Orchestrator Agent
- **File:** `src/agents/orchestrator.agent.ts`
- **Role:** Single entry point. Parses user intent via Claude tool_use, fans out to specialists in parallel, merges and returns unified response.
- **Rule:** Never contains business logic. Never imports other agents' internals — only calls their public methods.

### 2. Market Data Agent
- **File:** `src/agents/market-data.agent.ts`
- **Role:** Fetches live prices, OHLCV, and news from moomoo API and Yahoo Finance. Caches results in Redis with a 5-minute TTL.
- **Failure:** Returns stale cached data if live fetch fails (stale-while-revalidate).

### 3. Portfolio Agent
- **File:** `src/agents/portfolio.agent.ts`
- **Role:** CRUD for trades and positions. Calculates realized and unrealized P&L. Owns all reads/writes to the local libSQL database (synced to VPS sqld).
- **Failure:** Hard fail — stale portfolio data is worse than no data.

### 4. Risk Agent
- **File:** `src/agents/risk.agent.ts`
- **Role:** Computes sector exposure, beta, and diversification score from portfolio positions and live market data. Stateless — derived entirely from PortfolioAgent + MarketDataAgent outputs.
- **Failure:** Returns partial result with missing fields flagged.

### 5. Intelligence Agent
- **File:** `src/agents/intelligence.agent.ts`
- **Role:** Generates AI insights, buy/sell rationale, and portfolio commentary using Claude API (claude-sonnet-4-6) with prompt caching for efficiency.
- **Failure:** Graceful degradation — skip AI section, render rest of dashboard normally.

### 6. Alert Agent
- **File:** `src/agents/alert.agent.ts`
- **Role:** Evaluates user-defined rules (price targets, stop-loss thresholds, news triggers). Publishes alerts via Redis pub/sub and delivers via email/push notifications.
- **Failure:** Log + retry queue via Redis — alerts are never dropped silently.

### 7. Report Agent
- **File:** `src/agents/report.agent.ts`
- **Role:** Aggregates data from Portfolio and Market Data agents into chart-ready JSON payloads. Handles PDF and CSV export.
- **Failure:** Returns partial report with error sections marked.

---

## Data Flow Example — Dashboard Load

```
User opens dashboard
    │
    ▼
Orchestrator (POST /api/orchestrator)
    ├──▶ PortfolioAgent.getPositions()       ─┐
    ├──▶ MarketDataAgent.getLivePrices()      ├── parallel
    └──▶ AlertAgent.getActiveAlerts()         ─┘
    │
    ▼
Orchestrator merges results, then:
    ├──▶ RiskAgent.analyze(positions + prices)
    └──▶ IntelligenceAgent.summarize(positions + prices)
    │
    ▼
ReportAgent.buildDashboardPayload()
    │
    ▼
Frontend renders dashboard
```

---

## Project Structure

```
finance-track/
├── src/
│   ├── app/
│   │   ├── (dashboard)/              # Portfolio dashboard UI pages
│   │   ├── api/
│   │   │   ├── orchestrator/route.ts # Main agent entry point
│   │   │   ├── alerts/route.ts       # Alert webhook endpoints
│   │   │   └── reports/route.ts      # Report download endpoints
│   │   └── layout.tsx
│   │
│   ├── agents/
│   │   ├── orchestrator.agent.ts
│   │   ├── market-data.agent.ts
│   │   ├── portfolio.agent.ts
│   │   ├── risk.agent.ts
│   │   ├── intelligence.agent.ts
│   │   ├── alert.agent.ts
│   │   └── report.agent.ts
│   │
│   ├── db/
│   │   ├── schema.ts                 # Drizzle table definitions
│   │   ├── client.ts                 # Turso connection
│   │   └── migrations/
│   │
│   ├── lib/
│   │   ├── market/                   # moomoo + Yahoo Finance API clients
│   │   ├── cache/                    # Redis client + helpers
│   │   └── notifications/            # Alert delivery (email, push)
│   │
│   └── types/                        # Shared TypeScript types
│
├── docs/superpowers/specs/
├── drizzle.config.ts
├── .env.local
└── package.json
```

---

## Error Handling

All agents return a typed result — no raw throws cross agent boundaries:

```typescript
type AgentResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: AgentErrorCode }
```

The Orchestrator collects all agent results and returns a unified response. Partial failures do not crash the whole dashboard.

---

## Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Agent unit tests | Vitest | Each agent method in isolation, mocked dependencies |
| Integration tests | Vitest + local Turso | Portfolio + Risk agents against real local DB |
| API route tests | Supertest | Orchestrator route handler end-to-end |
| E2E tests | Playwright | Dashboard golden path in browser |

---

## Out of Scope (v1)

- Multi-user / team features
- Broker statement import (CSV/PDF)
- Real-time collaborative editing
- React Native mobile app (planned for v2)
