"use client";

import { useState } from "react";
import { Header, MobileMenu, SidebarNav } from "./sidebar";

export function AppShellContent({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="hidden md:flex md:w-56 md:shrink-0 md:flex-col border-r border-line bg-surface/40">
        <div className="flex h-14 items-center border-b border-line px-4 font-mono text-xs uppercase tracking-[0.2em]">
          <span className="text-accent">FOUNDER</span>
          <span className="text-muted"> OS</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav onClose={() => {}} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}