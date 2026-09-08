"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, LoaderCircle } from "lucide-react";
import type { DistractionCategory } from "@/lib/constants";
import { DISTRACTION_CATEGORIES, DISTRACTION_LABELS } from "@/lib/constants";
import { addDistraction } from "@/actions/distractions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function DistractionLogger({
  dateKey,
  defaultOpen = false,
  readOnly = false,
}: {
  dateKey: string;
  defaultOpen?: boolean;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen && !readOnly);
  const [category, setCategory] = useState<DistractionCategory>("YOUTUBE");
  const [minutes, setMinutes] = useState("30");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    const mins = Number(minutes);
    if (!Number.isFinite(mins) || mins < 1) {
      setError("Enter valid minutes.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addDistraction({
        date: dateKey,
        category,
        minutes: mins,
        note,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to log distraction");
        return;
      }
      setOpen(false);
      setMinutes("30");
      setNote("");
      setCategory("YOUTUBE");
      router.refresh();
    });
  }

  return (
    <>
      {!readOnly ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Log
        </Button>
      ) : null}
      {open ? (
        <Modal open={open} onClose={() => setOpen(false)} title="Log Distraction" size="sm">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="dist-cat">Category</Label>
            <Select
              id="dist-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as DistractionCategory)}
            >
              {DISTRACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {DISTRACTION_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="dist-min">Minutes wasted</Label>
            <Input
              id="dist-min"
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dist-note">Note (optional)</Label>
            <Textarea
              id="dist-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What pulled you in?"
            />
          </div>
          {error ? <p className="text-xs text-bad">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={isPending}>
              {isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </div>
        </div>
      </Modal>
      ) : null}
    </>
  );
}