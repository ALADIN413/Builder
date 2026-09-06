import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { prisma } from "@/lib/prisma";
import { toDateKey, fromDateKey, weekStart, weekEnd, monthKey } from "@/lib/date";
import { aggregateWeek, aggregateMonth } from "@/lib/aggregations";
import {
  upsertDailyLog,
  setPrimaryObjective,
} from "@/actions/daily";
import { createFocusSession } from "@/actions/focus";
import { addDistraction, deleteDistraction } from "@/actions/distractions";
import {
  upsertBusinessMetric,
  deleteBusinessMetric,
} from "@/actions/business";
import {
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/actions/projects";
import {
  createSkill,
  updateSkill,
  setSkillLevel,
  deleteSkill,
  addSkillEvidence,
  deleteSkillEvidence,
} from "@/actions/skills";
import { addEvidence, deleteEvidence } from "@/actions/evidence";
import { saveWeeklyReview, computeMonthlyReview } from "@/actions/reviews";
import {
  exportAll,
  importAll,
  clearAll,
  seedData,
} from "@/actions/settings";
import {
  getDashboardData,
  getDailyLog,
  getFocusSessionsForDay,
  getDistractionsForDay,
  getBusinessMetricsForDay,
  getWeekReviewData,
  getProjectStats,
  getRecentWeekScoreHistory,
} from "@/lib/queries";

async function resetDb() {
  await prisma.$transaction([
    prisma.evidence.deleteMany(),
    prisma.skillEvidence.deleteMany(),
    prisma.projectMilestone.deleteMany(),
    prisma.weeklyReview.deleteMany(),
    prisma.monthlyReview.deleteMany(),
    prisma.businessMetric.deleteMany(),
    prisma.distraction.deleteMany(),
    prisma.focusSession.deleteMany(),
    prisma.dailyLog.deleteMany(),
    prisma.project.deleteMany(),
    prisma.skill.deleteMany(),
  ]);
}

beforeEach(resetDb);

describe("daily log + focus sessions (deep work sync)", () => {
  it("creates a daily log with scores and a default empty objective", async () => {
    const res = await upsertDailyLog({
      date: "2026-08-10",
      deepWorkMinutes: 60,
      technicalGrowth: 8,
      outputScore: 7,
      disciplineScore: 9,
    });
    expect(res.ok).toBe(true);

    const row = await prisma.dailyLog.findUnique({
      where: { date: fromDateKey("2026-08-10") },
    });
    expect(row?.deepWorkMinutes).toBe(60);
    expect(row?.technicalGrowth).toBe(8);
    expect(row?.outputScore).toBe(7);
    expect(row?.businessScore).toBeNull();
    expect(row?.primaryObjective).toBe("");
  });

  it("lets a focus session drive the day's deep work minutes", async () => {
    await createFocusSession({
      date: "2026-08-10",
      durationMinutes: 90,
      objective: "Build the onboarding flow",
      focusScore: 7,
    });
    const row = await prisma.dailyLog.findUnique({
      where: { date: fromDateKey("2026-08-10") },
    });
    expect(row?.deepWorkMinutes).toBe(90);

    await createFocusSession({
      date: "2026-08-10",
      durationMinutes: 45,
      objective: "Ship the API",
    });
    const updated = await prisma.dailyLog.findUnique({
      where: { date: fromDateKey("2026-08-10") },
    });
    expect(updated?.deepWorkMinutes).toBe(135);
  });

  it("keeps the greater of manual vs session deep work", async () => {
    await upsertDailyLog({ date: "2026-08-10", deepWorkMinutes: 240 });
    await createFocusSession({
      date: "2026-08-10",
      durationMinutes: 90,
      objective: "x",
    });
    const row = await prisma.dailyLog.findUnique({
      where: { date: fromDateKey("2026-08-10") },
    });
    expect(row?.deepWorkMinutes).toBe(240);
    const dayStats = await getDashboardData(fromDateKey("2026-08-10"));
    expect(dayStats.deepWorkMinutes).toBe(90);
  });

  it("setPrimaryObjective writes the objective and keeps scores", async () => {
    await upsertDailyLog({ date: "2026-08-10", deepWorkMinutes: 30, outputScore: 6 });
    const res = await setPrimaryObjective({ objective: "Validate the pain" }, "2026-08-10");
    expect(res.ok).toBe(true);
    const row = await prisma.dailyLog.findUnique({
      where: { date: fromDateKey("2026-08-10") },
    });
    expect(row?.primaryObjective).toBe("Validate the pain");
    expect(row?.outputScore).toBe(6);
  });

  it("rejects score bounds, date formats, and bad objectives", async () => {
    expect((await upsertDailyLog({ date: "2026-08-10", technicalGrowth: 0 })).ok).toBe(false);
    expect((await upsertDailyLog({ date: "08/10/2026" })).ok).toBe(false);
    expect((await createFocusSession({ date: "2026-08-10", durationMinutes: 0, objective: "x" })).ok).toBe(false);
    expect((await setPrimaryObjective({ objective: "   " }, "2026-08-10")).ok).toBe(false);
  });
});

describe("the reviews chain (week -> monthly)", () => {
  it("persists a weekly review snapshot that matches the live aggregate", async () => {
    const startKey = toDateKey(weekStart(new Date()));
    const d1 = fromDateKey(startKey);
    const d2 = fromDateKey(startKey);
    d2.setDate(d2.getDate() + 2);

    await createFocusSession({
      date: startKey,
      durationMinutes: 60,
      objective: "A",
      focusScore: 8,
    });
    await createFocusSession({
      date: toDateKey(d2),
      durationMinutes: 30,
      objective: "B",
      focusScore: 6,
    });
    await upsertDailyLog({
      date: startKey,
      deepWorkMinutes: 40,
      technicalGrowth: 8,
      outputScore: 7,
      businessScore: 6,
      disciplineScore: 5,
    });
    await upsertDailyLog({
      date: toDateKey(d2),
      deepWorkMinutes: 30,
      technicalGrowth: 4,
      outputScore: 5,
      businessScore: 6,
      disciplineScore: 7,
    });
    await upsertBusinessMetric({
      date: startKey,
      peopleContacted: 10,
      conversations: 3,
      payingCustomers: 2,
      revenue: 45.5,
    });
    await upsertBusinessMetric({
      date: toDateKey(d2),
      peopleContacted: 5,
      conversations: 1,
    });
    await addDistraction({
      date: toDateKey(d2),
      category: "YOUTUBE",
      minutes: 25,
      note: "algorithm",
    });
    await createProject({ name: "Care OS", status: "BUILDING" });
    await createProject({ name: "Care OS Site", status: "LAUNCHED" });

    const save = await saveWeeklyReview({
      weekStartDate: startKey,
      accomplished: "Shipped the MVP",
      notAccomplished: "",
      nextObjective: "Find 5 customers",
    });
    expect(save.ok).toBe(true);

    const agg = await aggregateWeek(d1, weekEnd(d1));

    expect(agg.deepWorkSessions).toBe(2);
    expect(agg.deepWorkMinutes).toBe(90);
    expect(agg.avgFocus).toBe(7);
    expect(agg.avgFounderScore).toBe(27.8);
    expect(agg.distractionMinutes).toBe(25);
    expect(agg.revenue).toBe(45.5);
    expect(agg.projectsProgressed).toBe(2);
    expect(agg.projectsShipped).toBe(1);

    const row = await prisma.weeklyReview.findUnique({
      where: { weekStartDate: d1 },
    });
    expect(row).not.toBeNull();
    expect(row?.deepWorkSessions).toBe(agg.deepWorkSessions);
    expect(row?.deepWorkMinutes).toBe(agg.deepWorkMinutes);
    expect(row?.avgFocus).toBe(agg.avgFocus);
    expect(row?.projectsProgressed).toBe(agg.projectsProgressed);
    expect(row?.projectsShipped).toBe(agg.projectsShipped);
    expect(row?.peopleContacted).toBe(agg.peopleContacted);
    expect(row?.customerConversations).toBe(agg.customerConversations);
    expect(row?.payingCustomers).toBe(agg.payingCustomers);
    expect(row?.revenue).toBe(agg.revenue);
    expect(row?.distractionMinutes).toBe(agg.distractionMinutes);
    expect(row?.avgFounderScore).toBe(agg.avgFounderScore);
    expect(row?.accomplished).toBe("Shipped the MVP");
    expect(row?.notAccomplished).toBeNull();
    expect(row?.nextObjective).toBe("Find 5 customers");

    await saveWeeklyReview({
      weekStartDate: startKey,
      accomplished: "Edited",
    });
    const reviews = await prisma.weeklyReview.findMany();
    expect(reviews).toHaveLength(1);
    expect(reviews[0].accomplished).toBe("Edited");
  });

  it("recomputes and upserts the monthly review", async () => {
    const now = new Date();
    const month = monthKey(now);
    const start = fromDateKey(toDateKey(new Date(now.getFullYear(), now.getMonth(), 1)));

    await upsertDailyLog({
      date: toDateKey(now),
      deepWorkMinutes: 90,
      technicalGrowth: 7,
      outputScore: 8,
    });
    await createFocusSession({
      date: toDateKey(now),
      durationMinutes: 90,
      objective: "x",
    });
    await addDistraction({ date: toDateKey(now), category: "GAMING", minutes: 12 });

    const res = await computeMonthlyReview(month);
    expect(res.ok).toBe(true);

    const agg = await aggregateMonth(
      start,
      new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    );

    const row = await prisma.monthlyReview.findUnique({ where: { month } });
    expect(row).not.toBeNull();
    expect(row?.deepWorkMinutes).toBe(agg.deepWorkMinutes);
    expect(row?.outputScore).toBe(agg.outputScore);
    expect(row?.technicalCapability).toBe(agg.technicalCapability);
    expect(row?.projectsCount).toBe(agg.projectsCount);
    expect(row?.users).toBe(agg.users);
    expect(row?.customers).toBe(agg.customers);
    expect(row?.revenue).toBe(agg.revenue);
    expect(row?.customerConversations).toBe(agg.customerConversations);
    expect(row?.distractionMinutes).toBe(agg.distractionMinutes);
    expect(row?.avgFounderScore).toBe(agg.avgFounderScore);

    await computeMonthlyReview(month);
    expect(await prisma.monthlyReview.count()).toBe(1);
  });

  it("rejects malformed review inputs", async () => {
    expect((await saveWeeklyReview({ weekStartDate: "2026/08/31" })).ok).toBe(false);
    expect((await saveWeeklyReview({})).ok).toBe(false);
    expect((await computeMonthlyReview("2026-13")).ok).toBe(false);
  });
});

describe("weekly aggregates count focus sessions only (lock-in of current intent)", () => {
  it("ignores manual deep work minutes in aggregateWeek.deepWorkMinutes", async () => {
    await upsertDailyLog({ date: "2026-08-10", deepWorkMinutes: 200 });
    const start = fromDateKey("2026-08-10");
    const agg = await aggregateWeek(start, weekEnd(start));
    expect(agg.deepWorkMinutes).toBe(0); // no FocusSession rows
    expect(agg.deepWorkMinutes).not.toBe(200);
  });
});

describe("projects and milestones", () => {
  it("creates, updates, and deletes a project", async () => {
    const created = await createProject({
      name: "Care OS",
      description: "Coordination for eldercare",
      status: "IDEA",
      users: 5,
      revenue: 10,
    });
    expect(created.ok).toBe(true);
    if (!created.ok || !created.data) return;
    const pid = created.data.id;

    const row = await prisma.project.findUnique({ where: { id: pid } });
    expect(row?.status).toBe("IDEA");
    expect(row?.users).toBe(5);
    expect(row?.revenue).toBe(10);

    expect((await updateProjectStatus(pid, "LAUNCHED")).ok).toBe(true);
    expect(
      (await prisma.project.findUnique({ where: { id: pid } }))?.status,
    ).toBe("LAUNCHED");

    expect(
      (await updateProject(pid, { name: "Care OS v2", status: "GROWING", users: 12 })).ok,
    ).toBe(true);
    const updated = await prisma.project.findUnique({ where: { id: pid } });
    expect(updated?.name).toBe("Care OS v2");
    expect(updated?.users).toBe(12);

    expect((await deleteProject(pid)).ok).toBe(true);
    expect(await prisma.project.count()).toBe(0);
  });

  it("rejects invalid projects and statuses", async () => {
    expect((await createProject({ name: "" })).ok).toBe(false);
    expect((await createProject({ name: "x", status: "IN_PROGRESS" })).ok).toBe(false);
    expect((await updateProjectStatus("nonexistent", "NOPE")).ok).toBe(false);
  });

  it("handles milestone lifecycle and completed dates", async () => {
    const created = await createProject({ name: "Care OS" });
    if (!created.ok || !created.data) throw new Error("project create failed");
    const pid = created.data.id;

    expect((await createMilestone(pid, { title: "Book 10 interviews" })).ok).toBe(true);
    const planned = await prisma.projectMilestone.findFirst({ orderBy: { createdAt: "asc" } });
    expect(planned?.status).toBe("PLANNED");

    const completed = await updateMilestone(planned!.id, {
      title: "Book 10 interviews",
      status: "COMPLETED",
      completedDate: "2026-08-15",
    });
    expect(completed.ok).toBe(true);
    expect(
      (await prisma.projectMilestone.findUnique({ where: { id: planned!.id } }))?.completedDate,
    ).not.toBeNull();

    await updateMilestone(planned!.id, {
      title: "Book 10 interviews",
      status: "PLANNED",
    });
    expect(
      (await prisma.projectMilestone.findUnique({ where: { id: planned!.id } }))?.completedDate,
    ).toBeNull();

    expect((await deleteMilestone(planned!.id)).ok).toBe(true);
    expect(await prisma.projectMilestone.count()).toBe(0);

    expect((await deleteProject(pid)).ok).toBe(true);
  });
});

describe("skills and evidence", () => {
  it("creates a skill, attaches evidence, and cleans up", async () => {
    const skill = await createSkill({
      name: "TypeScript",
      description: "Day-to-day TS",
      level: 3,
    });
    expect(skill.ok).toBe(true);
    if (!skill.ok || !skill.data) return;
    const sid = skill.data.id;

    expect(
      (await addSkillEvidence(sid, {
        title: "Open source PR merged",
        url: "https://github.com/example/pr/1",
      })).ok,
    ).toBe(true);

    const skillRow = await prisma.skill.findUnique({
      where: { id: sid },
      include: { evidence: true },
    });
    expect(skillRow?.level).toBe(3);
    expect(skillRow?.evidence).toHaveLength(1);

    const ev = skillRow!.evidence[0];
    expect((await deleteSkillEvidence(ev.id)).ok).toBe(true);
    expect((await updateSkill(sid, { name: "TypeScript", level: 4 })).ok).toBe(true);
    expect(
      (await prisma.skill.findUnique({ where: { id: sid } }))?.level,
    ).toBe(4);

    expect((await setSkillLevel(sid, 6)).ok).toBe(true);
    expect((await setSkillLevel(sid, 7)).ok).toBe(false);

    expect((await deleteSkill(sid)).ok).toBe(true);
    expect(await prisma.skillEvidence.count()).toBe(0);
  });

  it("rejects skill level bounds and bad evidence URLs", async () => {
    expect((await createSkill({ name: "Python", level: 7 })).ok).toBe(false);
    const skill = await createSkill({ name: "Python", level: 1 });
    if (!skill.ok || !skill.data) throw new Error("create failed");
    expect(
      (await addSkillEvidence(skill.data.id, { title: "x", url: "example.com" })).ok,
    ).toBe(false);
  });
});

describe("distractions", () => {
  it("adds, lists, and deletes a distraction", async () => {
    const res = await addDistraction({
      date: "2026-08-10",
      category: "SOCIAL_MEDIA",
      minutes: 30,
      note: "scrolling",
    });
    expect(res.ok).toBe(true);
    expect((await getDistractionsForDay(fromDateKey("2026-08-10")))).toHaveLength(1);

    const row = await prisma.distraction.findFirst();
    expect((await deleteDistraction(row!.id)).ok).toBe(true);
    expect(await prisma.distraction.count()).toBe(0);
  });

  it("rejects invalid categories and minute bounds", async () => {
    expect(
      (await addDistraction({ date: "2026-08-10", category: "REDDIT", minutes: 5 })).ok,
    ).toBe(false);
    expect(
      (await addDistraction({ date: "2026-08-10", category: "YOUTUBE", minutes: 0 })).ok,
    ).toBe(false);
  });
});

describe("business metrics", () => {
  it("upserts (defaulting omitted fields) and deletes a metric", async () => {
    const res = await upsertBusinessMetric({
      date: "2026-08-10",
      peopleContacted: 12,
      conversations: 4,
      revenue: 120,
      retention: 0.4,
    });
    expect(res.ok).toBe(true);
    await upsertBusinessMetric({
      date: "2026-08-10",
      peopleContacted: 20,
      conversations: 6,
    });
    const row = await prisma.businessMetric.findUnique({
      where: { date: fromDateKey("2026-08-10") },
    });
    // a partial payload defaults the omitted fields, so revenue/retention reset to 0
    expect(row?.peopleContacted).toBe(20);
    expect(row?.conversations).toBe(6);
    expect(row?.revenue).toBe(0);
    expect(row?.retention).toBe(0);

    expect((await deleteBusinessMetric(row!.id)).ok).toBe(true);
    expect(await prisma.businessMetric.count()).toBe(0);

    expect(
      (await upsertBusinessMetric({ date: "2026-08-10", retention: 1.5 })).ok,
    ).toBe(false);
  });
});

describe("evidence hub", () => {
  it("adds and deletes standalone evidence", async () => {
    const res = await addEvidence({
      title: "Customer call notes",
      type: "CUSTOMER",
      url: "https://example.com/notes",
      relatedType: "project",
      relatedId: "abc",
    });
    expect(res.ok).toBe(true);

    const row = await prisma.evidence.findFirst();
    expect(row?.relatedType).toBe("project");
    expect((await deleteEvidence(row!.id)).ok).toBe(true);
    expect(await prisma.evidence.count()).toBe(0);

    expect(
      (await addEvidence({ title: "x", url: "bad" })).ok,
    ).toBe(false);
  });
});

describe("dashboard queries", () => {
  it("returns today's shape after seeding", async () => {
    const today = toDateKey(new Date());
    await upsertDailyLog({
      date: today,
      primaryObjective: "Write the summary",
      deepWorkMinutes: 60,
      outputScore: 8,
    });
    await addDistraction({ date: today, category: "OTHER", minutes: 10 });

    const dash = await getDashboardData();
    expect(dash.dateKey).toBe(today);
    expect(dash.dailyLog?.primaryObjective).toBe("Write the summary");
    expect(dash.deepWorkMinutes).toBe(0); // no sessions

    await createFocusSession({ date: today, durationMinutes: 45, objective: "x" });
    expect((await getDashboardData()).deepWorkMinutes).toBe(45);

    const log = await getDailyLog(new Date());
    // manual 60 floors the stored day total even though the session sum is 45
    expect(log?.deepWorkMinutes).toBe(60);

    const sessions = await getFocusSessionsForDay(new Date());
    expect(sessions).toHaveLength(1);

    const metrics = await getBusinessMetricsForDay(new Date());
    expect(metrics).toBeNull();

    const week = await getWeekReviewData(new Date());
    expect(week.sessions).toHaveLength(1);
    expect(week.dailyLogs).toHaveLength(1);
    expect(week.distractions).toHaveLength(1);

    const stats = await getProjectStats();
    expect(stats).toEqual([]);

    const history = await getRecentWeekScoreHistory(new Date(), 2);
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("settings: seed / export / import / clear", () => {
  it("seeds the sample data", async () => {
    const res = await seedData();
    expect(res.ok).toBe(true);
    const counts = await Promise.all([
      prisma.project.count(),
      prisma.projectMilestone.count(),
      prisma.skill.count(),
      prisma.dailyLog.count(),
      prisma.businessMetric.count(),
    ]);
    expect(counts).toEqual([1, 3, 13, 2, 2]);
  });

  it("round-trips a full export through clear and import", async () => {
    await seedData();
    const exported = await exportAll();
    expect(exported.ok).toBe(true);
    if (!exported.ok || !exported.data) return;
    const bundle = exported.data;
    expect(bundle.dailyLogs).toHaveLength(2);

    await clearAll();
    const cleared = await Promise.all([
      prisma.dailyLog.count(),
      prisma.project.count(),
      prisma.skill.count(),
      prisma.businessMetric.count(),
    ]);
    expect(cleared).toEqual([0, 0, 0, 0]);

    await importAll(bundle);
    const restored = await Promise.all([
      prisma.project.count(),
      prisma.projectMilestone.count(),
      prisma.skill.count(),
      prisma.dailyLog.count(),
      prisma.businessMetric.count(),
    ]);
    expect(restored).toEqual([1, 3, 13, 2, 2]);
  });

  it("rejects invalid import payloads and tolerates junk rows", async () => {
    expect((await importAll(null)).ok).toBe(false);
    expect((await importAll("nope")).ok).toBe(false);
    expect((await importAll(42)).ok).toBe(false);
    const res = await importAll({ dailyLogs: [null, "junk", {}] });
    expect(res.ok).toBe(true);
    expect(await prisma.dailyLog.count()).toBe(0);
  });

  it("clears every table", async () => {
    await seedData();
    await createSkill({ name: "TestSkill", level: 1 });
    await upsertDailyLog({ date: "2026-08-10", deepWorkMinutes: 10 });
    await createProject({ name: "P" });
    await addEvidence({ title: "E", url: "https://x.com" });
    await saveWeeklyReview({ weekStartDate: "2026-08-31" });
    await computeMonthlyReview("2026-08");

    await clearAll();
    const empty = await Promise.all([
      prisma.dailyLog.count(),
      prisma.focusSession.count(),
      prisma.distraction.count(),
      prisma.skill.count(),
      prisma.skillEvidence.count(),
      prisma.project.count(),
      prisma.projectMilestone.count(),
      prisma.businessMetric.count(),
      prisma.weeklyReview.count(),
      prisma.monthlyReview.count(),
      prisma.evidence.count(),
    ]);
    expect(empty.every((n) => n === 0)).toBe(true);
  });
});