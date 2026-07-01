"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DataItem {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataItem[];
  title: string;
  color?: string;
}

export function BarChart({ data, title, color = "#3b82f6" }: BarChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        No data
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
                  <p className="text-sm font-medium">{payload[0].payload.label}</p>
                  <p className="text-sm text-gray-500">{payload[0].value}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={color} maxBarSize={40} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
