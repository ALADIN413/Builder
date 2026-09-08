"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Zap } from "lucide-react";
import { createProfile, selectProfile } from "@/actions/auth";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = [
  "👩🏽‍💻",
  "🧑‍💻",
  "👨‍💻",
  "👩‍💻",
  "🧑🏾‍💻",
  "🧑🔧",
  "🧑‍🎨",
  "🧑‍🏭",
  "👤",
];

export function LoginScreen({
  profiles,
}: {
  profiles: { id: string; name: string; emoji: string; isHead: boolean; team: { name: string } | null }[];
}) {
  const router = useRouter();
  const [pendingSelect, setPendingSelect] = useState<string | null>(null);
  const [pendingCreate, setPendingCreate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);

  function pick(id: string) {
    setPendingSelect(id);
    startTransition(async () => {
      const res = await selectProfile(id);
      setPendingSelect(null);
      if (res.ok) router.push("/");
      else setError(res.error ?? "Could not sign in.");
    });
  }

  function create() {
    setPendingCreate(true);
    startTransition(async () => {
      const res = await createProfile({ name, emoji });
      setPendingCreate(false);
      if (res.ok) router.push("/");
      else setError(res.error ?? "Could not create profile.");
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em]">
            <span className="text-accent">Founder</span>
            <span className="text-muted">OS</span>
          </div>
          <h1 className="text-2xl font-semibold text-text">Who are you?</h1>
          <p className="mt-1 text-sm text-muted">
            Pick your profile — everyone in your team shares one workspace.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface/40 p-4">
          {profiles.length > 0 ? (
            <>
              <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                Existing profiles
              </p>
              <ul className="space-y-1">
                {profiles.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => pick(p.id)}
                      className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-colors hover:border-border hover:bg-surface-2 disabled:opacity-60"
                    >
                      <span className="text-xl" aria-hidden>
                        {p.emoji}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-text">
                          {p.name}
                          {p.isHead ? (
                            <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="team head" />
                          ) : null}
                        </span>
                        {p.team ? (
                          <span className="block text-xs text-faint">{p.team.name}</span>
                        ) : null}
                      </span>
                      {pendingSelect === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted" />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <div className={cn("mt-4 border-t border-line", profiles.length === 0 && "mt-0 border-t-0")}>
            <p className="mb-2 mt-4 px-1 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
              {profiles.length === 0 ? "First profile" : "New member"}
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-faint focus:border-accent focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    aria-pressed={emoji === e}
                    className={cn(
                      "rounded-md border px-2 py-1 text-lg transition-colors",
                      emoji === e
                        ? "border-accent bg-accent/10"
                        : "border-border bg-bg hover:bg-surface-2",
                    )}
                  >
                    <span aria-hidden>{e}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!name.trim() || pendingCreate || isPending}
                onClick={create}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  name.trim() && !pendingCreate
                    ? "bg-accent text-accent-fg hover:bg-accent-strong"
                    : "cursor-not-allowed bg-surface-3 text-faint",
                )}
              >
                {pendingCreate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {profiles.length === 0 ? "Found my team" : "Join the team"}
                {profiles.length === 0 ? (
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider opacity-70">
                    · creates the team
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}