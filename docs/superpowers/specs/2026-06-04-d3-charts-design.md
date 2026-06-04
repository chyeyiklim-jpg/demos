# D3 Charts — Reports & Analytics Design

**Date:** 2026-06-04
**Status:** Approved
**Scope:** Replace static placeholder charts on the Reports page with interactive D3.js visualisations.

---

## Overview

Two D3 charts added to `src/app/(dashboard)/reports/page.tsx`:

1. **PortfolioBarChart** — grouped bar chart showing weekly cost basis vs estimated portfolio value
2. **AllocationDonutChart** — animated donut/ring chart showing asset allocation by sector

Both are Client Components driven by a shared `useD3` hook. Data is fetched server-side and passed as serialised props.

---

## Architecture

```
src/
├── hooks/
│   └── useD3.ts                        # shared ref + useEffect + cleanup
├── components/charts/
│   ├── PortfolioBarChart.tsx            # grouped bars + tooltip
│   └── AllocationDonutChart.tsx         # donut arcs + center label + legend
├── app/api/portfolio-history/
│   └── route.ts                        # weekly snapshot computation
└── app/(dashboard)/reports/
    └── page.tsx                        # server component, passes data as props
```

### Data Flow

```
trades table
    ↓
GET /api/portfolio-history
    → replay trades chronologically
    → group into ISO weeks
    → accumulate costBasis per week
    → estimatedValue = costBasis × (1 + totalPnlPct/100)
    ↓
ReportsPage (Server Component)
    → fetches /api/portfolio-history and /api/orchestrator in parallel
    → passes { history, sectorExposure, totalValue } as props
    ↓
PortfolioBarChart  ('use client')   → D3 renders into <svg ref>
AllocationDonutChart  ('use client') → D3 renders into <svg ref>
```

---

## useD3 Hook

**File:** `src/hooks/useD3.ts`

```typescript
export function useD3<T extends Element>(
  renderFn: (selection: d3.Selection<T, unknown, null, undefined>) => void,
  deps: React.DependencyList
): React.RefObject<T>
```

- Creates a `useRef<T>(null)`
- Runs `renderFn` inside `useEffect` whenever `deps` change
- Cleanup: `selection.selectAll('*').remove()` on unmount / re-render

---

## Chart 1: PortfolioBarChart

**File:** `src/components/charts/PortfolioBarChart.tsx`

### Props
```typescript
interface WeekSnapshot {
  week: string        // e.g. "Jun W1"
  costBasis: number
  estimatedValue: number
}

interface Props {
  data: WeekSnapshot[]
  height?: number     // default 200
}
```

### Visual spec
- Full container width (ResizeObserver), height 200px
- Margins: top 16, right 16, bottom 32, left 56
- Two bars per week group, gap 2px between bars, gap 12px between groups
- Bar colours: cost basis `#0EA5E9` (primary), estimated value `#6366F1`
- Y-axis: left, 4 ticks, dollar-formatted (`$48K`), gridlines `#E5E7EB` opacity 0.5
- X-axis: bottom, week labels rotated 0°
- Legend: top-right, two coloured dots + labels
- **Animation:** bars grow from `y = height` upward, duration 600ms, `d3.easeQuadOut`, staggered by 30ms per group
- **Tooltip:** floating `<div>` positioned with pointer events, shows: week, Cost Basis `$x`, Est. Value `$x`, Change `±x%`
- Empty state: centred "No trade history yet" text

### Responsive behaviour
ResizeObserver on the container div re-renders the chart when width changes.

---

## Chart 2: AllocationDonutChart

**File:** `src/components/charts/AllocationDonutChart.tsx`

### Props
```typescript
interface Props {
  data: Record<string, number>   // { stock: 57, crypto: 43, etf: 0 }
  totalValue: number
  size?: number                   // default 200
}
```

### Visual spec
- SVG `size × size`, centered in container
- Inner radius: 58% of outer radius (ring width ≈ 42%)
- Arc colours (fixed order): Stock `#0EA5E9`, Crypto `#6366F1`, ETF `#10B981`, others `#F59E0B`
- **Center label:** largest sector name + its % (static on load; updates on arc hover)
- **Legend:** below SVG — coloured dot + sector name (capitalised) + `xx%` + `$xx,xxx`
- **Animation:** arcs draw clockwise from 12 o'clock (startAngle 0), duration 700ms, `d3.easeInOut`
- **Hover:** hovered arc expands outward 6px (`outerRadius + 6`), center label updates to hovered sector
- Empty state: grey full ring + "No positions" center text

---

## API: `/api/portfolio-history`

**File:** `src/app/api/portfolio-history/route.ts`

### Response shape
```typescript
{ week: string; costBasis: number; estimatedValue: number }[]
```

### Algorithm
1. Fetch all trades ordered by `executedAt` ASC from `trades` table
2. Also fetch current `totalPnlPct` from OrchestratorAgent (or compute from positions)
3. Accumulate running `costBasis`:
   - Buy: `costBasis += quantity × price + fee`
   - Sell: `costBasis -= quantity × avgCost` (approximation)
4. Group snapshots by ISO week (`YYYY-Www`) — take last snapshot per week
5. `estimatedValue = costBasis × (1 + totalPnlPct / 100)`
6. Label weeks as `"Jun W1"`, `"Jun W2"` etc.
7. Return array sorted chronologically; minimum 1 point (current snapshot)

---

## Reports Page Updates

`src/app/(dashboard)/reports/page.tsx`:

1. Add parallel fetch: `Promise.all([getOrchestratorData(), getPortfolioHistory()])`
2. Replace CSS allocation bars with `<AllocationDonutChart data={sectorExposure} totalValue={totalValue} />`
3. Replace static mini-bars in performance table with `<PortfolioBarChart data={history} />`
4. The time-range selector (1W/1M/3M/6M/1Y/All) filters the history array client-side — pass `range` state down to `PortfolioBarChart`

---

## Dependencies

```bash
npm install d3
npm install -D @types/d3
```

---

## Out of Scope

- Real historical price data (uses estimated value based on current P&L%)
- Candlestick / OHLCV charts
- Export chart as image
- Dark mode chart variants (uses CSS variables — inherits automatically)
