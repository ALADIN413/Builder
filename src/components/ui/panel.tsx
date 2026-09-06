import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-surface p-4",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-faint">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}