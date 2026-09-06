import { prisma } from "@/lib/prisma";
import { fromDateKey, toDateKey, weekStart, weekStartKey } from "@/lib/date";

export type DailyLogRecord = Awaited<
  ReturnType<typeof prisma.dailyLog.findUnique>
>;

export async function getDailyLog(date: Date) {
  const dayStart = fromDateKey(toDateKey(date));
  return prisma.dailyLog.findUnique({ where: { date: dayStart } });
}

export async function getFocusSessionsForDay(date: Date) {
  const dayStart = fromDateKey(toDateKey(date));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return prisma.focusSession.findMany({
    where: { date: { gte: dayStart, lt: dayEnd } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDistractionsForDay(date: Date) {
  const dayStart = fromDateKey(toDateKey(date));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return prisma.distraction.findMany({
    where: { date: { gte: dayStart, lt: dayEnd } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBusinessMetricsForDay(date: Date) {
  const dayStart = fromDateKey(toDateKey(date));
  return prisma.businessMetric.findUnique({ where: { date: dayStart } });
}

export async function getDashboardData(date: Date = new Date()) {
  const dayStart = fromDateKey(toDateKey(date));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [dailyLog, sessions, distractions, recentEvidence] = await Promise.all([
    prisma.dailyLog.findUnique({ where: { date: dayStart } }),
    prisma.focusSession.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.distraction.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.evidence.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const deepWorkMinutes = sessions.reduce((a, s) => a + s.durationMinutes, 0);
  const evidenceToday = recentEvidence; // simplified: recent evidence list

  return {
    dateKey: toDateKey(date),
    dailyLog,
    sessions,
    deepWorkMinutes,
    distractions,
    evidence: evidenceToday,
  };
}

export async function getWeekReviewData(date: Date = new Date()) {
  const start = weekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const [sessions, dailyLogs, distractions, businessRows] = await Promise.all([
    prisma.focusSession.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dailyLog.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    prisma.distraction.findMany({
      where: { date: { gte: start, lt: end } },
    }),
    prisma.businessMetric.findMany({
      where: { date: { gte: start, lt: end } },
    }),
  ]);

  return {
    weekStartKey: weekStartKey(date),
    sessions,
    dailyLogs,
    distractions,
    businessRows,
  };
}

export async function getProjectStats() {
  const projects = await prisma.project.findMany({
    include: {
      milestones: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return projects;
}

export async function getRecentWeekScoreHistory(date: Date, weeks = 8) {
  const rows: { week: string; avg: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = weekStart(date);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const dailyLogs = await prisma.dailyLog.findMany({
      where: { date: { gte: start, lt: end } },
    });
    if (dailyLogs.length > 0) {
      const total = dailyLogs.reduce(
        (acc, d) =>
          acc +
          (d.outputScore ?? 0) +
          (d.technicalGrowth ?? 0) +
          (d.businessScore ?? 0) +
          (d.disciplineScore ?? 0),
        0,
      );
      const deep = dailyLogs.reduce(
        (acc, d) => acc + Math.min(d.deepWorkMinutes / 120, 1) * 10,
        0,
      );
      rows.push({
        week: toDateKey(start),
        avg:
          Math.round(((total + deep) / dailyLogs.length) * 10) / 10,
      });
    }
  }
  return rows;
}