"use client";

import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { RevenueDay, OrderStatusCount } from "@/lib/bakery/admin/dashboard";
import { ORDER_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { formatMoney } from "@/lib/utils/format";

const revenueConfig = {
  revenue: { label: "Doanh thu", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RevenueChart({ data }: { data: RevenueDay[] }) {
  const points = data.map((d) => ({
    day: d.day.slice(5), // MM-DD
    revenue: d.revenue,
  }));

  return (
    <ChartContainer config={revenueConfig} className="h-64 w-full">
      <AreaChart data={points} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => formatMoney(Number(value))} />}
        />
        <Area
          dataKey="revenue"
          type="monotone"
          fill="var(--color-revenue)"
          fillOpacity={0.2}
          stroke="var(--color-revenue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const STATUS_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "#a1a1aa"];

export function OrderStatusChart({ data }: { data: OrderStatusCount[] }) {
  const config = Object.fromEntries(
    data.map((d, i) => [d.status, { label: ORDER_STATUS_LABELS[d.status] ?? d.status, color: STATUS_COLORS[i % STATUS_COLORS.length] }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto h-64 aspect-square">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={50} strokeWidth={4}>
          {data.map((entry, i) => (
            <Cell key={entry.status} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="status" />} />
      </PieChart>
    </ChartContainer>
  );
}
