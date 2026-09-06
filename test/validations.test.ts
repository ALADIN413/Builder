import { describe, expect, it } from "vitest";
import {
  focusSessionInputSchema,
  dailyLogInputSchema,
  distractionInputSchema,
  projectInputSchema,
  milestoneInputSchema,
  milestoneStatusSchema,
  projectStatusSchema,
  skillInputSchema,
  skillEvidenceInputSchema,
  businessMetricInputSchema,
  weeklyReviewInputSchema,
  evidenceInputSchema,
  primaryObjectiveSchema,
} from "@/lib/validations";

const parseOk = (schema: { safeParse(v: unknown): { success: boolean } }, v: unknown) =>
  schema.safeParse(v).success;

describe("primaryObjectiveSchema", () => {
  it("accepts a non-empty objective", () => {
    expect(parseOk(primaryObjectiveSchema, { objective: "Ship launch" })).toBe(true);
  });
  it("rejects empty or missing objective", () => {
    expect(parseOk(primaryObjectiveSchema, { objective: "   " })).toBe(false);
    expect(parseOk(primaryObjectiveSchema, {})).toBe(false);
  });
});

describe("focusSessionInputSchema", () => {
  const base = { date: "2026-09-06", durationMinutes: 90, objective: "Deep work" };
  it("accepts a canonical session", () => {
    expect(parseOk(focusSessionInputSchema, base)).toBe(true);
  });
  it("accepts optional fields including an empty evidence URL", () => {
    expect(
      parseOk(focusSessionInputSchema, {
        ...base,
        accomplishment: "",
        output: "Wrote doc",
        blocker: "",
        focusScore: null,
        evidenceUrl: "",
      }),
    ).toBe(true);
  });
  it("rejects an invalid date key", () => {
    expect(parseOk(focusSessionInputSchema, { ...base, date: "09/06/2026" })).toBe(false);
  });
  it("rejects out-of-range durations", () => {
    expect(parseOk(focusSessionInputSchema, { ...base, durationMinutes: 0 })).toBe(false);
    expect(parseOk(focusSessionInputSchema, { ...base, durationMinutes: 481 })).toBe(false);
  });
  it("rejects focus scores outside 1..10", () => {
    expect(parseOk(focusSessionInputSchema, { ...base, focusScore: 0 })).toBe(false);
    expect(parseOk(focusSessionInputSchema, { ...base, focusScore: 11 })).toBe(false);
  });
  it("rejects non-http URLs", () => {
    expect(
      parseOk(focusSessionInputSchema, { ...base, evidenceUrl: "//no-protocol.com" }),
    ).toBe(false);
  });
});

describe("dailyLogInputSchema", () => {
  it("accepts a minimal log with defaults", () => {
    const r = dailyLogInputSchema.safeParse({ date: "2026-09-06" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.deepWorkMinutes).toBe(0);
  });
  it("accepts explicit scores of 1..10 and nulls", () => {
    expect(
      parseOk(dailyLogInputSchema, {
        date: "2026-09-06",
        technicalGrowth: 10,
        outputScore: null,
        disciplineScore: 1,
        deepWorkMinutes: 240,
      }),
    ).toBe(true);
  });
  it("rejects scores of 0 and 11", () => {
    expect(
      parseOk(dailyLogInputSchema, { date: "2026-09-06", technicalGrowth: 0 }),
    ).toBe(false);
    expect(
      parseOk(dailyLogInputSchema, { date: "2026-09-06", outputScore: 11 }),
    ).toBe(false);
  });
  it("rejects out-of-range deep work", () => {
    expect(
      parseOk(dailyLogInputSchema, { date: "2026-09-06", deepWorkMinutes: -1 }),
    ).toBe(false);
    expect(
      parseOk(dailyLogInputSchema, { date: "2026-09-06", deepWorkMinutes: 1441 }),
    ).toBe(false);
  });
  it("rejects a missing date", () => {
    expect(parseOk(dailyLogInputSchema, { deepWorkMinutes: 10 })).toBe(false);
  });
});

describe("distractionInputSchema", () => {
  it("accepts a known category with minutes", () => {
    expect(
      parseOk(distractionInputSchema, { date: "2026-09-06", category: "YOUTUBE", minutes: 20 }),
    ).toBe(true);
  });
  it("rejects unknown categories and zero minutes", () => {
    expect(
      parseOk(distractionInputSchema, { date: "2026-09-06", category: "REDDIT", minutes: 20 }),
    ).toBe(false);
    expect(
      parseOk(distractionInputSchema, { date: "2026-09-06", category: "YOUTUBE", minutes: 0 }),
    ).toBe(false);
  });
});

describe("projectInputSchema", () => {
  it("accepts a valid project and defaults status to IDEA", () => {
    const r = projectInputSchema.safeParse({ name: "Care OS" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("IDEA");
  });
  it("rejects a blank name", () => {
    expect(parseOk(projectInputSchema, { name: "  " })).toBe(false);
  });
  it("accepts empty optional dates and strings", () => {
    expect(
      parseOk(projectInputSchema, {
        name: "Care OS",
        startDate: "",
        targetDate: null,
        primaryObjective: "",
        users: 0,
      }),
    ).toBe(true);
  });
  it("rejects negative users/revenue", () => {
    expect(parseOk(projectInputSchema, { name: "x", users: -1 })).toBe(false);
    expect(parseOk(projectInputSchema, { name: "x", revenue: -0.01 })).toBe(false);
  });
  it("rejects an invalid status", () => {
    expect(parseOk(projectInputSchema, { name: "x", status: "IN_PROGRESS" })).toBe(false);
  });
});

describe("status schemas", () => {
  it("accepts known project/milestone statuses only", () => {
    expect(parseOk(projectStatusSchema, { status: "LAUNCHED" })).toBe(true);
    expect(parseOk(projectStatusSchema, { status: "NOPE" })).toBe(false);
    expect(parseOk(milestoneStatusSchema, { status: "COMPLETED" })).toBe(true);
    expect(parseOk(milestoneStatusSchema, { status: "DONE" })).toBe(false);
  });
});

describe("milestoneInputSchema", () => {
  it("accepts a valid milestone", () => {
    expect(
      parseOk(milestoneInputSchema, {
        title: "Book 10 interviews",
        status: "PLANNED",
        targetDate: "",
        completedDate: null,
      }),
    ).toBe(true);
  });
  it("requires a title", () => {
    expect(parseOk(milestoneInputSchema, { title: "" })).toBe(false);
  });
});

describe("skill schemas", () => {
  it("accepts skill levels 0..6, rejects 7", () => {
    expect(parseOk(skillInputSchema, { name: "Python", level: 6 })).toBe(true);
    expect(parseOk(skillInputSchema, { name: "Python", level: 7 })).toBe(false);
  });
  it("requires a name", () => {
    expect(parseOk(skillInputSchema, { name: " " })).toBe(false);
  });
  it("requires an http(s) URL for evidence", () => {
    expect(
      parseOk(skillEvidenceInputSchema, { title: "Repo", url: "https://github.com/x" }),
    ).toBe(true);
    expect(
      parseOk(skillEvidenceInputSchema, { title: "Repo", url: "example.com" }),
    ).toBe(false);
  });
});

describe("businessMetricInputSchema", () => {
  it("accepts all-zero defaults", () => {
    const r = businessMetricInputSchema.safeParse({ date: "2026-09-06" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.revenue).toBe(0);
  });
  it("rejects retention outside 0..1", () => {
    expect(
      parseOk(businessMetricInputSchema, { date: "2026-09-06", retention: 1.5 }),
    ).toBe(false);
    expect(
      parseOk(businessMetricInputSchema, { date: "2026-09-06", retention: 1 }),
    ).toBe(true);
  });
  it("rejects negative counts", () => {
    expect(
      parseOk(businessMetricInputSchema, { date: "2026-09-06", demos: -1 }),
    ).toBe(false);
  });
});

describe("weeklyReviewInputSchema", () => {
  it("accepts answer text and optional empties", () => {
    expect(
      parseOk(weeklyReviewInputSchema, {
        weekStartDate: "2026-08-31",
        accomplished: "Shipped the MVP",
        wastedTime: "",
        nextObjective: "Find 5 customers",
      }),
    ).toBe(true);
  });
  it("rejects a malformed week start date", () => {
    expect(parseOk(weeklyReviewInputSchema, { weekStartDate: "2026/08/31" })).toBe(false);
    expect(parseOk(weeklyReviewInputSchema, {})).toBe(false);
  });
});

describe("evidenceInputSchema", () => {
  it("accepts evidence with optional relations", () => {
    expect(
      parseOk(evidenceInputSchema, {
        title: "Customer call notes",
        type: "CUSTOMER",
        url: "https://example.com/notes",
        relatedType: "project",
        relatedId: "abc123",
      }),
    ).toBe(true);
  });
  it("rejects a malformed URL", () => {
    expect(
      parseOk(evidenceInputSchema, { title: "x", url: "not-a-url" }),
    ).toBe(false);
  });
});