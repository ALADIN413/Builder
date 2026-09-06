"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Pause,
  Play,
  Square,
  Trash2,
  LoaderCircle,
  Link as LinkIcon,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { FOCUS_PRESETS, EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS } from "@/lib/constants";
import type { EvidenceType } from "@/lib/constants";
import { formatClock, toDateKey } from "@/lib/date";
import { createFocusSession } from "@/actions/focus";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ScoreScale } from "@/components/ui/score-scale";

const STORAGE_KEY = "founder-os:focus-session";
type Phase = "config" | "running" | "paused" | "completed";

type Persisted = {
  phase: Phase;
  objective: string;
  durationMinutes: number;
  startedAt: number;
  pausedAt: number | null;
  pausedTotal: number;
};

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (typeof parsed.startedAt !== "number" || typeof parsed.durationMinutes !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function FocusTimer() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("config");
  const [objective, setObjective] = useState("");
  const [preset, setPreset] = useState<number | "custom">(90);
  const [customMinutes, setCustomMinutes] = useState("120");
  const [startedAt, setStartedAt] = useState<number>(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedTotal, setPausedTotal] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const savedRef = useRef(false);

  // completion form state
  const [accomplishment, setAccomplishment] = useState("");
  const [output, setOutput] = useState("");
  const [blocker, setBlocker] = useState("");
  const [focusScore, setFocusScore] = useState<number | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("LIVE_PRODUCT");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const durationMinutes = preset === "custom" ? Math.max(1, Number(customMinutes) || 1) : preset;

  const persist = useCallback(
    (p: Persisted) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      } catch {
        /* storage unavailable */
      }
    },
    [],
  );

  function requestNotificationPermission() {
    if (typeof Notification === "undefined" || Notification.permission === "granted") {
      return;
    }
    void Notification.requestPermission();
  }

  const notifyCompletion = useCallback(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }
    try {
      new Notification("Focus session complete", {
        body: "Record what you actually produced.",
      });
    } catch {
      /* ignore */
    }
  }, []);

  const finishSession = useCallback(() => {
    setPhase("completed");
    notifyCompletion();
  }, [notifyCompletion]);

  const finishRef = useRef(finishSession);
  finishRef.current = finishSession;

  /* Restore persisted session on mount */
  useEffect(() => {
    const persisted = loadPersisted();
    if (!persisted || persisted.phase === "completed") return;
    const t = setTimeout(() => {
      setObjective(persisted.objective);
      setPreset(persisted.durationMinutes);
      setStartedAt(persisted.startedAt);
      setPausedAt(persisted.pausedAt);
      setPausedTotal(persisted.pausedTotal);
      const now = Date.now();
      const activeMs =
        (persisted.pausedAt ? persisted.pausedAt : now) -
        persisted.startedAt -
        persisted.pausedTotal;
      const durationMs = persisted.durationMinutes * 60_000;
      if (activeMs >= durationMs) {
        // Timer already expired while away — go straight to completion
        setElapsedMs(durationMs);
        setPhase("completed");
        notifyCompletion();
      } else {
        setElapsedMs(activeMs);
        setPhase(persisted.phase === "paused" ? "paused" : "running");
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Tick while running: update elapsed every second and finish when time is up */
  useEffect(() => {
    if (phase !== "running" || !startedAt) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt - pausedTotal;
      const durationMs = durationMinutes * 60_000;
      if (elapsed >= durationMs) {
        setElapsedMs(durationMs);
        finishRef.current();
      } else {
        setElapsedMs(elapsed);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, startedAt, pausedTotal, durationMinutes]);

  function start() {
    if (!objective.trim()) return;
    setError(null);
    const now = Date.now();
    setStartedAt(now);
    setPausedAt(null);
    setPausedTotal(0);
    setElapsedMs(0);
    setPhase("running");
    persist({
      phase: "running",
      objective: objective.trim(),
      durationMinutes,
      startedAt: now,
      pausedAt: null,
      pausedTotal: 0,
    });
    requestNotificationPermission();
  }

  const pause = useCallback(() => {
    const now = Date.now();
    setPausedAt(now);
    setPhase("paused");
    const p = loadPersisted();
    if (p) persist({ ...p, phase: "paused", pausedAt: now });
  }, [persist]);

  const resume = useCallback(() => {
    const now = Date.now();
    const added = pausedAt ? now - pausedAt : 0;
    setPausedTotal((t) => t + added);
    setPausedAt(null);
    setPhase("running");
    const p = loadPersisted();
    if (p) {
      persist({ ...p, phase: "running", pausedAt: null, pausedTotal: p.pausedTotal + added });
    }
  }, [pausedAt, persist]);

  function endNow() {
    finishSession();
  }

  function discard() {
    localStorage.removeItem(STORAGE_KEY);
    resetForm();
    setPhase("config");
    router.refresh();
  }

  function resetForm() {
    setAccomplishment("");
    setOutput("");
    setBlocker("");
    setFocusScore(null);
    setEvidenceUrl("");
    setEvidenceType("LIVE_PRODUCT");
    setError(null);
    setPreset(90);
    setCustomMinutes("120");
    savedRef.current = false;
  }

  function saveSession() {
    if (savedRef.current) return;
    const finalMinutes = Math.max(1, Math.round(elapsedMs / 60_000));
    setError(null);
    startTransition(async () => {
      const res = await createFocusSession({
        date: toDateKey(new Date()),
        durationMinutes: finalMinutes,
        objective: objective.trim(),
        accomplishment,
        output,
        blocker,
        focusScore,
        evidenceUrl,
        evidenceType,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to save session");
        return;
      }
      savedRef.current = true;
      localStorage.removeItem(STORAGE_KEY);
      router.push("/");
      router.refresh();
    });
  }

  /* Keyboard controls */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (phase === "running" && e.code === "Space") {
        e.preventDefault();
        pause();
      } else if (phase === "paused" && e.code === "Space") {
        e.preventDefault();
        resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, pause, resume]);

  /* -------- Config phase -------- */
  if (phase === "config") {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 py-10">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-text">Deep Work Session</h2>
          <p className="mt-1 text-sm text-faint">
            One objective. No inputs, no distractions. Output only.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="focus-objective">Objective</Label>
            <Textarea
              id="focus-objective"
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What are you going to build, ship, or prove?"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start();
              }}
            />
          </div>

          <div>
            <Label>Duration</Label>
            <div className="flex flex-wrap gap-1.5">
              {FOCUS_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  aria-pressed={preset === p}
                  className={`rounded-md border px-3 py-1.5 font-mono text-sm tabular transition-colors ${
                    preset === p
                      ? "border-accent bg-accent text-accent-fg font-semibold"
                      : "border-border bg-surface-2 text-muted hover:border-muted/50 hover:text-text"
                  }`}
                >
                  {p}m
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPreset("custom")}
                aria-pressed={preset === "custom"}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  preset === "custom"
                    ? "border-accent bg-accent text-accent-fg font-semibold"
                    : "border-border bg-surface-2 text-muted hover:border-muted/50 hover:text-text"
                }`}
              >
                Custom
              </button>
              {preset === "custom" ? (
                <input
                  type="number"
                  min={1}
                  max={480}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  aria-label="Custom minutes"
                  className="h-8 w-20 rounded-md border border-border bg-surface-2 px-2 font-mono text-sm tabular text-text focus:border-accent focus:outline-none"
                />
              ) : null}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={start}
            disabled={!objective.trim()}
          >
            <Play className="h-4 w-4" />
            Start Session
          </Button>
          <p className="text-center text-[11px] text-faint">
            Space = pause/resume · {durationMinutes} minutes · Ctrl+Enter to start
          </p>
        </div>
      </div>
    );
  }

  /* -------- Running / Paused -------- */
  if (phase === "running" || phase === "paused") {
    const remainingMs = Math.max(0, durationMinutes * 60_000 - elapsedMs);
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-10 py-12 text-center">
        <p className="max-w-sm text-sm font-medium leading-snug text-text">
          {objective}
        </p>

        <div className="font-mono text-6xl font-bold tracking-tight text-text tabular md:text-7xl">
          {formatClock(Math.ceil(remainingMs / 1000))}
        </div>

        <div className="flex items-center gap-3">
          {phase === "running" ? (
            <Button variant="secondary" size="lg" onClick={pause}>
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={resume}>
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          <Button variant="danger" size="lg" onClick={endNow}>
            <Square className="h-4 w-4" />
            End Session
          </Button>
        </div>

        {phase === "paused" ? (
          <p className="text-xs uppercase tracking-widest text-faint">Paused</p>
        ) : null}
      </div>
    );
  }

  /* -------- Completion form -------- */
  const finalMinutes = Math.max(1, Math.round(elapsedMs / 60_000));

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="mb-6 flex flex-col gap-2 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-good" />
        <h2 className="text-lg font-semibold text-text">
          {finalMinutes >= durationMinutes ? "Session complete" : "Session ended"}
        </h2>
        <p className="font-mono text-sm text-faint tabular">
          {finalMinutes} min focused{objective ? ` · ${objective}` : ""}
        </p>
        <p className="text-xs text-faint">
          The timer running isn&apos;t output. Record what you actually produced.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="accomplish">What did you actually accomplish?</Label>
          <Textarea
            id="accomplish"
            rows={2}
            value={accomplishment}
            onChange={(e) => setAccomplishment(e.target.value)}
            placeholder="e.g. Built authentication flows"
          />
        </div>
        <div>
          <Label htmlFor="produced">What did you produce?</Label>
          <Textarea
            id="produced"
            rows={2}
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="e.g. Working login endpoint + tests"
          />
        </div>
        <div>
          <Label htmlFor="blocked">What blocked you?</Label>
          <Textarea
            id="blocked"
            rows={2}
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            placeholder="e.g. Unclear requirements, context switching"
          />
        </div>

        <div>
          <Label>Focus score</Label>
          <ScoreScale value={focusScore} onChange={setFocusScore} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="ev-url">Evidence URL (optional)</Label>
            <Input
              id="ev-url"
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <Label htmlFor="ev-type">Type</Label>
            <Select
              id="ev-type"
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
            >
              {EVIDENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVIDENCE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error ? <p className="text-xs text-bad">{error}</p> : null}

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={discard}>
            <Trash2 className="h-3.5 w-3.5" />
            Discard
          </Button>
          <Button variant="primary" onClick={saveSession} disabled={isPending}>
            {isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
            Save &amp; Finish
          </Button>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            resetForm();
            setPhase("config");
          }}
          className="mx-auto flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-muted"
        >
          <RotateCcw className="h-3 w-3" />
          Start a new session
        </button>
      </div>
    </div>
  );
}