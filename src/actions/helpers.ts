import type { z } from "zod";
import { fromDateKey } from "@/lib/date";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

type ZodSchema<T> = z.ZodType<T>;

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Parse with a zod schema and return a normalized ParseResult on failure. */
export function safeParse<T>(schema: ZodSchema<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { ok: false, error: "Invalid input", fieldErrors };
  }
  return { ok: true, data: result.data };
}

/** Convert a date-key string back into a Date (local midnight), or null when absent. */
export function keyToDate(key?: string | null): Date | null {
  if (!key) return null;
  return fromDateKey(key);
}

export function keyToDateRequired(key: string): Date {
  return fromDateKey(key);
}

/** Coerce a form value that may be "" or null into undefined / null for optional dates. */
export function dateFromForm(v: string | null | undefined): Date | null {
  if (!v || v.trim() === "") return null;
  return fromDateKey(v.trim());
}

export function isParseError<T>(
  r: ParseResult<T>,
): r is Extract<ParseResult<T>, { ok: false }> {
  return !r.ok;
}