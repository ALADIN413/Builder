"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatShort } from "@/lib/date";
import { ChartTip } from "@/components/ui/chart-tip";

export type MetricPoint = {
  key: string;
  date: Date;
  peopleContacted: number;
  conversations: number;
  problemsDiscovered: number;
  demos: number;
  trials: number;
  payingCustomers: number;
  revenue: number;
};

const AXIS = { fontSize: 10, fill: "#5b6a7a" } as const;
const GRID = { stroke: "#1b222c" } as const;

export function BusinessCharts({ data }: { data: MetricPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatShort(d.date),
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartCard title="Revenue & Customers" subtitle="Monthly revenue vs paying customers">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid {...GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#e8a33d" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="payingCustomers" name="Customers" stroke="#3aa878" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Engagement" subtitle="People contacted, conversations, demos">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid {...GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v: number) => String(v)} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="peopleContacted" name="People contacted" stroke="#4a9eda" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="conversations" name="Conversations" stroke="#43a6c4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="demos" name="Demos" stroke="#e0564a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
      </h3>
      <p className="mb-3 text-xs text-faint">{subtitle}</p>
      {children}
    </div>
  );
}