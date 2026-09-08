"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function TabBar({
  period,
  weekKey,
  month,
  view,
}: {
  period: "weekly" | "monthly";
  weekKey: string;
  month: string;
  view?: string;
}) {
  const v = view ? `&view=${view}` : "";
  return (
    <div className="flex rounded-md border border-border bg-surface p-0.5">
      <Link
        href={weekKey ? `/reviews?period=weekly&week=${weekKey}${v}` : `/reviews?period=weekly${v}`}
        className={cn(
          "rounded px-3 py-1.5 text-xs font-medium transition-colors",
          period === "weekly"
            ? "bg-surface-3 text-text"
            : "text-muted hover:text-text",
        )}
      >
        Weekly
      </Link>
      <Link
        href={month ? `/reviews?period=monthly&month=${month}${v}` : `/reviews?period=monthly${v}`}
        className={cn(
          "rounded px-3 py-1.5 text-xs font-medium transition-colors",
          period === "monthly"
            ? "bg-surface-3 text-text"
            : "text-muted hover:text-text",
        )}
      >
        Monthly
      </Link>
    </div>
  );
}