"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ChartData {
  monthLabels: string[];
  userGrowthTrend: number[];
  operatorGrowthTrend: number[];
  dailyActiveUsers: number[];
  roleChartData: { name: string; value: number; color: string }[];
  dayLabels: string[];
}

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

export function DashboardChartsSection({
  chartData,
  kpiData,
}: {
  chartData: ChartData;
  kpiData: KpiData;
}) {
  const userGrowthData = chartData.monthLabels.map((l, i) => ({
    label: l,
    users: chartData.userGrowthTrend[i],
  }));
  const operatorGrowthData = chartData.monthLabels.map((l, i) => ({
    label: l,
    operators: chartData.operatorGrowthTrend[i],
  }));
  const dauData = chartData.dayLabels.map((l, i) => ({
    label: l,
    users: chartData.dailyActiveUsers[i],
  }));

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="lg:col-span-2 xl:col-span-2 border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0F172A]">User Growth</h3>
              <span className="text-xs text-[#64748B]">Last 12 months</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-white px-3 py-2 shadow-sm text-sm">
                        <p className="text-[#64748B]">{payload[0].payload.label}</p>
                        <p className="font-semibold text-[#0F172A]">{payload[0].value} users</p>
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#userGrowthGrad)" dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0F172A]">Operator Growth</h3>
              <span className="text-xs text-[#64748B]">Last 12 months</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operatorGrowthData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-white px-3 py-2 shadow-sm text-sm">
                        <p className="text-[#64748B]">{payload[0].payload.label}</p>
                        <p className="font-semibold text-[#0F172A]">{payload[0].value} operators</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="operators" radius={[4, 4, 0, 0]} fill="#8b5cf6" maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0F172A]">Daily Active Users</h3>
              <span className="text-xs text-[#64748B]">Last 14 days</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dauData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-white px-3 py-2 shadow-sm text-sm">
                        <p className="text-[#64748B]">{payload[0].payload.label}</p>
                        <p className="font-semibold text-[#0F172A]">{payload[0].value} users</p>
                      </div>
                    );
                  }} />
                  <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <h3 className="text-base font-semibold text-[#0F172A]">User Distribution</h3>
          </CardHeader>
          <CardContent>
            {chartData.roleChartData.length === 0 ? (
              <p className="text-sm text-[#64748B]">No data</p>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData.roleChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                        {chartData.roleChartData.map((_, i) => (
                          <Cell key={i} fill={chartData.roleChartData[i].color} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as { name: string; value: number; color: string };
                        const total = chartData.roleChartData.reduce((s, d) => s + d.value, 0);
                        return (
                          <div className="rounded-lg border bg-white px-3 py-2 shadow-sm text-sm">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-[#64748B]">{item.value} ({((item.value / total) * 100).toFixed(1)}%)</p>
                          </div>
                        );
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xl font-bold text-[#0F172A]">{kpiData.totalUsers}</p>
                  </div>
                </div>
                <div className="mt-4 w-full space-y-2">
                  {chartData.roleChartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[#64748B]">{item.name}</span>
                      </div>
                      <span className="font-medium text-[#0F172A]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
