"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatsCard } from "@/components/shared/stats-card";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { BarChart } from "@/components/dashboard/bar-chart";
import { ReportPeriodFilter } from "@/components/reports/report-period-filter";
import type { ReportPeriod } from "@/lib/services/report-period";

interface OperatorReportsClientProps {
  operatorName: string;
  logoUrl: string | null;
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
  activeRoutes: number;
  activeSchedules: number;
  totalStaff: number;
  activeStaff: number;
  tripScheduled: number;
  tripInProgress: number;
  tripCompleted: number;
  todayBookings: number;
  drivers: number;
  conductors: number;
  busChartData: { name: string; value: number; color: string }[];
  tripChartData: { name: string; value: number; color: string }[];
  staffChartData: { name: string; value: number; color: string }[];
  tripTrend: { label: string; value: number }[];
  bookingTrend: { label: string; value: number }[];
  period: ReportPeriod;
  periodTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalBookings: number;
  paidBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  bookingSuccessRate: number;
  cancellationRate: number;
  averageTicketValue: number;
  revenuePerCompletedTrip: number;
  totalRevenue: number;
  cashRevenue: number;
  bakongRevenue: number;
  revenueByMethod: { name: string; value: number; color: string }[];
  revenueTrend: { label: string; value: number }[];

  // Navigation & Export
  backHref?: string;
  exportType?: "pdf" | "csv";
}

export function OperatorReportsClient({
  operatorName,
  logoUrl,
  totalBuses,
  activeBuses,
  totalRoutes,
  activeRoutes,
  activeSchedules,
  totalStaff,
  activeStaff,
  tripScheduled,
  tripInProgress,
  tripCompleted,
  todayBookings,
  drivers,
  conductors,
  busChartData,
  tripChartData,
  staffChartData,
  tripTrend,
  bookingTrend,
  period,
  periodTrips,
  completedTrips,
  cancelledTrips,
  totalBookings,
  paidBookings,
  confirmedBookings,
  cancelledBookings,
  bookingSuccessRate,
  cancellationRate,
  averageTicketValue,
  revenuePerCompletedTrip,
  totalRevenue,
  cashRevenue,
  bakongRevenue,
  revenueByMethod,
  revenueTrend,
  backHref,
  exportType = "pdf",
}: OperatorReportsClientProps) {
  const [exporting, setExporting] = useState(false);
  const todayTrips = tripScheduled + tripInProgress + tripCompleted;

  async function handleExport() {
    setExporting(true);
    const exportData = {
      period,
      operatorName,
      logoUrl,
      totalBuses,
      activeBuses,
      maintenanceBuses:
        busChartData.find((item) => item.name === "Maintenance")?.value ?? 0,
      retiredBuses:
        busChartData.find((item) => item.name === "Retired")?.value ?? 0,
      totalRoutes,
      activeRoutes,
      activeSchedules,
      totalStaff,
      activeStaff,
      tripScheduled,
      tripInProgress,
      tripCompleted,
      todayBookings,
      drivers,
      conductors,
      busChartData,
      tripChartData,
      staffChartData,
      tripTrend,
      bookingTrend,
      periodTrips,
      completedTrips,
      cancelledTrips,
      totalBookings,
      paidBookings,
      confirmedBookings,
      cancelledBookings,
      bookingSuccessRate,
      cancellationRate,
      averageTicketValue,
      revenuePerCompletedTrip,
      totalRevenue,
      cashRevenue,
      bakongRevenue,
      revenueByMethod,
      revenueTrend,
    };

    try {
      if (exportType === "csv") {
        const { exportOperatorCsv } = await import("@/lib/utils/csv-export");
        exportOperatorCsv(exportData);
      } else {
        const { generateOperatorPdf } = await import("@/lib/utils/pdf-export");
        await generateOperatorPdf(exportData);
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6" id="report-content">
      {backHref && (
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Operators
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={operatorName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-600 ring-2 ring-blue-50">
              {operatorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{operatorName} Reports</h2>
            <p className="text-sm text-gray-500">Operator analytics and performance</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {exporting ? "Exporting..." : exportType === "csv" ? "Export CSV" : "Download PDF"}
        </button>
      </div>

      <ReportPeriodFilter period={period} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <StatsCard
            title="Revenue (Period)"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        <StatsCard
          title="Active Buses"
          value={`${activeBuses}/${totalBuses}`}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 0a2 2 0 00-2 2v6a2 2 0 002 2m8-8a2 2 0 012 2v6a2 2 0 01-2 2m0 0a2 2 0 11-4 0m4 0H8m8 0h2a2 2 0 002-2v-6a2 2 0 00-2-2H8m0 0H6a2 2 0 00-2 2v6a2 2 0 002 2m0 0a2 2 0 104 0" />
            </svg>
          }
        />
        <StatsCard
          title="Active Routes"
          value={`${activeRoutes}/${totalRoutes}`}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
        />
        <StatsCard
          title="Active Schedules"
          value={activeSchedules}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Staff"
          value={`${activeStaff}/${totalStaff}`}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Today&apos;s Trips"
          value={todayTrips}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatsCard
          title="Today&apos;s Bookings"
          value={todayBookings}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatsCard title="Trips (Period)" value={periodTrips} icon={<span className="font-bold">T</span>} />
        <StatsCard title="Completed" value={completedTrips} icon={<span className="font-bold text-emerald-600">✓</span>} />
        <StatsCard title="Cancelled" value={cancelledTrips} icon={<span className="font-bold text-red-600">×</span>} />
        <StatsCard title="Bookings (Period)" value={totalBookings} icon={<span className="font-bold text-blue-600">B</span>} />
        <StatsCard title="Booking Success" value={`${bookingSuccessRate}%`} icon={<span className="font-bold text-blue-600">%</span>} />
        <StatsCard title="Avg. Ticket" value={`$${averageTicketValue.toFixed(2)}`} icon={<span className="font-bold text-violet-600">$</span>} />
        <StatsCard title="Revenue / Trip" value={`$${revenuePerCompletedTrip.toFixed(2)}`} icon={<span className="font-bold text-emerald-600">$</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Fleet Status</h3>
          </CardHeader>
          <CardContent>
            {busChartData.length > 0 ? (
              <DonutChart data={busChartData} title="Buses by Status" />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No buses</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Trips</h3>
          </CardHeader>
          <CardContent>
            {tripChartData.length > 0 ? (
              <DonutChart data={tripChartData} title="Trips Today" />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No trips today</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Staff Breakdown</h3>
          </CardHeader>
          <CardContent>
            {staffChartData.length > 0 ? (
              <DonutChart data={staffChartData} title="Staff by Role" />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No staff</p>
            )}
          </CardContent>
        </Card>
      </div>

      {revenueByMethod.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Revenue by Method</h3>
            </CardHeader>
            <CardContent>
              <DonutChart data={revenueByMethod} title="Revenue Method" />
            </CardContent>
          </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend ({period.label})</h3>
              </CardHeader>
              <CardContent>
                <BarChart data={revenueTrend} title="Revenue" color="#10b981" />
              </CardContent>
            </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Trips ({period.label})</h3>
          </CardHeader>
          <CardContent>
            <BarChart data={tripTrend} title="Trips Trend" color="#8b5cf6" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Bookings ({period.label})</h3>
          </CardHeader>
          <CardContent>
            <BarChart data={bookingTrend} title="Bookings Trend" color="#3b82f6" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Summary</h3>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Scheduled trips</span>
                <span className="font-semibold text-gray-900">{tripScheduled}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">In progress</span>
                <span className="font-semibold text-yellow-600">{tripInProgress}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{tripCompleted}</span>
              </div>
              <div className="mt-3 border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Today&apos;s bookings</span>
                  <span className="font-semibold text-blue-600">{todayBookings}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Buses</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalBuses}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Routes</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalRoutes}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Staff</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalStaff}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Schedules</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{activeSchedules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-right text-xs text-gray-400">
        Trip cancellation rate for this period: {cancellationRate}%
      </p>
    </div>
  );
}
