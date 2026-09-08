import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

type TestUser = {
  id: string;
  name: string;
  emoji: string;
  isHead: boolean;
  teamId: string | null;
  team: {
    id: string;
    name: string;
    eodMeetingTime: string;
    eodMeetingDurationMinutes: number;
  } | null;
  createdAt: Date;
};

const state = vi.hoisted(() => ({ user: null as TestUser | null }));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => state.user,
  requireUser: async () => {
    if (!state.user) throw new Error("test user not set");
    return state.user as unknown;
  },
  resolveViewer: async (searchParams: { view?: string }, current: TestUser) => {
    if (searchParams.view && searchParams.view !== current.id) {
      return { user: { id: searchParams.view, name: "Other", emoji: "👤" }, isSelf: false };
    }
    return { user: { id: current.id, name: current.name, emoji: current.emoji }, isSelf: true };
  },
}));

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
  updateTeamMeeting,
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
  getMemberTodayDigest,
  getTeamMembers,
  getTeamDirectory,
} from "@/lib/queries";

const TEST_USER_ID = "test-founder";

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
    prisma.user.deleteMany(),
    prisma.team.deleteMany(),
  ]);
}

async function me() {
  const user = await prisma.user.create({
    data: { id: TEST_USER_ID, name: "Test Founder", emoji: "👤" },
  });
  state.user = {
    id: user.id,
    name: user.name,
    emoji: user.emoji,
    isHead: false,
    teamId: null,
    team: null,
    createdAt: user.createdAt,
  };
  return state.user;
}

beforeEach(async () => {
  await resetDb();
  await me();
  await prisma.team.create({
    data: {
      id: "team-1",
      name: "Test Team",
      eodMeetingTime: "17:30",
      eodMeetingDurationMinutes: 30,
    },
  });
});

const uid = () => state.user!.id;

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
      where: { userId_date: { userId: uid(), date: fromDateKey("2026-08-10") } },
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
      where: { userId_date: { userId: uid(), date: fromDateKey("2026-08-10") } },
    });
    expect(row?.deepWorkMinutes).toBe(90);

    await createFocusSession({
      date: "2026-08-10",
      durationMinutes: 45,
      objective: "Ship the API",
    });
    const updated = await prisma.dailyLog.findUnique({
      where: { userId_date: { userId: uid(), date: fromDateKey("2026-08-10") } },
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
      where: { userId_date: { userId: uid(), date: fromDateKey("2026-08-10") } },
    });
    expect(row?.deepWorkMinutes).toBe(240);
    const dayStats = await getDashboardData(uid(), fromDateKey("2026-08-10"));
    expect(dayStats.deepWorkMinutes).toBe(90);
  });

  it("setPrimaryObjective writes the objective and keeps scores", async () => {
    await upsertDailyLog({ date: "2026-08-10", deepWorkMinutes: 30, outputScore: 6 });
    const res = await setPrimaryObjective({ objective: "Validate the pain" }, "2026-08-10");
    expect(res.ok).toBe(true);
    const row = await prisma.dailyLog.findUnique({
      where: { userId_date: { userId: uid(), date: fromDateKey("2026-08-10") } },
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

    const agg = await aggregateWeek(d1, weekEnd(d1), uid());

    expect(agg.deepWorkSessions).toBe(2);
    expect(agg.deepWorkMinutes).toBe(90);
    expect(agg.avgFocus).toBe(7);
    expect(agg.avgFounderScore).toBe(27.8);
    expect(agg.distractionMinutes).toBe(25);
    expect(agg.revenue).toBe(45.5);
    expect(agg.projectsProgressed).toBe(2);
    expect(agg.projectsShipped).toBe(1);

    const row = await prisma.weeklyReview.findUnique({
      where: { userId_weekStartDate: { userId: uid(), weekStartDate: d1 } },
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
      uid(),
    );

    const row = await prisma.monthlyReview.findUnique({
      where: { userId_month: { userId: uid(), month } },
    });
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
    const agg = await aggregateWeek(start, weekEnd(start), uid());
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
    expect(row?.userId).toBe(uid());

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

  it("cannot mutate another user's project", async () => {
    const other = await prisma.user.create({
      data: { id: "other-user", name: "Other", emoji: "👤" },
    });
    const theirProject = await prisma.project.create({
      data: { userId: other.id, name: "Not mine", status: "IDEA" },
    });
    expect((await updateProjectStatus(theirProject.id, "LAUNCHED")).ok).toBe(false);
    expect((await updateProject(theirProject.id, { name: "Hacked" })).ok).toBe(false);
    expect((await deleteProject(theirProject.id)).ok).toBe(false);
    const untouched = await prisma.project.findUnique({ where: { id: theirProject.id } });
    expect(untouched?.name).toBe("Not mine");
    expect(untouched?.status).toBe("IDEA");
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

  it("cannot touch another user's skill", async () => {
    const other = await prisma.user.create({ data: { id: "other-user", name: "Other", emoji: "👤" } });
    const theirSkill = await prisma.skill.create({
      data: { userId: other.id, name: "Their skill", level: 1 },
    });
    expect((await updateSkill(theirSkill.id, { name: "Hacked", level: 6 })).ok).toBe(false);
    expect((await setSkillLevel(theirSkill.id, 5)).ok).toBe(false);
    expect((await deleteSkill(theirSkill.id)).ok).toBe(false);
    expect((await addSkillEvidence(theirSkill.id, { title: "x", url: "https://x.com" })).ok).toBe(false);
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
    expect((await getDistractionsForDay(uid(), fromDateKey("2026-08-10")))).toHaveLength(1);

    const row = await prisma.distraction.findFirst();
    expect((await deleteDistraction(row!.id)).ok).toBe(true);
    expect(await prisma.distraction.count()).toBe(0);
  });

  it("deleting another user's distraction is a no-op", async () => {
    const other = await prisma.user.create({ data: { id: "other-user", name: "Other", emoji: "👤" } });
    const d = await prisma.distraction.create({
      data: { userId: other.id, date: fromDateKey("2026-08-10"), category: "YOUTUBE", minutes: 5 },
    });
    expect((await deleteDistraction(d.id)).ok).toBe(true);
    expect(await prisma.distraction.count()).toBe(1);
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
      where: { userId_date: { userId: uid(), date: fromDateKey("2026-08-10") } },
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

    const dash = await getDashboardData(uid());
    expect(dash.dateKey).toBe(today);
    expect(dash.dailyLog?.primaryObjective).toBe("Write the summary");
    expect(dash.deepWorkMinutes).toBe(0); // no sessions

    await createFocusSession({ date: today, durationMinutes: 45, objective: "x" });
    expect((await getDashboardData(uid())).deepWorkMinutes).toBe(45);

    const log = await getDailyLog(uid(), new Date());
    // manual 60 floors the stored day total even though the session sum is 45
    expect(log?.deepWorkMinutes).toBe(60);

    const sessions = await getFocusSessionsForDay(uid(), new Date());
    expect(sessions).toHaveLength(1);

    const metrics = await getBusinessMetricsForDay(uid(), new Date());
    expect(metrics).toBeNull();

    const week = await getWeekReviewData(uid(), new Date());
    expect(week.sessions).toHaveLength(1);
    expect(week.dailyLogs).toHaveLength(1);
    expect(week.distractions).toHaveLength(1);

    const stats = await getProjectStats(uid());
    expect(stats).toEqual([]);

    const history = await getRecentWeekScoreHistory(uid(), new Date(), 2);
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("team layer", () => {
  it("seeds a team, sample teammates, and today's digest for everyone", async () => {
    const res = await seedData();
    expect(res.ok).toBe(true);
    if (!res.ok || !res.data) throw new Error("seed failed");
    const teamId = res.data.teamId;

    const members = await getTeamMembers(teamId);
    expect(members).toHaveLength(3);
    const heads = members.filter((m) => m.isHead);
    expect(heads).toHaveLength(1);
    expect(heads[0].id).toBe(TEST_USER_ID);

    const digest = await getMemberTodayDigest(TEST_USER_ID);
    expect(digest.deepWorkMinutes).toBeGreaterThan(0);
    expect(digest.sessionCount).toBe(1);
    expect(digest.outputs.length).toBeGreaterThan(0);
    expect(digest.evidenceCount).toBe(0);
  });

  it("isolates same-date data between users", async () => {
    const other = await prisma.user.create({ data: { id: "other-user", name: "Other", emoji: "👤" } });
    await prisma.focusSession.create({
      data: {
        userId: other.id,
        date: fromDateKey("2026-08-10"),
        durationMinutes: 120,
        objective: "theirs",
      },
    });
    await createFocusSession({
      date: "2026-08-10",
      durationMinutes: 45,
      objective: "mine",
    });
    const mine = await getDashboardData(uid(), fromDateKey("2026-08-10"));
    expect(mine.sessions).toHaveLength(1);
    expect(mine.sessions[0].objective).toBe("mine");
    expect(mine.deepWorkMinutes).toBe(45);

    const agg = await aggregateWeek(
      fromDateKey("2026-08-10"),
      weekEnd(fromDateKey("2026-08-10")),
      uid(),
    );
    expect(agg.deepWorkSessions).toBe(1);
    expect(agg.deepWorkMinutes).toBe(45);
  });

  it("getTeamDirectory returns members plus the meeting", async () => {
    const me2 = state.user!;
    me2.teamId = "team-1";
    me2.team = { id: "team-1", name: "Test Team", eodMeetingTime: "17:30", eodMeetingDurationMinutes: 30 };
    await prisma.user.update({ where: { id: uid() }, data: { teamId: "team-1" } });

    const dir = await getTeamDirectory(me2);
    expect(dir.meeting?.eodMeetingTime).toBe("17:30");
    expect(dir.members.length).toBe(1);
  });
});

describe("settings: team meeting", () => {
  it("only the head can change the meeting", async () => {
    const me2 = state.user!;
    me2.teamId = "team-1";
    me2.team = { id: "team-1", name: "Test Team", eodMeetingTime: "17:00", eodMeetingDurationMinutes: 30 };

    // member (not head) -> rejected
    const asMember = await updateTeamMeeting({
      name: "Hacked Team",
      eodMeetingTime: "08:00",
      eodMeetingDurationMinutes: 15,
    });
    expect(asMember.ok).toBe(false);

    me2.isHead = true;
    const ok = await updateTeamMeeting({
      name: "Founder Team",
      eodMeetingTime: "18:15",
      eodMeetingDurationMinutes: 45,
    });
    expect(ok.ok).toBe(true);

    const team = await prisma.team.findUnique({ where: { id: "team-1" } });
    expect(team?.name).toBe("Founder Team");
    expect(team?.eodMeetingTime).toBe("18:15");
    expect(team?.eodMeetingDurationMinutes).toBe(45);
  });

  it("rejects invalid meeting inputs", async () => {
    state.user!.isHead = true;
    expect((await updateTeamMeeting({ eodMeetingTime: "25:00", eodMeetingDurationMinutes: 30 })).ok).toBe(false);
    expect((await updateTeamMeeting({ eodMeetingTime: "17:00", eodMeetingDurationMinutes: 1000 })).ok).toBe(false);
  });
});

describe("settings: seed / export / import / clear", () => {
  it("clears only the current user's data, not teammates'", async () => {
    const res = await seedData();
    if (!res.ok || !res.data) throw new Error("seed failed");
    const teammates = (await prisma.user.findMany({ where: { teamId: res.data.teamId, id: { not: TEST_USER_ID } } })).length;
    expect(teammates).toBe(2);

    await clearAll();
    const mine = await Promise.all([
      prisma.project.count({ where: { userId: TEST_USER_ID } }),
      prisma.skill.count({ where: { userId: TEST_USER_ID } }),
      prisma.dailyLog.count({ where: { userId: TEST_USER_ID } }),
      prisma.businessMetric.count({ where: { userId: TEST_USER_ID } }),
    ]);
    expect(mine).toEqual([0, 0, 0, 0]);

    const teammatesRemain = await prisma.dailyLog.count({ where: { userId: { not: TEST_USER_ID } } });
    expect(teammatesRemain).toBeGreaterThan(0);
  });

  it("round-trips a full export through clear and import", async () => {
    await seedData();
    const exported = await exportAll();
    expect(exported.ok).toBe(true);
    if (!exported.ok || !exported.data) return;
    const bundle = exported.data;
    // export only covers the signed-in user's rows
    expect(bundle.dailyLogs).toHaveLength(1);
    expect(bundle.projects).toHaveLength(1);
    expect(bundle.milestones).toHaveLength(3);
    expect(bundle.skills).toHaveLength(3);

    await clearAll();
    const cleared = await Promise.all([
      prisma.dailyLog.count({ where: { userId: TEST_USER_ID } }),
      prisma.project.count({ where: { userId: TEST_USER_ID } }),
      prisma.skill.count({ where: { userId: TEST_USER_ID } }),
      prisma.businessMetric.count({ where: { userId: TEST_USER_ID } }),
    ]);
    expect(cleared).toEqual([0, 0, 0, 0]);

    await importAll(bundle);
    const restored = await Promise.all([
      prisma.project.count({ where: { userId: TEST_USER_ID } }),
      prisma.projectMilestone.count({ where: { project: { userId: TEST_USER_ID } } }),
      prisma.skill.count({ where: { userId: TEST_USER_ID } }),
      prisma.dailyLog.count({ where: { userId: TEST_USER_ID } }),
      prisma.businessMetric.count({ where: { userId: TEST_USER_ID } }),
    ]);
    expect(restored).toEqual([1, 3, 3, 1, 1]);
  });

  it("rejects invalid import payloads and tolerates junk rows", async () => {
    expect((await importAll(null)).ok).toBe(false);
    expect((await importAll("nope")).ok).toBe(false);
    expect((await importAll(42)).ok).toBe(false);
    const res = await importAll({ dailyLogs: [null, "junk", {}] });
    expect(res.ok).toBe(true);
    expect(await prisma.dailyLog.count()).toBe(0);
  });

  it("clear works when everything is empty", async () => {
    const r = await clearAll();
    expect(r.ok).toBe(true);
  });
});