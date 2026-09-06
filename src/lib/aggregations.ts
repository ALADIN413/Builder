import { prisma } from "@/lib/prisma";
import { computeFounderScore } from "@/lib/scoring";

export type WeekAggregate = {
  deepWorkSessions: number;
  deepWorkMinutes: number;
  avgFocus: number;
  projectsProgressed: number;
  projectsShipped: number;
  peopleContacted: number;
  customerConversations: number;
  payingCustomers: number;
  revenue: number;
  distractionMinutes: number;
  avgFounderScore: number;
};

const avg = (arr: number[]) =>
  arr.length
    ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
    : 0;

export async function aggregateWeek(start: Date, end: Date): Promise<WeekAggregate> {
  const [sessions, businessRows, distractions, dailyLogs, projects] = await Promise.all([
    prisma.focusSession.findMany({
      where: { date: { gte: start, lte: end } },
      select: { durationMinutes: true, focusScore: true },
    }),
    prisma.businessMetric.findMany({
      where: { date: { gte: start, lte: end } },
    }),
    prisma.distraction.findMany({
      where: { date: { gte: start, lte: end } },
      select: { minutes: true },
    }),
    prisma.dailyLog.findMany({
      where: { date: { gte: start, lte: end } },
    }),
    prisma.project.findMany({
      where: {
        updatedAt: { gte: start, lte: end },
        status: { notIn: ["IDEA", "PAUSED", "KILLED"] },
      },
      select: { id: true, status: true },
    }),
  ]);

  const totalMinutes = sessions.reduce((a, s) => a + s.durationMinutes, 0);
  const focusScores = sessions
    .filter((s) => s.focusScore != null)
    .map((s) => s.focusScore as number);

  const founderScores = dailyLogs.map((d) =>
    computeFounderScore({
      deepWorkMinutes: d.deepWorkMinutes,
      technical: d.technicalGrowth,
      output: d.outputScore,
      business: d.businessScore,
      discipline: d.disciplineScore,
    }).total,
  );

  return {
    deepWorkSessions: sessions.length,
    deepWorkMinutes: totalMinutes,
    avgFocus: avg(focusScores),
    avgFounderScore: avg(founderScores),
    peopleContacted: businessRows.reduce((a, r) => a + r.peopleContacted, 0),
    customerConversations: businessRows.reduce((a, r) => a + r.conversations, 0),
    payingCustomers: businessRows.reduce((a, r) => a + r.payingCustomers, 0),
    revenue: businessRows.reduce((a, r) => a + r.revenue, 0),
    distractionMinutes: distractions.reduce((a, d) => a + d.minutes, 0),
    projectsProgressed: projects.length,
    projectsShipped: projects.filter((p) => p.status === "LAUNCHED").length,
  };
}

export type MonthAggregate = {
  deepWorkMinutes: number;
  outputScore: number;
  technicalCapability: number;
  projectsCount: number;
  users: number;
  customers: number;
  revenue: number;
  customerConversations: number;
  distractionMinutes: number;
  avgFounderScore: number;
};

export async function aggregateMonth(start: Date, end: Date): Promise<MonthAggregate> {
  const [dailyLogs, sessions, businessRows, distractions, projects] = await Promise.all([
    prisma.dailyLog.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.focusSession.findMany({
      where: { date: { gte: start, lte: end } },
      select: { durationMinutes: true },
    }),
    prisma.businessMetric.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.distraction.findMany({
      where: { date: { gte: start, lte: end } },
      select: { minutes: true },
    }),
    prisma.project.findMany(),
  ]);

  const founderScores = dailyLogs.map((d) =>
    computeFounderScore({
      deepWorkMinutes: d.deepWorkMinutes,
      technical: d.technicalGrowth,
      output: d.outputScore,
      business: d.businessScore,
      discipline: d.disciplineScore,
    }).total,
  );

  return {
    deepWorkMinutes: sessions.reduce((a, s) => a + s.durationMinutes, 0),
    outputScore: avg(dailyLogs.map((d) => d.outputScore).filter((v): v is number => v != null)),
    technicalCapability: avg(
      dailyLogs.map((d) => d.technicalGrowth).filter((v): v is number => v != null),
    ),
    avgFounderScore: avg(founderScores),
    projectsCount: projects.filter((p) => p.status !== "KILLED").length,
    users: projects.reduce((a, p) => a + (p.users || 0), 0),
    customers: businessRows.reduce((a, r) => a + r.payingCustomers, 0),
    revenue: businessRows.reduce((a, r) => a + r.revenue, 0),
    customerConversations: businessRows.reduce((a, r) => a + r.conversations, 0),
    distractionMinutes: distractions.reduce((a, d) => a + d.minutes, 0),
  };
}