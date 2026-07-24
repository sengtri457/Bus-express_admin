"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatsCard } from "@/components/shared/stats-card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { BarChart } from "@/components/dashboard/bar-chart";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReportPeriodFilter } from "@/components/reports/report-period-filter";
import type { OperatorSummary } from "@/lib/services/operator-report";
import type { ReportPeriod } from "@/lib/services/report-period";

interface OperatorsComparisonClientProps {
  summaries: OperatorSummary[];
  period: ReportPeriod;
}

export function OperatorsComparisonClient({
  summaries,
  period,
}: OperatorsComparisonClientProps) {
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  // Aggregated totals across all operators
  const totalOperators = summaries.length;
  const totalBuses = summaries.reduce((s, op) => s + op.totalBuses, 0);
  const activeBuses = summaries.reduce((s, op) => s + op.activeBuses, 0);
  const totalStaff = summaries.reduce((s, op) => s + op.totalStaff, 0);
  const activeStaff = summaries.reduce((s, op) => s + op.activeStaff, 0);
  const totalRoutes = summaries.reduce((s, op) => s + op.totalRoutes, 0);
  const totalTrips = summaries.reduce((s, op) => s + op.totalTrips, 0);
  const totalBookings = summaries.reduce((s, op) => s + op.totalBookings, 0);
  const paidBookings = summaries.reduce((s, op) => s + op.paidBookings, 0);
  const totalRevenue = summaries.reduce((s, op) => s + op.totalRevenue, 0);

  // Chart data mapping
  const revenueChartData = summaries
    .map((op) => ({
      label: op.operatorName,
      value: Number(op.totalRevenue.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const bookingsChartData = summaries
    .map((op) => ({
      label: op.operatorName,
      value: op.totalBookings,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const fleetChartData = summaries
    .map((op) => ({
      label: op.operatorName,
      value: op.totalBuses,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Leaderboards / Rankings
  const topRevenue = [...summaries]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const topBookings = [...summaries]
    .sort((a, b) => b.totalBookings - a.totalBookings)
    .slice(0, 5);

  async function handleExport() {
    setExporting(true);
    try {
      const { exportAllOperatorsCsv } = await import("@/lib/utils/csv-export");
      exportAllOperatorsCsv(summaries, period);
    } finally {
      setExporting(false);
    }
  }

  const columns: Column<OperatorSummary>[] = [
    {
      key: "operatorName",
      header: "Operator",
      sortValue: (op) => op.operatorName,
      render: (op) => (
        <div className="flex items-center gap-3">
          {op.logoUrl ? (
            <Image
              src={op.logoUrl}
              alt={op.operatorName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-100"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
              {op.operatorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{op.operatorName}</p>
            <p className="text-[10px] text-gray-400">ID: {op.operatorId.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (op) => op.status,
      render: (op) => <StatusBadge status={op.status} />,
    },
    {
      key: "buses",
      header: "Buses",
      sortValue: (op) => op.activeBuses,
      render: (op) => (
        <span className="text-gray-700">
          <strong className="text-gray-900">{op.activeBuses}</strong>/{op.totalBuses}
        </span>
      ),
    },
    {
      key: "staff",
      header: "Staff",
      sortValue: (op) => op.activeStaff,
      render: (op) => (
        <span className="text-gray-700">
          <strong className="text-gray-900">{op.activeStaff}</strong>/{op.totalStaff}
        </span>
      ),
    },
    {
      key: "routes",
      header: "Routes",
      sortValue: (op) => op.totalRoutes,
      render: (op) => (
        <span className="text-gray-700">
          <strong className="text-gray-900">{op.activeRoutes}</strong>/{op.totalRoutes}
        </span>
      ),
    },
    {
      key: "activeSchedules",
      header: "Schedules",
      sortValue: (op) => op.activeSchedules,
      render: (op) => <span className="font-medium text-gray-900">{op.activeSchedules}</span>,
    },
    {
      key: "totalTrips",
      header: "Trips (Period)",
      sortValue: (op) => op.totalTrips,
      render: (op) => <span className="font-medium text-gray-900">{op.totalTrips}</span>,
    },
    {
      key: "totalBookings",
      header: "Bookings (Period)",
      sortValue: (op) => op.totalBookings,
      render: (op) => <span className="font-medium text-gray-900">{op.totalBookings}</span>,
    },
    {
      key: "completionRate",
      header: "Completion",
      sortValue: (op) => op.completionRate,
      render: (op) => (
        <span className="font-medium text-emerald-700">
          {op.completionRate}%
        </span>
      ),
    },
    {
      key: "cancellationRate",
      header: "Cancellation",
      sortValue: (op) => op.cancellationRate,
      render: (op) => (
        <span className="font-medium text-red-600">
          {op.cancellationRate}%
        </span>
      ),
    },
    {
      key: "totalRevenue",
      header: "Revenue (Period)",
      sortValue: (op) => op.totalRevenue,
      render: (op) => (
        <span className="font-semibold text-emerald-600">
          ${op.totalRevenue.toFixed(2)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (op) => (
        <Link href={`/super-admin/reports/${op.operatorId}?from=${period.startDate}&to=${period.endDate}`} className="no-print" onClick={(e) => e.stopPropagation()}>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer">
            <svg className="h-3.5 w-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            Report
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-1.5">
            <Link href="/super-admin/reports">Reports</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800">Operators Comparison</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Operators Comparison</h2>
          <p className="text-sm text-gray-500">Comparative analysis and ranking of all bus operators</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <ReportPeriodFilter period={period} />

      {/* Aggregate Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Operators"
          value={totalOperators}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatsCard
          title="Total Buses"
          value={`${activeBuses}/${totalBuses}`}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 0a2 2 0 00-2 2v6a2 2 0 002 2m8-8a2 2 0 012 2v6a2 2 0 01-2 2m0 0a2 2 0 11-4 0m4 0H8m8 0h2a2 2 0 002-2v-6a2 2 0 00-2-2H8m0 0H6a2 2 0 00-2 2v6a2 2 0 002 2m0 0a2 2 0 104 0" />
            </svg>
          }
        />
        <StatsCard
          title="Total Staff"
          value={`${activeStaff}/${totalStaff}`}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Routes"
          value={totalRoutes}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
        />
        <StatsCard
          title="Bookings (Period)"
          value={totalBookings}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Revenue (Period)"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={
            <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Trips (Period)" value={totalTrips} icon={<span className="font-bold">T</span>} />
        <StatsCard
          title="Completed Trips"
          value={summaries.reduce((sum, operator) => sum + operator.completedTrips, 0)}
          icon={<span className="font-bold text-emerald-600">✓</span>}
        />
        <StatsCard
          title="Cancelled Trips"
          value={summaries.reduce((sum, operator) => sum + operator.cancelledTrips, 0)}
          icon={<span className="font-bold text-red-600">×</span>}
        />
        <StatsCard
          title="Average Ticket"
          value={`$${(paidBookings > 0 ? totalRevenue / paidBookings : 0).toFixed(2)}`}
          icon={<span className="font-bold text-violet-600">$</span>}
        />
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Operator Comparison Table</h3>
            <p className="text-xs text-gray-500">Period metrics use {period.label}; fleet, staff, routes, and schedules are current</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={summaries}
            keyExtractor={(op) => op.operatorId}
            searchKey="operatorName"
            searchPlaceholder="Search operator..."
            emptyTitle="No operator data found"
            pageSize={10}
            onRowClick={(op) => router.push(`/super-admin/reports/${op.operatorId}?from=${period.startDate}&to=${period.endDate}`)}
          />
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Top Operators by Revenue ({period.label})</h3>
          </CardHeader>
          <CardContent>
            <BarChart data={revenueChartData} title="Revenue" color="#10b981" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Top Operators by Bookings ({period.label})</h3>
          </CardHeader>
          <CardContent>
            <BarChart data={bookingsChartData} title="Bookings" color="#3b82f6" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Top Operators by Fleet Size</h3>
          </CardHeader>
          <CardContent>
            <BarChart data={fleetChartData} title="Fleet Size" color="#8b5cf6" />
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards / Rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Rankings</h3>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-gray-100">
              {topRevenue.map((op, idx) => (
                <div key={op.operatorId} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-gray-900">{op.operatorName}</span>
                  </div>
                  <span className="font-bold text-sm text-emerald-600">${op.totalRevenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Booking Rankings</h3>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-gray-100">
              {topBookings.map((op, idx) => (
                <div key={op.operatorId} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-gray-900">{op.operatorName}</span>
                  </div>
                  <span className="font-bold text-sm text-blue-600">{op.totalBookings} bookings</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
