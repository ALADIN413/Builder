import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "good" | "bad" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-surface-2 text-muted",
  accent: "border-accent/40 bg-accent/10 text-accent",
  good: "border-good/40 bg-good/10 text-good",
  bad: "border-bad/40 bg-bad/10 text-bad",
  info: "border-info/40 bg-info/10 text-info",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}