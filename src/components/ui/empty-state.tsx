import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {icon ? <div className="mb-1 text-faint">{icon}</div> : null}
      <p className="text-sm font-medium text-muted">{title}</p>
      {hint ? (
        <p className="max-w-sm text-xs leading-relaxed text-faint">{hint}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}