"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DataItem[];
  title: string;
}

export function DonutChart({ data, title }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as DataItem;
                return (
                  <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.value} ({((item.value / total) * 100).toFixed(1)}%)</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-4">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.name} ({item.value})
          </div>
        ))}
      </div>
    </div>
  );
}
