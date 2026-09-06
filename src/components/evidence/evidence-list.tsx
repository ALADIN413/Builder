import Link from "next/link";
import { ExternalLink, FileText, GitBranch, Image as ImageIcon, User, CreditCard, BarChart3, Package } from "lucide-react";
import type { EvidenceType } from "@/lib/constants";
import { EVIDENCE_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<EvidenceType, React.ComponentType<{ className?: string }>> = {
  GITHUB: GitBranch,
  LIVE_PRODUCT: Package,
  SCREENSHOT: ImageIcon,
  DOCUMENT: FileText,
  CUSTOMER: User,
  PAYMENT: CreditCard,
  METRIC: BarChart3,
  OTHER: FileText,
};

export function EvidenceList({
  items,
  className,
}: {
  items: {
    id: string;
    title: string;
    type: EvidenceType;
    url: string;
    description?: string | null;
  }[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {items.map((item) => {
        const Icon = ICONS[item.type];
        return (
          <li key={item.id}>
            <Link
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-md border border-line bg-surface-2 px-3 py-2 text-sm transition-colors hover:border-border hover:bg-surface-3"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-faint" />
              <span className="min-w-0 flex-1 truncate text-text">{item.title}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-faint">
                {EVIDENCE_TYPE_LABELS[item.type]}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}