"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RoomStatus } from "@/lib/types";

interface DonutChartProps {
  data: { status: RoomStatus; count: number }[];
}

const STATUS_COLORS: Record<RoomStatus, string> = {
  Ready: "#22c55e",
  "In Progress": "#f97316",
  "Needs Attention": "#ef4444",
  Occupied: "#9ca3af",
};

export default function DonutChart({ data }: DonutChartProps) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ name: d.status, value: d.count, color: STATUS_COLORS[d.status] }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No room data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, name]}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: "12px", color: "#6b7280" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
