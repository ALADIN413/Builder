import Link from "next/link";
import {
  Timer,
  FileOutput,
  Link2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { getDashboardData } from "@/lib/queries";
import { computeFounderScore } from "@/lib/scoring";
import { DEEP_WORK_TARGET_MINUTES, DISTRACTION_LABELS } from "@/lib/constants";
import { formatLong } from "@/lib/date";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryObjectiveEditor } from "@/components/dashboard/primary-objective-editor";
import { FounderScoreCard } from "@/components/dashboard/founder-score-card";
import { DistractionLogger } from "@/components/distractions/distraction-logger";
import { EvidenceList } from "@/components/evidence/evidence-list";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { dailyLog, sessions, deepWorkMinutes, distractions, evidence, dateKey } =
    data;

  const score = computeFounderScore({
    deepWorkMinutes,
    technical: dailyLog?.technicalGrowth,
    output: dailyLog?.outputScore,
    business: dailyLog?.businessScore,
    discipline: dailyLog?.disciplineScore,
  });

  const hasScores = dailyLog && (dailyLog.outputScore != null || dailyLog.disciplineScore != null);

  const distractionTotal = distractions.reduce((a, d) => a + d.minutes, 0);
  const today = new Date();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text">Today</h1>
          <p className="text-sm text-faint">{formatLong(today)}</p>
        </div>
        <DistractionLogger dateKey={dateKey} />
      </header>

      {/* Primary Objective */}
      <Panel className="border-accent/25">
        <PanelHeader title="Primary Objective" subtitle="One thing that moves everything else." />
        <PrimaryObjectiveEditor initial={dailyLog?.primaryObjective ?? ""} dateKey={dateKey} />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Deep Work */}
          <Panel>
            <PanelHeader
              title="Deep Work"
              subtitle="Undistracted time on the highest-leverage problem."
              action={
                <Link href="/focus">
                  <Button variant="primary" size="sm">
                    <Timer className="h-3.5 w-3.5" />
                    Start Deep Work
                  </Button>
                </Link>
              }
            />
            <div className="flex items-center gap-8">
              <Stat
                label="Target"
                value={`${DEEP_WORK_TARGET_MINUTES}m`}
                mono
              />
              <Stat
                label="Completed"
                value={`${deepWorkMinutes}m`}
                mono
                accent
              />
              <Stat
                label="Sessions"
                value={String(sessions.length)}
                mono
              />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] text-faint">
                <span>Progress</span>
                <span className="tabular">
                  {Math.min(100, Math.round((deepWorkMinutes / DEEP_WORK_TARGET_MINUTES) * 100))}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (deepWorkMinutes / DEEP_WORK_TARGET_MINUTES) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </Panel>

          {/* Today's Output */}
          <Panel>
            <PanelHeader title="Today's Output" subtitle="What you actually produced." />
            <OutputList sessions={sessions} dailyOutput={dailyLog?.whatWentWell ?? null} />
          </Panel>

          {/* Evidence */}
          <Panel>
            <PanelHeader
              title="Evidence"
              subtitle="Links that prove the work happened."
            />
            {evidence.length > 0 ? (
              <EvidenceList items={evidence} />
            ) : (
              <EmptyState
                icon={<Link2 className="h-5 w-5" />}
                title="No evidence yet."
                hint="Link something that proves the work happened."
              />
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          {/* Founder Score */}
          <Panel>
            <PanelHeader
              title="Founder Score"
              subtitle="Execution quality, not personal worth."
              action={
                hasScores ? null : (
                  <Link href="/daily">
                    <Button variant="ghost" size="sm">
                      Rate today <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )
              }
            />
            <FounderScoreCard score={score} />
          </Panel>

          {/* Distractions */}
          <Panel>
            <PanelHeader
              title="Distractions"
              subtitle="The truth about lost time."
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
                hint="Did you waste time today? Log it. No judgment—just the truth."
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-faint">{label}</span>
      <span
        className={`text-xl font-semibold ${
          mono ? "font-mono tabular" : ""
        } ${accent ? "text-accent" : "text-text"}`}
      >
        {value}
      </span>
    </div>
  );
}

function OutputList({
  sessions,
  dailyOutput,
}: {
  sessions: { id: string; objective: string; accomplishment: string | null; output: string | null; durationMinutes: number; focusScore: number | null }[];
  dailyOutput: string | null;
}) {
  const outputItems = sessions.filter((s) => s.accomplishment || s.output);
  const empty = outputItems.length === 0 && !dailyOutput;

  if (empty) {
    return (
      <EmptyState
        icon={<FileOutput className="h-5 w-5" />}
        title="You haven't recorded today's output."
        hint="Finish a focus session to record what you actually produced."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {outputItems.map((s) => (
        <li key={s.id} className="rounded-md border border-line bg-surface-2 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-good" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text">
                {s.accomplishment || s.output}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-faint">
                {s.objective}
              </p>
              <p className="mt-1 font-mono text-[10px] text-faint tabular">
                {s.durationMinutes} min{s.focusScore ? ` · focus ${s.focusScore}/10` : ""}
              </p>
            </div>
          </div>
        </li>
      ))}
      {dailyOutput ? (
        <li className="rounded-md border border-line bg-surface-2 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <p className="flex-1 text-sm text-text">{dailyOutput}</p>
          </div>
        </li>
      ) : null}
    </ul>
  );
}