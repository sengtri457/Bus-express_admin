"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatsCard } from "@/components/shared/stats-card";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { BarChart } from "@/components/dashboard/bar-chart";


interface ReportsClientProps {
  totalRevenue: number;
  totalBookings: number;
  activeTrips: number;
  activeOperators: number;
  totalUsers: number;
  activePromotions: number;
  revenueByMethod: { name: string; value: number; color: string }[];
  bookingsByStatus: { name: string; value: number; color: string }[];
  tripsByStatus: { name: string; value: number; color: string }[];
  revenueTrend: { label: string; value: number }[];
  bookingsTrend: { label: string; value: number }[];
  usersByRole: { name: string; value: number; color: string }[];
  promoUsageCount: number;
}

export function ReportsClient({
  totalRevenue,
  totalBookings,
  activeTrips,
  activeOperators,
  totalUsers,
  activePromotions,
  revenueByMethod,
  bookingsByStatus,
  tripsByStatus,
  revenueTrend,
  bookingsTrend,
  usersByRole,
  promoUsageCount,
}: ReportsClientProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    const { exportSuperAdminCsv } = await import("@/lib/utils/csv-export");
    exportSuperAdminCsv({
      totalRevenue,
      totalBookings,
      activeTrips,
      activeOperators,
      totalUsers,
      activePromotions,
      revenueByMethod: revenueByMethod.map((r) => ({ name: r.name, value: r.value })),
      bookingsByStatus: bookingsByStatus.map((b) => ({ name: b.name, value: b.value })),
      tripsByStatus: tripsByStatus.map((t) => ({ name: t.name, value: t.value })),
      revenueTrend,
      bookingsTrend,
      usersByRole: usersByRole.map((u) => ({ name: u.name, value: u.value })),
      promoUsageCount,
    });
    setExporting(false);
  }

  return (
    <div className="space-y-6" id="report-content">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="text-sm text-gray-500">System-wide analytics and key metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/super-admin/reports/operators">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 shadow-sm cursor-pointer">
              <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Operators Comparison
            </button>
          </Link>
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Revenue (This Month)"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Bookings (This Month)"
          value={totalBookings}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Trips (Today)"
          value={activeTrips}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Operators"
          value={activeOperators}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Promos"
          value={activePromotions}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend (Last 14 Days)</h3>
          </CardHeader>
          <CardContent>
            <BarChart data={revenueTrend} title="Revenue" color="#10b981" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Booking Trend (Last 14 Days)</h3>
          </CardHeader>
          <CardContent>
            <BarChart data={bookingsTrend} title="Bookings" color="#3b82f6" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Revenue by Method</h3>
          </CardHeader>
          <CardContent>
            {revenueByMethod.length > 0 ? (
              <DonutChart data={revenueByMethod} title="Revenue by Method" />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No revenue data</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Bookings by Status</h3>
          </CardHeader>
          <CardContent>
            {bookingsByStatus.length > 0 ? (
              <DonutChart data={bookingsByStatus} title="Bookings by Status" />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No booking data</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Trips by Status</h3>
          </CardHeader>
          <CardContent>
            {tripsByStatus.length > 0 ? (
              <DonutChart data={tripsByStatus} title="Trips by Status" />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No trip data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Users by Role</h3>
          </CardHeader>
          <CardContent>
            <DonutChart data={usersByRole} title="Users by Role" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Promo Codes Used</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{promoUsageCount}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Active Promotions</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{activePromotions}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Revenue This Month</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
