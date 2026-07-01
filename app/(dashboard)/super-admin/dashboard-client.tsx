"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const DashboardChartsSection = dynamic(
  () => import("@/components/dashboard/dashboard-charts-section").then((mod) => mod.DashboardChartsSection),
  { ssr: false },
);

interface KpiData {
  totalUsers: number;
  activeUsers: number;
  totalOperators: number;
  activeTrips: number;
  totalRevenue: number;
  totalBookings: number;
  newUsersToday: number;
  newOperatorsThisWeek: number;
  completedTrips: number;
  cancelledTrips: number;
  bookingSuccessRate: number;
  conversionRate: number;
  activePassengers: number;
  passengers: number;
}

interface ChartData {
  monthLabels: string[];
  userGrowthTrend: number[];
  operatorGrowthTrend: number[];
  dailyActiveUsers: number[];
  roleChartData: { name: string; value: number; color: string }[];
  dayLabels: string[];
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string | null;
}

interface DashboardClientProps {
  kpiData: KpiData;
  chartData: ChartData;
  recentUsers: RecentUser[];
  adminName: string;
  adminEmail: string;
}

const roleBadgeVariant: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  super_admin: "danger",
  operator_admin: "info",
  driver: "success",
  conductor: "warning",
  passenger: "neutral",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  operator_admin: "Op. Admin",
  driver: "Driver",
  conductor: "Conductor",
  passenger: "Passenger",
};

const statusColor: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-300",
  suspended: "bg-red-400",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

export function DashboardClient({ kpiData, chartData, recentUsers, adminName }: DashboardClientProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Good Morning, {adminName}</h1>
        <p className="mt-1 text-sm text-[#64748B]">Platform overview and business intelligence</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#E5E7EB] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#64748B]">Total Users</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-3xl font-semibold text-[#0F172A]">{kpiData.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#64748B]">Active Users</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-3xl font-semibold text-[#0F172A]">{kpiData.activeUsers}</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#64748B]">Operators</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-3xl font-semibold text-[#0F172A]">{kpiData.totalOperators}</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#64748B]">Live Trips</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-3xl font-semibold text-[#0F172A]">{kpiData.activeTrips}</p>
          </CardContent>
        </Card>
      </div>

      <DashboardChartsSection chartData={chartData} kpiData={kpiData} />

      <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
          <Card className="border-[#E5E7EB] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm text-[#64748B]">New Users Today</p>
              </div>
              <p className="text-2xl font-semibold text-[#0F172A]">{kpiData.newUsersToday}</p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-sm text-[#64748B]">New Operators This Week</p>
              </div>
              <p className="text-2xl font-semibold text-[#0F172A]">{kpiData.newOperatorsThisWeek}</p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-[#64748B]">Active Trips</p>
              </div>
              <p className="text-2xl font-semibold text-[#0F172A]">{kpiData.activeTrips}</p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[#64748B]">Revenue</p>
              </div>
              <p className="text-2xl font-semibold text-[#0F172A]">${kpiData.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[#64748B]">Conversion Rate</p>
              </div>
              <p className="text-2xl font-semibold text-[#0F172A]">{kpiData.conversionRate}%</p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-[#64748B]">Booking Success</p>
              </div>
              <p className="text-2xl font-semibold text-[#0F172A]">{kpiData.bookingSuccessRate}%</p>
            </CardContent>
          </Card>
        </div>

      <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Add Operator", href: "/super-admin/operators", color: "bg-blue-600", hover: "hover:bg-blue-700", icon: "building" },
          { label: "Create Promotion", href: "/super-admin/promotions", color: "bg-purple-600", hover: "hover:bg-purple-700", icon: "gift" },
          { label: "Generate Report", href: "/super-admin/reports", color: "bg-emerald-600", hover: "hover:bg-emerald-700", icon: "chart" },
          { label: "Manage Users", href: "/super-admin/users", color: "bg-amber-600", hover: "hover:bg-amber-700", icon: "users" },
        ].map((item) => (
          <a key={item.label} href={item.href} className="group block">
            <Card className="border-[#E5E7EB] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
              <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3 h-full">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors", item.color, item.hover)}>
                  {item.icon === "building" && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  {item.icon === "gift" && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  )}
                  {item.icon === "chart" && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {item.icon === "users" && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-medium text-[#0F172A]">{item.label}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <Card className="border-[#E5E7EB] shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#0F172A]">Recent Users</h3>
            <a href="/super-admin/users" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all</a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#0F172A]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#64748B]">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={roleBadgeVariant[u.role] ?? "neutral"}>
                        {roleLabels[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", statusColor[u.status] ?? "bg-gray-300")} />
                        <span className="text-sm capitalize text-[#64748B]">{u.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#64748B]">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <h3 className="text-base font-semibold text-[#0F172A]">Total Bookings</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[#0F172A]">{kpiData.totalBookings}</p>
            <p className="mt-1 text-sm text-[#64748B]">This month</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <h3 className="text-base font-semibold text-[#0F172A]">Completed Trips</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[#0F172A]">{kpiData.completedTrips}</p>
            <p className="mt-1 text-sm text-[#64748B]">All time</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <h3 className="text-base font-semibold text-[#0F172A]">Cancelled Trips</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[#0F172A]">{kpiData.cancelledTrips}</p>
            <p className="mt-1 text-sm text-[#64748B]">All time</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <h3 className="text-base font-semibold text-[#0F172A]">Active Passengers</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[#0F172A]">{kpiData.activePassengers}</p>
            <p className="mt-1 text-sm text-[#64748B]">of {kpiData.passengers} total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
