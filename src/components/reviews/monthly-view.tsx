"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, LoaderCircle } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { computeMonthlyReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { ChartTip } from "@/components/ui/chart-tip";
import type { MonthAggregate } from "@/lib/aggregations";

const AXIS = { fontSize: 10, fill: "#5b6a7a" } as const;
const GRID = { stroke: "#1b222c" } as const;

export function MonthlyView({
  month,
  agg,
  history,
}: {
  month: string;
  agg: MonthAggregate | null;
  history: {
    month: string;
    avgFounderScore: number;
    deepWorkMinutes: number;
    revenue: number;
    customers: number;
  }[];
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function recompute() {
    setRefreshing(true);
    setError(null);
    startTransition(async () => {
      const res = await computeMonthlyReview(month);
      if (!res.ok) setError(res.error ?? "Failed to compute");
      setRefreshing(false);
      router.refresh();
    });
  }

  const hasAgg = agg !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-faint">
          Aggregated from daily logs, sessions, business metrics, and distractions.
        </p>
        <Button variant="secondary" size="sm" onClick={recompute} disabled={refreshing}>
          {refreshing ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Recompute
        </Button>
      </div>
      {error ? <p className="text-xs text-bad">{error}</p> : null}

      {!hasAgg ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-xs text-faint">
          No aggregated data for this month yet. Run “Recompute” to build the numbers.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Deep work" value={`${agg.deepWorkMinutes}m`} />
            <Stat label="Output score" value={fmt(agg.outputScore)} />
            <Stat label="Technical capability" value={fmt(agg.technicalCapability)} />
            <Stat label="Avg founder score" value={`${fmt(agg.avgFounderScore)}/50`} accent />
            <Stat label="Projects" value={String(agg.projectsCount)} />
            <Stat label="Users" value={String(agg.users)} />
            <Stat label="Customers" value={String(agg.customers)} good />
            <Stat label="Revenue" value={`$ ${agg.revenue.toFixed(0)}`} good />
            <Stat label="Customer conversations" value={String(agg.customerConversations)} />
            <Stat label="Distraction" value={`${agg.distractionMinutes}m`} bad />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Founder Score & Deep Work" subtitle="Last 6 months">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={history} margin={{ top: 5, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid {...GRID} vertical={false} />
                  <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="avgFounderScore"
                    name="Score (/50)"
                    stroke="#e8a33d"
                    fill="#e8a33d"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="deepWorkMinutes"
                    name="Deep work (min)"
                    stroke="#4a9eda"
                    fill="#4a9eda"
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue & Customers" subtitle="Last 6 months">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={history} margin={{ top: 5, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid {...GRID} vertical={false} />
                  <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#e8a33d" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="customers" name="Customers" fill="#3aa878" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
  good = false,
  bad = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  good?: boolean;
  bad?: boolean;
}) {
  const tone = good ? "text-good" : bad ? "text-bad" : accent ? "text-accent" : "text-text";
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-0.5 font-mono text-lg font-semibold tabular ${tone}`}>{value}</p>
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
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{title}</h3>
      <p className="mb-3 text-xs text-faint">{subtitle}</p>
      {children}
    </div>
  );
}

function fmt(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}