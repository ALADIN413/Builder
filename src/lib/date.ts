import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  parseISO,
  isSameDay,
} from "date-fns";

export type DateKey = string; // YYYY-MM-DD in local time

/** Normalize a Date to local midnight (start of day). */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Local midnight key, e.g. "2026-09-06". */
export function toDateKey(date: Date): DateKey {
  return format(startOfDay(date), "yyyy-MM-dd");
}

/** Parse a YYYY-MM-DD key into a Date at local midnight. */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return startOfDay(new Date(y, m - 1, d));
}

/** Ensure a Date (possibly with time) is normalized to its day key. */
export function keyFor(date: Date): DateKey {
  return toDateKey(date);
}

/** Monday-based start of week for a given date. */
export function weekStart(date: Date): Date {
  return startOfWeek(startOfDay(date), { weekStartsOn: 1 });
}

/** End of week (Sunday). */
export function weekEnd(date: Date): Date {
  return endOfWeek(startOfDay(date), { weekStartsOn: 1 });
}

export function weekStartKey(date: Date): DateKey {
  return toDateKey(weekStart(date));
}

/** Format a Date as YYYY-MM-DD (used for month keys too). */
export function formatKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

/** Month key like "2026-09". */
export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function weekDates(date: Date): Date[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function parseDateKey(key: string): Date {
  return parseISO(key);
}

export function isSameDayKey(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

/** Human-friendly long date. */
export function formatLong(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

export function formatShort(date: Date): string {
  return format(date, "MMM d");
}

export function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format seconds as H:MM:SS or MM:SS. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}