"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, X } from "lucide-react";
import type { SwitcherMember } from "./member-switcher";

export function ViewingNotice(props: {
  members: SwitcherMember[];
  currentUserId: string;
}) {
  if (props.members.length < 2) return null;
  return (
    <Suspense fallback={null}>
      <Notice {...props} />
    </Suspense>
  );
}

function Notice({
  members,
  currentUserId,
}: {
  members: SwitcherMember[];
  currentUserId: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();

  const view = search.get("view");
  if (!view || view === currentUserId) return null;
  const member = members.find((m) => m.id === view);
  if (!member) return null;

  const rest = search
    .toString()
    .split("&")
    .filter((kv) => kv && !kv.startsWith("view="))
    .join("&");
  const backHref = rest ? `${pathname}?${rest}` : pathname;

  return (
    <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-600 md:px-6">
      <Eye className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">
        Viewing {member.name}&apos;s dashboard — changes are not saved.
      </span>
      <Link
        href={backHref || pathname}
        className="flex items-center gap-1 rounded-md px-2 py-0.5 font-medium text-amber-700 transition-colors hover:bg-amber-500/15"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
        Show mine
      </Link>
    </div>
  );
}