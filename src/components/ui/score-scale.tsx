"use client";

import { cn } from "@/lib/utils";

export function ScoreScale({
  value,
  onChange,
  max = 10,
  allowNull = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  max?: number;
  allowNull?: boolean;
}) {
  const items = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {allowNull ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          title="Clear"
          className={cn(
            "h-7 w-7 rounded border border-border text-[10px] text-faint transition-colors hover:text-muted",
            value === null && "border-accent/50 text-accent",
          )}
        >
          —
        </button>
      ) : null}
      {items.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? (allowNull ? null : value) : n)}
          aria-pressed={value === n}
          aria-label={`${n}`}
          className={cn(
            "h-7 w-7 rounded border text-xs tabular transition-colors",
            value === n
              ? "border-accent bg-accent text-accent-fg font-semibold"
              : "border-border bg-surface-2 text-muted hover:border-muted/50 hover:text-text",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}