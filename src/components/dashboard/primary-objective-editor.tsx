"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X, LoaderCircle } from "lucide-react";
import { setPrimaryObjective } from "@/actions/daily";

export function PrimaryObjectiveEditor({
  initial,
  dateKey,
  readOnly = false,
}: {
  initial: string;
  dateKey: string;
  readOnly?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(!initial && !readOnly);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Objective is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await setPrimaryObjective({ objective: trimmed }, dateKey);
      if (!res.ok) {
        setError(res.error ?? "Failed to save");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        {initial ? (
          <p className="text-base font-medium text-text">{initial}</p>
        ) : (
          <p className="text-sm text-faint">
            You haven&apos;t set today&apos;s primary objective.
          </p>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit primary objective"
          disabled={readOnly}
          className="rounded p-1 text-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-2 hover:text-text disabled:opacity-0"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex w-full items-start gap-2"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What is today's single highest-leverage work?"
        maxLength={300}
        className="w-full rounded-md border border-accent/50 bg-surface-2 px-3 py-2 text-base font-medium text-text placeholder:text-faint focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (initial) {
              setValue(initial);
              setEditing(false);
            }
          }
        }}
      />
      <button
        type="submit"
        disabled={isPending}
        aria-label="Save"
        className="rounded-md bg-accent p-2 text-accent-fg transition-colors hover:bg-accent-strong disabled:opacity-50"
      >
        {isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          setValue(initial);
          setEditing(false);
          setError(null);
        }}
        aria-label="Cancel"
        className="rounded-md p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        <X className="h-4 w-4" />
      </button>
      {error ? <p className="w-full text-xs text-bad">{error}</p> : null}
    </form>
  );
}