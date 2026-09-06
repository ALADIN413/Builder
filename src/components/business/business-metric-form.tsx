"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { upsertBusinessMetric } from "@/actions/business";
import { toDateKey } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const FIELDS: { key: string; label: string; placeholder?: string }[] = [
  { key: "peopleContacted", label: "People contacted" },
  { key: "conversations", label: "Conversations" },
  { key: "problemsDiscovered", label: "Problems discovered" },
  { key: "demos", label: "Demos" },
  { key: "trials", label: "Trials" },
  { key: "payingCustomers", label: "Paying customers" },
];

type YearMonth = {
  y: number;
  m: number;
};

function monthDays(ym: YearMonth): string[] {
  const count = new Date(ym.y, ym.m, 0).getDate();
  return Array.from({ length: count }, (_, i) =>
    toDateKey(new Date(ym.y, ym.m - 1, i + 1)),
  );
}

export function BusinessMetricForm({
  initial,
  initialMonth,
}: {
  initial: {
    revenue: number;
    retention: number;
  };
  initialMonth: YearMonth;
}) {
  const router = useRouter();
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [strings, setStrings] = useState<Record<string, string>>({
    peopleContacted: "",
    conversations: "",
    problemsDiscovered: "",
    demos: "",
    trials: "",
    payingCustomers: "",
    revenue: String(initial.revenue ?? 0),
    retention: String((initial.retention ?? 0) * 100),
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const days = monthDays(initialMonth);

  function submit() {
    setError(null);
    const key = /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : toDateKey(new Date());
    const toNum = (v: string) => Math.max(0, Number(v) || 0);
    const payload = {
      date: key,
      peopleContacted: toNum(strings.peopleContacted),
      conversations: toNum(strings.conversations),
      problemsDiscovered: toNum(strings.problemsDiscovered),
      demos: toNum(strings.demos),
      trials: toNum(strings.trials),
      payingCustomers: toNum(strings.payingCustomers),
      revenue: toNum(strings.revenue),
      retention: Math.min(1, (+strings.retention || 0) / 100),
    };
    startTransition(async () => {
      const res = await upsertBusinessMetric(payload);
      if (!res.ok) {
        setError(res.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        Log Metrics
      </h3>
      <div className="mb-4 flex flex-col gap-1.5">
        <Label htmlFor="biz-date">Date</Label>
        <div className="flex gap-1.5">
          <select
            id="biz-date"
            value={dateKey}
            onChange={(e) => {
              setDateKey(e.target.value);
              setSaved(false);
            }}
            className="h-9 flex-1 rounded-md border border-border bg-surface-2 px-3 font-mono text-sm tabular text-text focus:border-accent focus:outline-none"
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label htmlFor={`biz-${f.key}`}>{f.label}</Label>
            <Input
              id={`biz-${f.key}`}
              type="number"
              min={0}
              value={strings[f.key]}
              onChange={(e) => {
                setStrings((s) => ({ ...s, [f.key]: e.target.value }));
                setSaved(false);
              }}
            />
          </div>
        ))}
        <div>
          <Label htmlFor="biz-rev">Revenue</Label>
          <Input
            id="biz-rev"
            type="number"
            min={0}
            step="0.01"
            value={strings.revenue}
            onChange={(e) => {
              setStrings((s) => ({ ...s, revenue: e.target.value }));
              setSaved(false);
            }}
          />
        </div>
        <div>
          <Label htmlFor="biz-ret">Retention (%)</Label>
          <Input
            id="biz-ret"
            type="number"
            min={0}
            max={100}
            value={strings.retention}
            onChange={(e) => {
              setStrings((s) => ({ ...s, retention: e.target.value }));
              setSaved(false);
            }}
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-xs text-bad">{error}</p> : null}
      {saved ? <p className="mt-3 text-xs text-good">Saved.</p> : null}
      <Button variant="primary" className="mt-4 w-full" onClick={submit} disabled={isPending}>
        {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Save for {dateKey}
      </Button>
      <p className="mt-2 text-center text-[11px] text-faint">
        Daily values. This is a metrics tracker, not a CRM.
      </p>
    </div>
  );
}