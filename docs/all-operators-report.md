# All Operators Report (Aggregated Comparison for Super Admin)

> **Implementation status (July 2026):** Implemented. The production page now
> supports a shared reporting period, paginated data retrieval, sortable and
> paginated comparisons, period-aware CSV exports, operator drill-down, and
> completion/cancellation/average-ticket KPIs. The historical proposal below is
> retained as design context.

## Current State

The existing super admin report at `app/(dashboard)/super-admin/reports/page.tsx` shows **system-wide aggregated data** — total revenue, total bookings, total trips, total users, etc. It does **not break down per-operator** or provide a side-by-side comparison of operator performance.

The operator list at `app/(dashboard)/super-admin/operators/` only shows basic info (name, contact, status, created\_at). There is **no metric/performance data** visible.

## What's Missing

| Feature                                                                                         | Status    |
| ----------------------------------------------------------------------------------------------- | --------- |
| Comparison table of all operators' key metrics (buses, staff, routes, trips, bookings, revenue) | ❌ Missing |
| Ranking/sorting operators by performance                                                        | ❌ Missing |
| Per-operator revenue breakdown in super admin report                                            | ❌ Missing |
| Quick-visual overview (bar charts comparing operators)                                          | ❌ Missing |
| Aggregated PDF with per-operator breakdown                                                      | ❌ Missing |

## Existing Code That Can Be Reused

1. **Super Admin Reports page** — `app/(dashboard)/super-admin/reports/page.tsx` — System-wide data patterns
2. **Operator data-fetching** — The `fetchOperatorReport()` service proposed in `each-operator-report.md` can be called for each operator
3. **StatsCard** — `components/shared/stats-card.tsx` — Reusable metric display
4. **DataTable** — `components/shared/data-table.tsx` — Reusable table component for comparison
5. **BarChart** — `components/dashboard/bar-chart.tsx` — For operator comparison charts
6. **PDF Export** — `lib/utils/pdf-export.ts` — Can be extended for multi-operator PDF
7. **Operators list page** — Existing operators page already fetches all operators

## Proposed Architecture

### 1. New Route: `/super-admin/reports/operators`

```
app/(dashboard)/super-admin/reports/
├── page.tsx                      # Existing system-wide report
├── client.tsx                    # Existing system-wide client
├── operators/
│   ├── page.tsx                  # NEW: All operators comparison
│   └── client.tsx                # NEW: All operators comparison client
├── [operatorId]/                 # Per-operator (from each-operator-report.md)
└── loading.tsx                   # Existing loading
```

### 2. Data Service

Create a new service function (or extend the operator report service):

```TypeScript
// lib/services/operator-report.ts (extended)

export interface OperatorSummary {
  operatorId: string;
  operatorName: string;
  logoUrl: string | null;
  status: string;
  totalBuses: number;
  activeBuses: number;
  totalStaff: number;
  activeStaff: number;
  drivers: number;
  conductors: number;
  totalRoutes: number;
  activeRoutes: number;
  activeSchedules: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalBookings: number;
  totalRevenue: number;
  cashRevenue: number;
  bakongRevenue: number;
}

export async function fetchAllOperatorsSummary(supabase: SupabaseClient): Promise<OperatorSummary[]> {
  // 1. Fetch all operators
  // 2. For each operator, batch query their aggregates
  // 3. Return sorted array
}
```

**Performance Strategy:** Rather than calling `fetchOperatorReport()` N times (N queries per operator), use aggregated queries:

```SQL
-- Single pass for buses per operator:
SELECT operator_id, COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
  COUNT(*) FILTER (WHERE status = 'retired') as retired
FROM buses GROUP BY operator_id

-- Single pass for staff per operator:
SELECT operator_id, COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE role = 'driver') as drivers,
  COUNT(*) FILTER (WHERE role = 'conductor') as conductors
FROM users WHERE role IN ('driver', 'conductor') GROUP BY operator_id

-- Routes per operator:
SELECT operator_id, COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as active
FROM routes GROUP BY operator_id

-- Revenue per operator via chain:
-- payments → bookings → trips → schedules → routes → operators
-- This is the most expensive query. Can be done with a multi-join:
SELECT r.operator_id,
  COUNT(DISTINCT p.id) as payment_count,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0) as total_revenue,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND p.method = 'cash'), 0) as cash_revenue,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid' AND p.method = 'bakong'), 0) as bakong_revenue
FROM routes r
JOIN schedules s ON s.route_id = r.id
JOIN trips t ON t.schedule_id = s.id
JOIN bookings b ON b.trip_id = t.id
JOIN payments p ON p.booking_id = b.id
GROUP BY r.operator_id
```

### 3. Server Page (`operators/page.tsx`)

```TypeScript
// app/(dashboard)/super-admin/reports/operators/page.tsx
// Steps:
// 1. Authenticate as super_admin
// 2. Fetch all operators (basic info)
// 3. Fetch aggregated metrics per operator (using the grouped queries above)
// 4. Compute comparison data, rankings, totals
// 5. Render OperatorsComparisonClient
```

### 4. Client Component (`operators/client.tsx`)

The UI should include:

**Section A: Overview Stats Cards (Aggregated)**

* Total operators
* Total buses across all operators
* Total staff across all operators
* Total revenue across all operators (this month)
* Total bookings across all operators

**Section B: Operator Comparison Table**
Use `DataTable` with columns:

| Operator  | Buses | Staff | Routes | Schedules | Trips | Bookings | Revenue  |
| --------- | ----- | ----- | ------ | --------- | ----- | -------- | -------- |
| Greenline | 15/20 | 25/30 | 8/10   | 45        | 120   | 850      | \$12,450 |
| CityBus   | 10/12 | 18/20 | 5/6    | 30        | 85    | 620      | \$8,300  |

* Each metric shows active/total where applicable
* Sortable by any column
* Click on operator name → navigate to per-operator report `/super-admin/reports/[id]`
* Search/filter by operator name

**Section C: Comparison Charts**

* **Bar Chart:** Top 10 operators by revenue
* **Bar Chart:** Top 10 operators by booking count
* **Bar Chart:** Top 10 operators by active fleet size

**Section D: Rankings**

* Rank operators by revenue
* Rank operators by booking volume
* Rank operators by active bus count

**Section E: Download PDF**

* Export the entire comparison report as PDF

## Proposed UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Reports → Operators Comparison                              │
│  All Operators Performance Overview                          │
│                                           [Download PDF]     │
├─────────────────────────────────────────────────────────────┤
│  [Total Operators: 12]  [Total Buses: 156]  [Total Staff]   │
│  [Total Revenue]  [Total Bookings]  [Active Operators]      │
├─────────────────────────────────────────────────────────────┤
│  Operator Comparison Table                                   │
│  ┌─────────┬───────┬───────┬──────┬──────┬──────┬──────────┐│
│  │Operator │ Buses │ Staff │Routes│Trips │Bkngs │ Revenue  ││
│  ├─────────┼───────┼───────┼──────┼──────┼──────┼──────────┤│
│  │Greenline│ 15/20 │ 25/30 │ 8/10 │ 120  │ 850  │ $12,450  ││
│  │CityBus  │ 10/12 │ 18/20 │ 5/6  │ 85   │ 620  │ $8,300   ││
│  │...      │       │       │      │      │      │          ││
│  └─────────┴───────┴───────┴──────┴──────┴──────┴──────────┘│
├───────────────────┬───────────────────┬─────────────────────┤
│  Revenue by       │  Bookings by      │  Fleet Size by      │
│  Operator (Bar)   │  Operator (Bar)   │  Operator (Bar)     │
├───────────────────┴───────────────────┴─────────────────────┤
│  Rankings                                                    │
│  ┌─────────────┬────────┐  ┌─────────────┬────────┐        │
│  │ Revenue     │ Amount │  │ Bookings    │ Count  │        │
│  ├─────────────┼────────┤  ├─────────────┼────────┤        │
│  │ 1. Greenline│ $12.4K │  │ 1. Greenline│ 850    │        │
│  │ 2. CityBus  │ $8.3K  │  │ 2. CityBus  │ 620    │        │
│  │ 3. ...      │ ...    │  │ 3. ...      │ ...    │        │
│  └─────────────┴────────┘  └─────────────┴────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Refactoring Steps

### Phase 1: Create Data Aggregation Service

1. Extend `lib/services/operator-report.ts` with `fetchAllOperatorsSummary()` function
2. Use efficient GROUP BY queries (not N individual queries)
3. Return `OperatorSummary[]` interface

**Alternative approach** (simpler, for initial implementation):

If the GROUP BY joins become too complex, you can:

1. Fetch all operators (lightweight)
2. Parallel-fetch each operator's summary using the already-extracted `fetchOperatorReport()`
3. Map to `OperatorSummary` format

This is slower but DRYer. Use the GROUP BY approach for production.

### Phase 2: Build Comparison Page

1. Create `app/(dashboard)/super-admin/reports/operators/page.tsx`
   * Auth check (super\_admin only)
   * Fetch operator summaries
   * Compute aggregates
   * Pass to client

2. Create `app/(dashboard)/super-admin/reports/operators/client.tsx`
   * Stats cards (aggregated)
   * Comparison table (DataTable)
   * Bar charts (Recharts)
   * Rankings
   * PDF export button

### Phase 3: Navigation & PDF

1. Add sidebar link in `constants.ts`:
   ```TypeScript
   { label: "Operators Report", href: "/super-admin/reports/operators", icon: "Building2" }
   ```
2. Add "View All Operators Report" button in the main reports page as a quick link
3. Create `generateAllOperatorsPdf()` in `pdf-export.ts` or extend existing function

### Phase 4: Link Between Reports

* From main `/super-admin/reports` → link to `/super-admin/reports/operators` ("View Operator Comparison")
* From `/super-admin/reports/operators` → each row links to `/super-admin/reports/[operatorId]`
* From `/super-admin/reports/[operatorId]` → back link to `/super-admin/reports/operators` and `/super-admin/reports`

## Data Requirements

| Metric                       | Query Strategy                                                                              | Complexity     |
| ---------------------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Basic operator info          | `operators` table                                                                           | O(1)           |
| Bus counts per operator      | `buses` GROUP BY `operator_id`                                                              | O(N) groups    |
| Staff counts per operator    | `users` GROUP BY `operator_id` (filtered to driver/conductor)                               | O(N) groups    |
| Route counts per operator    | `routes` GROUP BY `operator_id`                                                             | O(N) groups    |
| Schedule counts per operator | `schedules` JOIN `routes` GROUP BY `routes.operator_id`                                     | O(N) groups    |
| Trip counts per operator     | `trips` JOIN `schedules` → `routes` GROUP BY `routes.operator_id`                           | O(N) groups    |
| Booking counts per operator  | `bookings` JOIN `trips` → `schedules` → `routes` GROUP BY `routes.operator_id`              | O(N) groups    |
| Revenue per operator         | `payments` JOIN `bookings` → `trips` → `schedules` → `routes` GROUP BY `routes.operator_id` | Most expensive |

### Query Optimization Tips

1. Use a **single complex query** with multiple LEFT JOINs and GROUP BY rather than 7 separate queries
2. Add a **materialized view** in PostgreSQL if this page is heavily used (e.g., `mv_operator_daily_metrics`)
3. Use Supabase's `rpc()` to call a PostgreSQL function/query for the complex revenue chain
4. Consider adding **denormalized** `operator_id` to `trips` or `bookings` tables to simplify joins

## Enhancement Opportunities

### Time-Range Filtering

* Add date range picker (e.g., "This Month", "Last 30 Days", "Custom Range")
* Recalculate all metrics within the selected range

### Trend Comparison

* Show 14/30-day trend arrows for each operator (↑ revenue growing, ↓ revenue declining)
* Highlight operators with significant changes

### Export Options

* CSV export for the comparison table
* PDF export with all charts and tables embedded

### Threshold Alerts

* Highlight operators with:
  * Active bus % < 50%
  * No trips in last 7 days
  * Revenue decline > 20% MoM
  * High cancellation rates

### Pagination

* If there are 20+ operators, paginate the comparison table (DataTable already supports this)

## Files to Create/Modify

### New Files

| File                                                       | Purpose                                   |
| ---------------------------------------------------------- | ----------------------------------------- |
| `app/(dashboard)/super-admin/reports/operators/page.tsx`   | All-operators comparison server page      |
| `app/(dashboard)/super-admin/reports/operators/client.tsx` | All-operators comparison client component |
| (Extended) `lib/services/operator-report.ts`               | Add `fetchAllOperatorsSummary()`          |

### Modified Files

| File                                             | Change                                |
| ------------------------------------------------ | ------------------------------------- |
| `lib/utils/pdf-export.ts`                        | Add `generateAllOperatorsPdf()`       |
| `lib/utils/constants.ts`                         | Add nav item for operators comparison |
| `app/(dashboard)/super-admin/reports/page.tsx`   | Add link to operators comparison      |
| `app/(dashboard)/super-admin/reports/client.tsx` | (Optional) Add quick-link card        |

