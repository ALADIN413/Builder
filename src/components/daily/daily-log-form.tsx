"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { upsertDailyLog } from "@/actions/daily";
import { computeFounderScore } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ScoreScale } from "@/components/ui/score-scale";
import { FounderScoreCard } from "@/components/dashboard/founder-score-card";

export function DailyLogForm({
  dateKey,
  initial,
  sessionMinutes,
  readOnly = false,
}: {
  dateKey: string;
  initial: {
    primaryObjective: string;
    whatWentWell: string;
    whatWentWrong: string;
    whatIAmAvoiding: string;
    highestLeverageNextAction: string;
    technicalGrowth: number | null;
    outputScore: number | null;
    businessScore: number | null;
    disciplineScore: number | null;
    focusScore: number | null;
  };
  sessionMinutes: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function submit() {
    setError(null);
    const payload = {
      date: dateKey,
      primaryObjective: form.primaryObjective,
      deepWorkMinutes: sessionMinutes,
      technicalGrowth: form.technicalGrowth,
      outputScore: form.outputScore,
      businessScore: form.businessScore,
      disciplineScore: form.disciplineScore,
      focusScore: form.focusScore,
      whatWentWell: form.whatWentWell,
      whatWentWrong: form.whatWentWrong,
      whatIAmAvoiding: form.whatIAmAvoiding,
      highestLeverageNextAction: form.highestLeverageNextAction,
    };
    startTransition(async () => {
      const res = await upsertDailyLog(payload);
      if (!res.ok) {
        setError(res.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  const score = computeFounderScore({
    deepWorkMinutes: sessionMinutes,
    technical: form.technicalGrowth,
    output: form.outputScore,
    business: form.businessScore,
    discipline: form.disciplineScore,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div>
            <Label htmlFor="dl-objective">Primary objective</Label>
            <Textarea
              id="dl-objective"
              rows={2}
              value={form.primaryObjective}
              onChange={(e) => set("primaryObjective", e.target.value)}
              placeholder="Today's single highest-leverage objective"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Technical growth">
              <ScoreScale
                value={form.technicalGrowth}
                onChange={(v) => set("technicalGrowth", v)}
                allowNull
              />
            </Field>
            <Field label="Output score">
              <ScoreScale
                value={form.outputScore}
                onChange={(v) => set("outputScore", v)}
                allowNull
              />
            </Field>
            <Field label="Business score">
              <ScoreScale
                value={form.businessScore}
                onChange={(v) => set("businessScore", v)}
                allowNull
              />
            </Field>
            <Field label="Discipline score">
              <ScoreScale
                value={form.disciplineScore}
                onChange={(v) => set("disciplineScore", v)}
                allowNull
              />
            </Field>
            <Field label="Focus score">
              <ScoreScale
                value={form.focusScore}
                onChange={(v) => set("focusScore", v)}
                allowNull
              />
            </Field>
            <Field label={`Deep work (auto · ${sessionMinutes} min today)`}>
              <p className="pt-1 text-sm text-faint">
                Captured from completed focus sessions.
              </p>
            </Field>
          </div>

          <Field label="What went well?">
            <Textarea
              rows={2}
              value={form.whatWentWell}
              onChange={(e) => set("whatWentWell", e.target.value)}
              placeholder="Evidence of execution"
            />
          </Field>
          <Field label="What went wrong?">
            <Textarea
              rows={2}
              value={form.whatWentWrong}
              onChange={(e) => set("whatWentWrong", e.target.value)}
              placeholder="The truth, unchained"
            />
          </Field>
          <Field label="What am I avoiding?">
            <Textarea
              rows={2}
              value={form.whatIAmAvoiding}
              onChange={(e) => set("whatIAmAvoiding", e.target.value)}
              placeholder="The task you keep circling"
            />
          </Field>
          <Field label="Highest-leverage next action">
            <Input
              value={form.highestLeverageNextAction}
              onChange={(e) => set("highestLeverageNextAction", e.target.value)}
              placeholder="Tomorrow's first move"
            />
          </Field>
        </div>

        <div className="h-fit rounded-lg border border-border bg-surface p-4 lg:sticky lg:top-6">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Founder Score Preview
          </h3>
          <p className="mb-3 text-[11px] text-faint">
            Deep work is scored from {sessionMinutes} min against a 120 min target.
          </p>
          <FounderScoreCard score={score} />
          {error ? <p className="mt-3 text-xs text-bad">{error}</p> : null}
          {saved ? (
            <p className="mt-3 text-xs text-good">Saved. That&apos;s the record.</p>
          ) : null}
          {!readOnly ? (
            <Button
              variant="primary"
              className="mt-4 w-full"
              onClick={submit}
              disabled={isPending}
            >
              {isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : null}
              Save Daily Log
            </Button>
          ) : (
            <p className="mt-4 text-xs text-faint">
              Read-only view — changes save to your own profile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="mb-0">{label}</Label>
      {children}
    </div>
  );
}