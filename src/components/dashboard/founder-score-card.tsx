import type { FounderScoreResult } from "@/lib/scoring";
import { SCORE_LABELS } from "@/lib/scoring";
import { cn } from "@/lib/utils";

function ScoreRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-xs tabular text-text">
        {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}/10
      </span>
    </div>
  );
}

export function FounderScoreCard({
  score,
  className,
}: {
  score: FounderScoreResult;
  className?: string;
}) {
  const entries: [keyof typeof SCORE_LABELS, number][] = [
    ["deepWork", score.deepWork],
    ["technical", score.technical],
    ["output", score.output],
    ["business", score.business],
    ["discipline", score.discipline],
  ];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="border-b border-line pb-2">
        {entries.map(([key, value]) => (
          <ScoreRow key={key} label={SCORE_LABELS[key]} value={value} />
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Total
        </span>
        <span className="font-mono text-sm font-semibold tabular text-text">
          {score.total % 1 === 0 ? score.total.toFixed(0) : score.total.toFixed(1)}
          <span className="text-faint">/50</span>
        </span>
      </div>
    </div>
  );
}