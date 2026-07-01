"use client";

import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface DataItem {
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-[#0F172A]">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="text-[#64748B]">{item.name}: <span className="font-medium text-[#0F172A]">{item.value}</span></span>
      </div>
    </div>
  );
}

function renderDot(props: any, data: DataItem[]) {
  const { cx, cy, index } = props;
  if (index === undefined || !data[index]) return null;
  return (
    <circle cx={cx} cy={cy} r={4} fill={data[index].color} stroke="white" strokeWidth={2} />
  );
}

function renderActiveDot(props: any, data: DataItem[]) {
  const { cx, cy, index } = props;
  if (index === undefined || !data[index]) return null;
  return (
    <circle cx={cx} cy={cy} r={6} fill={data[index].color} stroke="white" strokeWidth={2} />
  );
}

export function OperatorChartsSection({
  bookingStatusData,
  fleetStatusData,
  staffDistributionData,
  totalBookings,
  totalBuses,
  totalStaff,
  bookingsPending,
  bookingsConfirmed,
  bookingsBoarded,
  bookingsCancelled,
}: {
  bookingStatusData: DataItem[];
  fleetStatusData: DataItem[];
  staffDistributionData: DataItem[];
  totalBookings: number;
  totalBuses: number;
  totalStaff: number;
  bookingsPending: number;
  bookingsConfirmed: number;
  bookingsBoarded: number;
  bookingsCancelled: number;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">Bookings by Status</h3>
              <span className="text-xs text-[#64748B]">All booking records</span>
            </div>
          </CardHeader>
          <CardContent>
            {bookingStatusData.length === 0 ? (
              <p className="text-sm text-[#64748B]">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bookingStatusData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fill="url(#bookingGrad)"
                        dot={(props) => renderDot(props, bookingStatusData)}
                        activeDot={(props) => renderActiveDot(props, bookingStatusData)}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {bookingStatusData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[#64748B]">{item.name}</span>
                      <span className="font-semibold text-[#0F172A]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#0F172A]">Booking Summary</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold text-[#0F172A]">{totalBookings}</p>
              <p className="text-sm text-[#64748B]">Total bookings</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Pending", value: bookingsPending, color: "bg-amber-500" },
                { label: "Confirmed", value: bookingsConfirmed, color: "bg-blue-500" },
                { label: "Boarded", value: bookingsBoarded, color: "bg-green-500" },
                { label: "Cancelled", value: bookingsCancelled, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#64748B]">{item.label}</span>
                    <span className="font-medium text-[#0F172A]">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className={cn("h-1.5 rounded-full", item.color)} style={{ width: `${totalBookings > 0 ? (item.value / totalBookings) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">Fleet Status</h3>
              <span className="text-xs text-[#64748B]">Current distribution of buses</span>
            </div>
          </CardHeader>
          <CardContent>
            {fleetStatusData.length === 0 ? (
              <p className="text-sm text-[#64748B]">No buses in fleet</p>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={fleetStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                        {fleetStatusData.map((_, i) => (
                          <Cell key={i} fill={fleetStatusData[i].color} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const total = fleetStatusData.reduce((s, d) => s + d.value, 0);
                        return (
                          <div className="rounded-lg border bg-white px-3 py-2 shadow-sm text-sm">
                            <p className="font-medium">{payload[0].name}</p>
                            <p className="text-[#64748B]">{payload[0].value} ({((Number(payload[0].value) / total) * 100).toFixed(0)}%)</p>
                          </div>
                        );
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xl font-bold text-[#0F172A]">{totalBuses}</p>
                  </div>
                </div>
                <div className="mt-4 w-full space-y-2">
                  {fleetStatusData.map((item, i) => (
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

        <Card className="border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">Staff Distribution</h3>
              <span className="text-xs text-[#64748B]">Division between drivers and conductors</span>
            </div>
          </CardHeader>
          <CardContent>
            {staffDistributionData.length === 0 ? (
              <p className="text-sm text-[#64748B]">No staff assigned</p>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={staffDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                        {staffDistributionData.map((_, i) => (
                          <Cell key={i} fill={staffDistributionData[i].color} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const total = staffDistributionData.reduce((s, d) => s + d.value, 0);
                        return (
                          <div className="rounded-lg border bg-white px-3 py-2 shadow-sm text-sm">
                            <p className="font-medium">{payload[0].name}</p>
                            <p className="text-[#64748B]">{payload[0].value} ({((Number(payload[0].value) / total) * 100).toFixed(0)}%)</p>
                          </div>
                        );
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xl font-bold text-[#0F172A]">{totalStaff}</p>
                  </div>
                </div>
                <div className="mt-4 w-full space-y-2">
                  {staffDistributionData.map((item, i) => (
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
