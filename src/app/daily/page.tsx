import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { addDays, format } from "date-fns";
import { getDailyLog, getDistractionsForDay, getFocusSessionsForDay } from "@/lib/queries";
import { toDateKey, fromDateKey, formatLong } from "@/lib/date";
import { DISTRACTION_LABELS } from "@/lib/constants";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DailyLogForm } from "@/components/daily/daily-log-form";
import { DistractionLogger } from "@/components/distractions/distraction-logger";

export const metadata: Metadata = { title: "Daily Log" };

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dateKey = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : toDateKey(new Date());
  const date = fromDateKey(dateKey);
  const isToday = dateKey === toDateKey(new Date());

  const [dailyLog, sessions, distractions] = await Promise.all([
    getDailyLog(date),
    getFocusSessionsForDay(date),
    getDistractionsForDay(date),
  ]);

  const sessionMinutes = sessions.reduce((a, s) => a + s.durationMinutes, 0);

  const prevDay = toDateKey(addDays(date, -1));
  const nextDay = toDateKey(addDays(date, 1));

  const distractionTotal = distractions.reduce((a, d) => a + d.minutes, 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text">Daily Log</h1>
          {!isToday ? (
            <p className="text-sm text-faint">{formatLong(date)} — past day</p>
          ) : (
            <p className="text-sm text-faint">Record what actually happened today.</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/daily?date=${prevDay}`}>
            <Button variant="ghost" size="icon" aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="min-w-28 text-center font-mono text-sm tabular text-muted">
            {format(date, "MMM d")}
          </span>
          <Link href={`/daily?date=${nextDay}`}>
            <Button variant="ghost" size="icon" aria-label="Next day">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          {isToday ? null : (
            <Link href="/daily">
              <Button variant="secondary" size="sm" className="ml-2">
                Today
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DailyLogForm
            dateKey={dateKey}
            sessionMinutes={sessionMinutes}
            initial={{
              primaryObjective: dailyLog?.primaryObjective ?? "",
              whatWentWell: dailyLog?.whatWentWell ?? "",
              whatWentWrong: dailyLog?.whatWentWrong ?? "",
              whatIAmAvoiding: dailyLog?.whatIAmAvoiding ?? "",
              highestLeverageNextAction: dailyLog?.highestLeverageNextAction ?? "",
              technicalGrowth: dailyLog?.technicalGrowth ?? null,
              outputScore: dailyLog?.outputScore ?? null,
              businessScore: dailyLog?.businessScore ?? null,
              disciplineScore: dailyLog?.disciplineScore ?? null,
              focusScore: dailyLog?.focusScore ?? null,
            }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader
              title="Distractions"
              action={<DistractionLogger dateKey={dateKey} />}
            />
            {distractions.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {distractions.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2 text-sm"
                  >
                    <span className="text-text">{DISTRACTION_LABELS[d.category]}</span>
                    <span className="font-mono text-xs tabular text-bad">
                      {d.minutes} min
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                  <span className="text-[11px] uppercase tracking-wider text-faint">
                    Wasted Time
                  </span>
                  <span className="font-mono text-sm font-semibold tabular text-bad">
                    {distractionTotal} min
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<AlertTriangle className="h-5 w-5" />}
                title="No distractions logged."
                hint="If you wasted time today, log it. The system tells the truth."
              />
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Focus Sessions" />
            {sessions.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-md border border-line bg-surface-2 px-3 py-2 text-sm"
                  >
                    <p className="text-text">{s.objective}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-faint tabular">
                      {s.durationMinutes} min
                      {s.focusScore ? ` · focus ${s.focusScore}/10` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No focus sessions."
                hint="Run a deep work session to capture focused time."
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}