"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, CalendarDays } from "lucide-react";
import { saveWeeklyReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import type { WeekAggregate } from "@/lib/aggregations";

const QUESTIONS: { key: string; label: string; placeholder: string }[] = [
  {
    key: "accomplished",
    label: "What did I accomplish?",
    placeholder: "Evidence of execution",
  },
  {
    key: "notAccomplished",
    label: "What didn't I accomplish?",
    placeholder: "The truth",
  },
  {
    key: "avoiding",
    label: "What am I avoiding?",
    placeholder: "The work you keep circling",
  },
  {
    key: "wastedTime",
    label: "Where did I waste time?",
    placeholder: "Distractions, busywork, procrastination",
  },
  {
    key: "mostLeverage",
    label: "What created the most leverage?",
    placeholder: "The move that changed the week",
  },
  {
    key: "stopDoing",
    label: "What should I stop doing?",
    placeholder: "Low-value habits to kill",
  },
  {
    key: "startDoing",
    label: "What should I start doing?",
    placeholder: "High-leverage habits to begin",
  },
  {
    key: "nextObjective",
    label: "What is next week's highest-leverage objective?",
    placeholder: "One objective for next week",
  },
];

export function WeeklyReviewForm({
  weekKey,
  agg,
  initial,
}: {
  weekKey: string;
  agg: unknown;
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await saveWeeklyReview({ weekStartDate: weekKey, ...answers });
      if (!res.ok) {
        setError(res.error ?? "Failed to save review");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <MetricsPanel agg={agg as WeekAggregate} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <Label htmlFor={`q-${q.key}`}>{q.label}</Label>
            <Textarea
              id={`q-${q.key}`}
              rows={2}
              value={answers[q.key] ?? ""}
              onChange={(e) => {
                setAnswers((a) => ({ ...a, [q.key]: e.target.value }));
                setSaved(false);
              }}
              placeholder={q.placeholder}
            />
          </div>
        ))}
      </div>
      {error ? <p className="text-xs text-bad">{error}</p> : null}
      {saved ? <p className="text-xs text-good">Review saved.</p> : null}
      <div>
        <Button variant="primary" onClick={submit} disabled={isPending}>
          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Save Weekly Review
        </Button>
      </div>
    </div>
  );
}

function MetricsPanel({ agg }: { agg: WeekAggregate }) {
  const rows: { label: string; value: string }[] = [
    { label: "Deep work sessions", value: String(agg.deepWorkSessions) },
    { label: "Deep work minutes", value: `${agg.deepWorkMinutes}m` },
    { label: "Average focus", value: formatNum(agg.avgFocus) },
    { label: "Projects progressed", value: String(agg.projectsProgressed) },
    { label: "Projects shipped", value: String(agg.projectsShipped) },
    { label: "People contacted", value: String(agg.peopleContacted) },
    { label: "Customer conversations", value: String(agg.customerConversations) },
    { label: "Paying customers", value: String(agg.payingCustomers) },
    { label: "Revenue", value: `$ ${agg.revenue.toFixed(0)}` },
    { label: "Distraction minutes", value: `${agg.distractionMinutes}m` },
    { label: "Avg founder score", value: formatNum(agg.avgFounderScore) },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        The week’s numbers (auto-calculated)
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2 border-b border-line py-1.5">
            <span className="text-xs text-faint">{r.label}</span>
            <span className="font-mono text-sm font-medium tabular text-text">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNum(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}