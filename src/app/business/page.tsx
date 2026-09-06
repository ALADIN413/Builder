import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/date";
import { addDays, subDays } from "date-fns";
import { BusinessMetricForm } from "@/components/business/business-metric-form";
import { BusinessCharts } from "@/components/business/business-charts";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Business" };

export default async function BusinessPage() {
  const today = new Date();
  const start = subDays(today, 29);
  const end = addDays(today, 1);

  const rows = await prisma.businessMetric.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
  });

  const todayKey = toDateKey(today);
  const todayRow = rows.find((r) => toDateKey(r.date) === todayKey);

  const month = today.getMonth() + 1;
  const monthYear = today.getFullYear();
  const monthRows = rows.filter((r) => r.date.getMonth() + 1 === month && r.date.getFullYear() === monthYear);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const summary = {
    peopleContacted: sum(monthRows.map((r) => r.peopleContacted)),
    conversations: sum(monthRows.map((r) => r.conversations)),
    problemsDiscovered: sum(monthRows.map((r) => r.problemsDiscovered)),
    demos: sum(monthRows.map((r) => r.demos)),
    trials: sum(monthRows.map((r) => r.trials)),
    payingCustomers: sum(monthRows.map((r) => r.payingCustomers)),
    revenue: sum(monthRows.map((r) => r.revenue)),
  };

  const chartData = rows.map((r) => ({
    key: r.id,
    date: r.date,
    peopleContacted: r.peopleContacted,
    conversations: r.conversations,
    problemsDiscovered: r.problemsDiscovered,
    demos: r.demos,
    trials: r.trials,
    payingCustomers: r.payingCustomers,
    revenue: r.revenue,
  }));

  const hasAnyData = rows.length > 0;

  return (
    <div className="fade-up flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">Business</h1>
        <p className="text-sm text-faint">Founder metrics, not a CRM. Talk to another customer.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {hasAnyData ? (
            <BusinessCharts data={chartData} />
          ) : (
            <Panel>
              <EmptyState
                title="No business metrics yet."
                hint="You're building—but have you talked to anyone? Log people contacted and conversations."
              />
            </Panel>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <SummaryStat label="People contacted" value={summary.peopleContacted} accent />
            <SummaryStat label="Conversations" value={summary.conversations} accent />
            <SummaryStat label="Problems found" value={summary.problemsDiscovered} />
            <SummaryStat label="Demos" value={summary.demos} />
            <SummaryStat label="Trials" value={summary.trials} />
            <SummaryStat label="Paying customers" value={summary.payingCustomers} good />
            <SummaryStat label="Revenue (month)" value={`$${summary.revenue.toFixed(0)}`} good />
          </div>
        </div>

        <div className="h-fit lg:sticky lg:top-6">
          <BusinessMetricForm
            initial={{
              revenue: todayRow?.revenue ?? 0,
              retention: todayRow?.retention ?? 0,
            }}
            initialMonth={{ y: today.getFullYear(), m: today.getMonth() + 1 }}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent = false,
  good = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  good?: boolean;
}) {
  const tone = good ? "text-good" : accent ? "text-accent" : "text-text";
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-0.5 font-mono text-lg font-semibold tabular ${tone}`}>
        {value}
      </p>
    </div>
  );
}