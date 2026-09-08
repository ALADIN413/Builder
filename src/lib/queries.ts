import { prisma } from "@/lib/prisma";
import { fromDateKey, toDateKey, weekStart, weekStartKey } from "@/lib/date";

export type DailyLogRecord = Awaited<
  ReturnType<typeof prisma.dailyLog.findUnique>
>;

export async function getDailyLog(userId: string, date: Date) {
  const dayStart = fromDateKey(toDateKey(date));
  return prisma.dailyLog.findUnique({
    where: { userId_date: { userId, date: dayStart } },
  });
}

export async function getFocusSessionsForDay(userId: string, date: Date) {
  const dayStart = fromDateKey(toDateKey(date));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return prisma.focusSession.findMany({
    where: { userId, date: { gte: dayStart, lt: dayEnd } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDistractionsForDay(userId: string, date: Date) {
  const dayStart = fromDateKey(toDateKey(date));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return prisma.distraction.findMany({
    where: { userId, date: { gte: dayStart, lt: dayEnd } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBusinessMetricsForDay(userId: string, date: Date) {
  const dayStart = fromDateKey(toDateKey(date));
  return prisma.businessMetric.findUnique({
    where: { userId_date: { userId, date: dayStart } },
  });
}

export async function getDashboardData(userId: string, date: Date = new Date()) {
  const dayStart = fromDateKey(toDateKey(date));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [dailyLog, sessions, distractions, recentEvidence] = await Promise.all([
    prisma.dailyLog.findUnique({
      where: { userId_date: { userId, date: dayStart } },
    }),
    prisma.focusSession.findMany({
      where: { userId, date: { gte: dayStart, lt: dayEnd } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.distraction.findMany({
      where: { userId, date: { gte: dayStart, lt: dayEnd } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.evidence.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const deepWorkMinutes = sessions.reduce((a, s) => a + s.durationMinutes, 0);

  return {
    dateKey: toDateKey(date),
    dailyLog,
    sessions,
    deepWorkMinutes,
    distractions,
    evidence: recentEvidence,
  };
}

export async function getWeekReviewData(userId: string, date: Date = new Date()) {
  const start = weekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const [sessions, dailyLogs, distractions, businessRows] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    prisma.distraction.findMany({
      where: { userId, date: { gte: start, lt: end } },
    }),
    prisma.businessMetric.findMany({
      where: { userId, date: { gte: start, lt: end } },
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

export async function getProjectStats(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    include: {
      milestones: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return projects;
}

export async function getSkillsWithEvidence(userId: string) {
  return prisma.skill.findMany({
    where: { userId },
    include: { evidence: { orderBy: { createdAt: "desc" } } },
    orderBy: { name: "asc" },
  });
}

export async function getRecentWeekScoreHistory(
  userId: string,
  date: Date,
  weeks = 8,
) {
  const rows: { week: string; avg: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = weekStart(date);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
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
        avg: Math.round(((total + deep) / dailyLogs.length) * 10) / 10,
      });
    }
  }
  return rows;
}

export type MemberTodayDigest = {
  user: { id: string; name: string; emoji: string; isHead: boolean };
  dailyLog: DailyLogRecord;
  deepWorkMinutes: number;
  sessionCount: number;
  distractionMinutes: number;
  outputs: { id: string; text: string }[];
  peopleContacted: number;
  customerConversations: number;
  revenue: number;
  evidenceCount: number;
};

export async function getMemberTodayDigest(
  userId: string,
  date: Date = new Date(),
): Promise<MemberTodayDigest> {
  const dayStart = fromDateKey(toDateKey(date));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [user, dailyLog, sessions, distractions, metrics, evidenceCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, emoji: true, isHead: true },
      }),
      prisma.dailyLog.findUnique({
        where: { userId_date: { userId, date: dayStart } },
      }),
      prisma.focusSession.findMany({
        where: { userId, date: { gte: dayStart, lt: dayEnd } },
        select: { id: true, durationMinutes: true, accomplishment: true, output: true, objective: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.distraction.findMany({
        where: { userId, date: { gte: dayStart, lt: dayEnd } },
        select: { minutes: true },
      }),
      prisma.businessMetric.findUnique({
        where: { userId_date: { userId, date: dayStart } },
      }),
      prisma.evidence.count({ where: { userId } }),
    ]);

  if (!user) throw new Error("Member not found");

  const outputs = sessions
    .flatMap((s) => {
      const items: { id: string; text: string }[] = [];
      if (s.accomplishment) items.push({ id: s.id, text: s.accomplishment });
      if (s.output) items.push({ id: `${s.id}-o`, text: s.output });
      return items;
    })
    .slice(0, 5);

  return {
    user,
    dailyLog,
    deepWorkMinutes: sessions.reduce((a, s) => a + s.durationMinutes, 0),
    sessionCount: sessions.length,
    distractionMinutes: distractions.reduce((a, d) => a + d.minutes, 0),
    outputs,
    peopleContacted: metrics?.peopleContacted ?? 0,
    customerConversations: metrics?.conversations ?? 0,
    revenue: metrics?.revenue ?? 0,
    evidenceCount,
  };
}

export async function getTeamMembers(teamId: string) {
  return prisma.user.findMany({
    where: { teamId },
    orderBy: [{ isHead: "desc" }, { createdAt: "asc" }],
    select: { id: true, name: true, emoji: true, isHead: true, createdAt: true },
  });
}

export type MeetingInfo = {
  name: string;
  eodMeetingTime: string;
  eodMeetingDurationMinutes: number;
};

export async function getTeamDirectory(user: {
  teamId: string | null;
}): Promise<{ members: Awaited<ReturnType<typeof getTeamMembers>>; meeting: MeetingInfo | null }> {
  if (!user.teamId) return { members: [], meeting: null };
  const [members, team] = await Promise.all([
    getTeamMembers(user.teamId),
    prisma.team.findUnique({
      where: { id: user.teamId },
      select: { name: true, eodMeetingTime: true, eodMeetingDurationMinutes: true },
    }),
  ]);
  return { members, meeting: team };
}