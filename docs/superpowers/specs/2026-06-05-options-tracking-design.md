# Options Tracking — Design Spec

**Date:** 2026-06-05
**Status:** Approved
**Scope:** Add option position tracking for short puts and spreads to FinanceTrack.

---

## Overview

A dedicated `/options` page and a dashboard summary card for tracking short put and spread option positions. Each position stores its legs, premium collected, expiry, and Greeks. Live data comes from moomoo via the existing OpenD integration.

---

## Strategies Supported

- **Short Put** (Cash-Secured Put) — 1 leg: sell put
- **Bull Put Spread** — 2 legs: sell higher-strike put + buy lower-strike put
- **Bear Call Spread** — 2 legs: sell lower-strike call + buy higher-strike call

---

## Data Model

### `option_positions` table

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `underlying` | text | e.g. `NVDA` |
| `strategy` | enum | `short_put`, `bull_put_spread`, `bear_call_spread` |
| `status` | enum | `open`, `closed`, `expired`, `assigned` |
| `currency` | enum | `USD`, `MYR`, `SGD`, `JPY` |
| `openedAt` | timestamp | |
| `closedAt` | timestamp | null if open |
| `createdAt` | timestamp | |

### `option_legs` table

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `optionPositionId` | text FK | → `option_positions.id` |
| `side` | enum | `buy`, `sell` |
| `optionType` | enum | `call`, `put` |
| `strike` | text | stored as decimal string |
| `expiry` | text | `YYYY-MM-DD` |
| `quantity` | text | number of contracts |
| `premiumPerContract` | text | credit if sell, debit if buy (×100 for total) |
| `closingPremium` | text | null if still open |
| `moomooCode` | text | e.g. `US.NVDA260717P185000` |
| `createdAt` | timestamp | |

### Computed fields (query-time, not stored)

| Field | Formula |
|---|---|
| `netPremium` | Σ(sell legs − buy legs) × qty × 100 |
| `maxProfit` | = net premium |
| `maxLoss` | (spread width − net premium) × 100 for spreads; (strike × 100 − net premium) for short puts |
| `breakeven` | strike − net premium per share (short put); upper strike − net premium (bull put spread) |
| `DTE` | days from today to earliest leg expiry |
| `currentValue` | live price from moomoo snapshot × qty × 100 |
| `unrealisedPnL` | net premium − current value |
| `delta`, `theta`, `iv` | fetched live from moomoo snapshot per leg's moomoo code |

---

## Architecture

```
src/
├── db/
│   └── schema.ts                        # + option_positions, option_legs tables
├── agents/
│   └── options.agent.ts                 # CRUD + P&L computation
├── app/
│   ├── api/
│   │   ├── options/
│   │   │   └── route.ts                 # GET (list) + POST (create)
│   │   └── options/[id]/
│   │       └── route.ts                 # PATCH (close/update), DELETE
│   └── (dashboard)/
│       ├── options/
│       │   ├── page.tsx                 # Options page (server component)
│       │   └── add/
│       │       └── page.tsx             # Add Option form (client component)
└── components/
    └── OptionsSummaryCard.tsx           # Dashboard side-panel card
```

### Agent rules (follows existing patterns)

- `OptionsAgent` is a specialist — never imports other agents
- All persistence via `db/client.ts`
- Returns `AgentResult<T>` using `ok()` / `fail()`

---

## API Routes

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/options` | List all option positions with computed metrics |
| `POST` | `/api/options` | Create new option position + legs |
| `PATCH` | `/api/options/[id]` | Close position (set `closedAt`, `closingPremium` per leg) |

### POST body (short put example)
```json
{
  "underlying": "NVDA",
  "strategy": "short_put",
  "currency": "USD",
  "openedAt": "2026-06-05",
  "legs": [
    {
      "side": "sell",
      "optionType": "put",
      "strike": "185.00",
      "expiry": "2026-07-17",
      "quantity": "1",
      "premiumPerContract": "2.01",
      "moomooCode": "US.NVDA260717P185000"
    }
  ]
}
```

### POST body (bull put spread example)
```json
{
  "underlying": "SPY",
  "strategy": "bull_put_spread",
  "currency": "USD",
  "openedAt": "2026-06-05",
  "legs": [
    { "side": "sell", "optionType": "put", "strike": "520.00", "expiry": "2026-06-20", "quantity": "1", "premiumPerContract": "3.50", "moomooCode": "US.SPY260620P520000" },
    { "side": "buy",  "optionType": "put", "strike": "515.00", "expiry": "2026-06-20", "quantity": "1", "premiumPerContract": "1.20", "moomooCode": "US.SPY260620P515000" }
  ]
}
```

---

## UI

### `/options` page

- **Header:** "Options" title + subtitle + "Add Option" primary button
- **Summary bar:** 4 stat cards — Open Positions, Premium Collected, Unrealised P&L, Expiring ≤ 7 days
- **Tabs:** Open | Closed / History
- **Table columns:** Underlying, Strategy, Strike(s), Expiry, DTE, Premium, Curr. Val, P&L, Break-even, Delta, Theta/day, IV, Status
- Strategy and Status values shown as pill badges (fit-content width)
- Spreads show both strikes as `$520 / $515`

### `/options/add` page

- Strategy selector (short put, bull put spread, bear call spread)
- Form adapts: 1-leg fields for short put, 2-leg fields for spreads
- moomoo code field per leg (manually entered or auto-resolved)
- Live preview panel showing net premium, max profit, max loss, break-even

### Dashboard summary card (side panel, below FX Rates)

```
Options                          2 open
────────────────────────────────────────
Premium collected     $201.00
Unrealised P&L        +$30.50
Expiring ≤ 7 days     1
```

### moomoo Sync

- Update existing sync route (`POST /api/sync/moomoo`) to import option positions
- Detect options by code pattern (e.g. `NVDA260717P185000`)
- Map to `option_positions` + `option_legs` instead of skipping them

---

## Live Price & Greeks

- `GET /api/options` fetches moomoo snapshot for each open leg's `moomooCode`
- Extracts `last_price`, `delta`, `theta`, `implied_volatility` from snapshot response
- Falls back to `premiumPerContract` if moomoo is unavailable (OpenD offline)
- 60-second Redis cache keyed by moomoo code

---

## Out of Scope

- Assignment workflow (convert option to stock position on assignment)
- P&L charts / history graphs for options
- Automatic moomoo code resolution (user enters code manually for now)
- Notifications for expiring options (can be added to AlertAgent later)
