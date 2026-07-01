"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatsCard } from "@/components/shared/stats-card";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { BarChart } from "@/components/dashboard/bar-chart";


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
}

function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #report-content, #report-content * { visibility: visible; }
        #report-content { position: absolute; left: 0; top: 0; width: 100%; }
        aside, header { display: none !important; }
        button, .no-print { display: none !important; }
        @page { margin: 0.5in; size: landscape; }
      }
    `}</style>
  );
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
}: OperatorReportsClientProps) {
  const [exporting, setExporting] = useState(false);
  const todayTrips = tripScheduled + tripInProgress + tripCompleted;

  async function handleExport() {
    setExporting(true);
    const { generateOperatorPdf } = await import("@/lib/utils/pdf-export");
    await generateOperatorPdf({
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
      busChartData: busChartData.map((b) => ({ name: b.name, value: b.value })),
      staffChartData: staffChartData.map((s) => ({ name: s.name, value: s.value })),
      tripTrend,
      bookingTrend,
    });
    setExporting(false);
  }

  return (
    <div className="space-y-6" id="report-content">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt={operatorName} className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-600">
              {operatorName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{operatorName} Reports</h2>
            <p className="text-sm text-gray-500">Operator analytics and performance</p>
          </div>
        </div>
        <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {exporting ? "Exporting..." : "Download PDF"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Trips (Last 14 Days)</h3>
          </CardHeader>
          <CardContent>
            <BarChart data={tripTrend} title="Trips Trend" color="#8b5cf6" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Bookings (Last 14 Days)</h3>
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
    </div>
  );
}
