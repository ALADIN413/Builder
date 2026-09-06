import { describe, expect, it } from "vitest";
import {
  toDateKey,
  fromDateKey,
  weekStart,
  weekEnd,
  weekStartKey,
  weekDates,
  parseDateKey,
  monthKey,
  formatClock,
  formatDuration,
  formatLong,
  formatShort,
  formatTime,
  startOfDay,
} from "@/lib/date";

describe("date keys", () => {
  it("round-trips a date key (local midnight)", () => {
    for (const key of ["2026-01-01", "2026-06-15", "2026-09-06", "2026-12-31"]) {
      expect(toDateKey(fromDateKey(key))).toBe(key);
    }
  });

  it("normalizes a time-bearing date to its day key", () => {
    const d = new Date(2026, 8, 6, 23, 59, 59);
    expect(toDateKey(d)).toBe("2026-09-06");
  });

  it("startOfDay zeroes the clock", () => {
    const d = startOfDay(new Date(2026, 8, 6, 15, 30));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("parseDateKey accepts an ISO key", () => {
    expect(toDateKey(parseDateKey("2026-09-06"))).toBe("2026-09-06");
  });

  it("fromDateKey returns a valid date for malformed input rather than throwing", () => {
    expect(() => fromDateKey("garbage").getTime()).not.toBeNaN();
    expect(() => fromDateKey("08-10-2026").getTime()).not.toBeNaN();
  });
});

describe("week boundaries (weekStartsOn: Monday)", () => {
  it("treats a Sunday as belonging to the week that started the prior Monday", () => {
    const sunday = new Date(2026, 8, 6); // Sun Sep 6 2026
    expect(toDateKey(weekStart(sunday))).toBe("2026-08-31");
    expect(weekStartKey(sunday)).toBe("2026-08-31");
    expect(toDateKey(weekEnd(sunday))).toBe("2026-09-06");
  });

  it("treats a Monday as the start of its own week", () => {
    const monday = new Date(2026, 7, 31); // Mon Aug 31 2026
    expect(toDateKey(weekStart(monday))).toBe("2026-08-31");
    expect(toDateKey(weekEnd(monday))).toBe("2026-09-06");
  });

  it("returns seven consecutive dates starting Monday", () => {
    const dates = weekDates(new Date(2026, 8, 6));
    expect(dates).toHaveLength(7);
    expect(toDateKey(dates[0])).toBe("2026-08-31");
    expect(toDateKey(dates[6])).toBe("2026-09-06");
  });

  it("handles month boundaries", () => {
    const lastDayOfMonth = new Date(2026, 7, 31); // Mon
    const prev = new Date(2026, 7, 30); // Sun Aug 30
    expect(toDateKey(weekStart(prev))).toBe("2026-08-24");
    expect(toDateKey(weekStart(lastDayOfMonth))).toBe("2026-08-31");
  });
});

describe("month keys", () => {
  it("formats YYYY-MM", () => {
    expect(monthKey(new Date(2026, 8, 6))).toBe("2026-09");
    expect(monthKey(fromDateKey("2026-01-31"))).toBe("2026-01");
  });
});

describe("formatting", () => {
  it("formatClock renders MM:SS under an hour", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(59)).toBe("00:59");
    expect(formatClock(3599)).toBe("59:59");
  });

  it("formatClock renders H:MM:SS at and beyond an hour", () => {
    expect(formatClock(3600)).toBe("1:00:00");
    expect(formatClock(3661)).toBe("1:01:01");
  });

  it("formatClock floors and never goes negative", () => {
    expect(formatClock(90.8)).toBe("01:30");
    expect(formatClock(-5)).toBe("00:00");
  });

  it("formatDuration renders compact units", () => {
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(120)).toBe("2h");
  });

  it("human-friendly date helpers return strings", () => {
    const d = new Date(2026, 8, 6);
    expect(formatLong(d)).toBe("Sunday, September 6, 2026");
    expect(formatShort(d)).toBe("Sep 6");
    expect(formatTime(new Date(2026, 8, 6, 15, 5))).toBe("3:05 PM");
  });
});