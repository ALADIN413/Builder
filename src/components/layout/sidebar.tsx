"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

export function SidebarNav({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-surface-2 text-text font-medium"
                : "text-muted hover:bg-surface hover:text-text",
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-accent" : "text-faint")} />
            {item.label}
            {active ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-line px-4 md:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-md p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2 font-mono text-sm text-faint">
        <Command className="h-4 w-4" />
        <span className="hidden sm:inline text-xs uppercase tracking-[0.2em] text-muted">
          Founder OS
        </span>
      </div>
      <div className="ml-auto">
        <LiveDate />
      </div>
    </header>
  );
}

function LiveDate() {
  const now = new Date();
  const label = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <span className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs text-muted tabular">
      {label}
    </span>
  );
}

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-bg">
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Founder OS
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav onClose={onClose} />
        </div>
      </div>
    </div>
  );
}