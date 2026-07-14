# Each Operator Report (Per-Operator View for Super Admin)

## Current State

The existing operator report at `app/(dashboard)/operator/reports/page.tsx` is **only accessible to** **`operator_admin`** **role**. A logged-in operator\_admin sees their own operator's data, filtered by `operator_id` from their profile.

There is **no way** for a `super_admin` to view an individual operator's report. The super admin reports at `app/(dashboard)/super-admin/reports/` only show **system-wide aggregated** data.

## What's Missing

| Feature                                                                        | Status                                       |
| ------------------------------------------------------------------------------ | -------------------------------------------- |
| Super admin can browse a list of operators and view each one's detailed report | ❌ Missing                                    |
| Reusable data-fetching logic for operator metrics                              | ❌ Duplicated inline in operator report page  |
| PDF export for per-operator report from super admin view                       | ❌ Missing (but `generateOperatorPdf` exists) |
| Navigation link from operator list → operator report                           | ❌ Missing                                    |

## Existing Code That Can Be Reused

1. **Operator Reports Client** — `app/(dashboard)/operator/reports/client.tsx` — The UI component that renders stats cards, donut charts, bar charts, today's summary, etc.
2. **PDF Generator** — `lib/utils/pdf-export.ts` — `generateOperatorPdf()` function can be reused directly (it takes `OperatorReportData` interface)
3. **Operators List** — `app/(dashboard)/super-admin/operators/client.tsx` — Already has a data table with all operators; just needs a "View Report" action column.

## Proposed Architecture

### 1. Extract Data-Fetching Logic

Create a shared utility (e.g., `lib/services/operator-report.ts`) that contains a single function:

```TypeScript
// lib/services/operator-report.ts
export interface OperatorReportData {
  operatorName: string;
  operatorId: string;
  totalBuses: number;
  activeBuses: number;
  maintenanceBuses: number;
  retiredBuses: number;
  totalStaff: number;
  activeStaff: number;
  drivers: number;
  conductors: number;
  totalRoutes: number;
  activeRoutes: number;
  activeSchedules: number;
  tripScheduled: number;
  tripInProgress: number;
  tripCompleted: number;
  todayBookings: number;
  busChartData: { name: string; value: number; color: string }[];
  tripChartData: { name: string; value: number; color: string }[];
  staffChartData: { name: string; value: number; color: string }[];
  tripTrend: { label: string; value: number }[];
  bookingTrend: { label: string; value: number }[];
}

export async function fetchOperatorReport(supabase: SupabaseClient, operatorId: string): Promise<OperatorReportData> {
  // Move all data-fetching logic from operator/reports/page.tsx here
  // Accept supabase client + operatorId, return the computed data
}
```

**Why:** Both the operator report page AND the new super admin per-operator page need identical data. This avoids duplication.

### 2. New Route: `/super-admin/reports/[operatorId]`

```
app/(dashboard)/super-admin/reports/
├── page.tsx                      # Existing system-wide report
├── client.tsx                    # Existing system-wide client
├── operators/
│   └── page.tsx                  # NEW: All operators comparison (see all-operators-report.md)
├── [operatorId]/
│   ├── page.tsx                  # NEW: Server component, fetches data for one operator
│   └── client.tsx                # NEW: Client component (can reuse operator/reports/client.tsx mostly)
└── loading.tsx                   # Existing loading
```

### 3. Server Page (`[operatorId]/page.tsx`)

```TypeScript
// app/(dashboard)/super-admin/reports/[operatorId]/page.tsx
// Steps:
// 1. Authenticate as super_admin
// 2. Validate operatorId exists
// 3. Call fetchOperatorReport(supabase, operatorId)
// 4. Also fetch operator name/logo for header
// 5. Render PerOperatorReportClient component
```

### 4. Client Component (`[operatorId]/client.tsx`)

Two approaches:

* **Option A (Recommended):** Directly reuse `OperatorReportsClient` from `app/(dashboard)/operator/reports/client.tsx` by moving it to a shared location (e.g., `components/reports/operator-report-client.tsx`)
* **Option B:** Create a new client component for the super admin view that wraps/includes the operator client

**Recommendation: Option A** — Move the shared client to `components/reports/operator-report-client.tsx` and have both operator and super admin routes import it. This eliminates duplication entirely.

### 5. Add "View Report" Action in Operators List

In `app/(dashboard)/super-admin/operators/client.tsx`, add a new column action:

```TSX
// New action column entry:
{
  key: "report",
  header: "Report",
  render: (op) => (
    <Link href={`/super-admin/reports/${op.id}`}>
      <Button variant="ghost" size="sm">
        <BarChart3 className="h-4 w-4" />
        Report
      </Button>
    </Link>
  ),
}
```

### 6. Navigation & Discovery

* Add `/super-admin/reports/[operatorId]` to the super admin sidebar? Not needed — users navigate from the operators list.
* Potentially add a "View Report" button on each operator row.

## Data Requirements (per operator)

| Metric                    | Source Table                                               | Filter                                                  |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Operator name/logo        | `operators`                                                | `id = operatorId`                                       |
| Bus count/status          | `buses`                                                    | `operator_id = operatorId`                              |
| Staff count/role          | `users`                                                    | `operator_id = operatorId`, role IN (driver, conductor) |
| Routes count/status       | `routes`                                                   | `operator_id = operatorId`                              |
| Active schedules          | `schedules` → `routes`                                     | `routes.operator_id = operatorId`                       |
| Trips (today/last 14d)    | `trips` → `schedules` → `routes`                           | `routes.operator_id = operatorId`                       |
| Bookings (today/last 14d) | `bookings` → `trips` → `schedules` → `routes`              | `routes.operator_id = operatorId`                       |
| Revenue (per operator)    | `payments` → `bookings` → `trips` → `schedules` → `routes` | `routes.operator_id = operatorId`                       |

**Note on Revenue:** The current operator report does NOT include revenue data. This is a good addition — see enhancement section.

## Proposed UI Layout (Super Admin's Per-Operator View)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Reports  |  [Operator Logo]  [Operator Name]     │
│                    Per-Operator Report                       │
│                                           [Download PDF]     │
├─────────────────────────────────────────────────────────────┤
│  [Stats Cards Row: Buses, Routes, Schedules, Staff,         │
│   Trips Today, Bookings Today]                              │
├───────────────────┬───────────────────┬─────────────────────┤
│  Fleet Status     │  Today's Trips    │  Staff Breakdown     │
│  (Donut Chart)    │  (Donut Chart)    │  (Donut Chart)      │
├───────────────────┴───────────────────┴─────────────────────┤
│  Trips Trend (Last 14 Days)  │  Bookings Trend (Last 14)   │
│  (Bar Chart)                 │  (Bar Chart)                 │
├───────────────────┬─────────────────────────────────────────┤
│  Today's Summary  │  Quick Stats                             │
│  - Scheduled: X   │  Buses: X  Routes: X                    │
│  - In Progress: X │  Staff: X  Schedules: X                 │
│  - Completed: X   │                                         │
│  - Bookings: X    │                                         │
└───────────────────┴─────────────────────────────────────────┘
```

## Refactoring Steps

### Phase 1: Extract Shared Data Service

1. Create `lib/services/operator-report.ts`
2. Move all data-fetching + computation logic from `operator/reports/page.tsx` into `fetchOperatorReport()`
3. Update `operator/reports/page.tsx` to call the shared function
4. Create the `OperatorReportData` interface in the service (not in `pdf-export.ts` — the PDF type can import/use it)

### Phase 2: Extract Shared Client Component

1. Create `components/reports/operator-report-client.tsx`
2. Move the `OperatorReportsClient` component from `operator/reports/client.tsx` here
3. Update `operator/reports/client.tsx` to re-export from the shared location
4. Both operator-admin route and super-admin route import from the same source

### Phase 3: Build Super Admin Per-Operator Route

1. Create `app/(dashboard)/super-admin/reports/[operatorId]/page.tsx`
   * Auth check (super\_admin only)
   * Validate operator exists
   * Call `fetchOperatorReport()`
   * Render shared client component
2. Create `app/(dashboard)/super-admin/reports/[operatorId]/client.tsx` (thin wrapper if needed)

### Phase 4: Wire Up Navigation

1. Add "View Report" action column in `super-admin/operators/client.tsx`
2. Add back-link from per-operator report page to `/super-admin/reports` or `/super-admin/operators`
3. Update sidebar navigation if desired (add direct link to `/super-admin/reports/operators` for the all-operators comparison)

## Enhancement Opportunities

### Revenue Data Per Operator

The current operator report lacks revenue metrics. To add this:

```SQL
-- Chain: payments → bookings → trips → schedules → routes → operators
payments
  .eq("status", "paid")
  .in("booking_id", bookingsIds)
-- Where bookingsIds are filtered to this operator's trips
```

Add to `OperatorReportData`:

```TypeScript
totalRevenue: number;
cashRevenue: number;
bakongRevenue: number;
revenueByMethod: { name: string; value: number; color: string }[];
revenueTrend: { label: string; value: number }[];
```

### Extended PDF

The existing `generateOperatorPdf()` already covers most metrics. If revenue is added, update it too.

## Files to Create/Modify

### New Files

| File                                                          | Purpose                      |
| ------------------------------------------------------------- | ---------------------------- |
| `lib/services/operator-report.ts`                             | Shared data-fetching service |
| `components/reports/operator-report-client.tsx`               | Shared client component      |
| `app/(dashboard)/super-admin/reports/[operatorId]/page.tsx`   | Per-operator server page     |
| `app/(dashboard)/super-admin/reports/[operatorId]/client.tsx` | Per-operator client wrapper  |

### Modified Files

| File                                               | Change                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| `app/(dashboard)/operator/reports/page.tsx`        | Use shared `fetchOperatorReport()`                      |
| `app/(dashboard)/operator/reports/client.tsx`      | Re-export from shared component                         |
| `app/(dashboard)/super-admin/operators/client.tsx` | Add "View Report" column action                         |
| `lib/utils/pdf-export.ts`                          | (Optional) Update `OperatorReportData` if revenue added |
| `lib/utils/constants.ts`                           | (Optional) Add nav item if needed                       |

