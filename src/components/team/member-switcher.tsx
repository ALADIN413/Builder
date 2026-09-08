"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SwitcherMember = {
  id: string;
  name: string;
  emoji: string;
  isHead: boolean;
};

export function MemberSwitcher(props: {
  members: SwitcherMember[];
  currentUserId: string;
}) {
  return (
    <Suspense fallback={<span className="h-8 w-8 rounded-md border border-border bg-surface" />}>
      <Switcher {...props} />
    </Suspense>
  );
}

function Switcher({
  members,
  currentUserId,
}: {
  members: SwitcherMember[];
  currentUserId: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (members.length < 2) return null;

  const view = search.get("view");
  const activeId = view && view !== currentUserId ? view : currentUserId;
  const active = members.find((m) => m.id === activeId) ?? members[0];

  function choose(id: string) {
    setOpen(false);
    const params = new URLSearchParams(search.toString());
    if (id === currentUserId) {
      params.delete("view");
    } else {
      params.set("view", id);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 text-sm transition-colors hover:bg-surface-2"
      >
        <span aria-hidden>{active.emoji}</span>
        <span className="hidden max-w-28 truncate sm:inline">{active.name}</span>
        {active.isHead ? (
          <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="team head" />
        ) : null}
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted" />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-md border border-border bg-bg shadow-xl"
        >
          <p className="border-b border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
            Viewing dashboard
          </p>
          <ul className="max-h-64 overflow-y-auto py-1">
            {members.map((m) => {
              const isActive = m.id === activeId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => choose(m.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                      isActive
                        ? "bg-surface-2 text-text"
                        : "text-muted hover:bg-surface hover:text-text",
                    )}
                  >
                    <span aria-hidden>{m.emoji}</span>
                    <span className="flex-1 truncate">{m.name}</span>
                    {m.isHead ? (
                      <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="team head" />
                    ) : null}
                    {isActive ? (
                      <Check className="h-4 w-4 text-accent" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}