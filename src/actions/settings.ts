"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toDateKey, fromDateKey } from "@/lib/date";
import { requireUser } from "@/lib/auth";
import { safeParse, type ActionResult } from "./helpers";
import { z } from "zod";

export async function exportAll(): Promise<
  ActionResult<Record<string, unknown>>
> {
  const user = await requireUser();
  const uid = user.id;
  const [
    dailyLogs,
    focusSessions,
    distractions,
    skills,
    skillEvidence,
    projects,
    milestones,
    businessMetrics,
    weeklyReviews,
    monthlyReviews,
    evidence,
  ] = await Promise.all([
    prisma.dailyLog.findMany({ where: { userId: uid } }),
    prisma.focusSession.findMany({ where: { userId: uid } }),
    prisma.distraction.findMany({ where: { userId: uid } }),
    prisma.skill.findMany({ where: { userId: uid } }),
    prisma.skillEvidence.findMany({
      where: { skill: { userId: uid } },
    }),
    prisma.project.findMany({ where: { userId: uid } }),
    prisma.projectMilestone.findMany({
      where: { project: { userId: uid } },
    }),
    prisma.businessMetric.findMany({ where: { userId: uid } }),
    prisma.weeklyReview.findMany({ where: { userId: uid } }),
    prisma.monthlyReview.findMany({ where: { userId: uid } }),
    prisma.evidence.findMany({ where: { userId: uid } }),
  ]);

  return {
    ok: true,
    data: {
      meta: {
        exporter: "founder-os",
        version: 2,
        exportedAt: new Date().toISOString(),
        profile: { name: user.name, emoji: user.emoji },
      },
      dailyLogs,
      focusSessions,
      distractions,
      skills,
      skillEvidence,
      projects,
      milestones,
      businessMetrics,
      weeklyReviews,
      monthlyReviews,
      evidence,
    },
  };
}

export async function clearAll(): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.$transaction([
    prisma.evidence.deleteMany({ where: { userId: user.id } }),
    prisma.skillEvidence.deleteMany({ where: { skill: { userId: user.id } } }),
    prisma.projectMilestone.deleteMany({ where: { project: { userId: user.id } } }),
    prisma.weeklyReview.deleteMany({ where: { userId: user.id } }),
    prisma.monthlyReview.deleteMany({ where: { userId: user.id } }),
    prisma.businessMetric.deleteMany({ where: { userId: user.id } }),
    prisma.distraction.deleteMany({ where: { userId: user.id } }),
    prisma.focusSession.deleteMany({ where: { userId: user.id } }),
    prisma.dailyLog.deleteMany({ where: { userId: user.id } }),
    prisma.project.deleteMany({ where: { userId: user.id } }),
    prisma.skill.deleteMany({ where: { userId: user.id } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

type ImportBundle = {
  dailyLogs?: unknown[];
  focusSessions?: unknown[];
  distractions?: unknown[];
  skills?: unknown[];
  skillEvidence?: unknown[];
  projects?: unknown[];
  milestones?: unknown[];
  businessMetrics?: unknown[];
  weeklyReviews?: unknown[];
  monthlyReviews?: unknown[];
  evidence?: unknown[];
};

export async function importAll(raw: unknown): Promise<ActionResult> {
  const bundle = raw as ImportBundle;
  if (!bundle || typeof bundle !== "object") {
    return { ok: false, error: "Invalid import file" };
  }
  const user = await requireUser();

  await prisma.$transaction(async (tx) => {
    const db = tx as unknown as DbLike;
    for (const step of DELETE_ORDER) {
      await db[step.model].deleteMany({ where: step.where(user.id) });
    }

    const upsertMany = async (model: string, rows: unknown[] | undefined) => {
      if (!Array.isArray(rows)) return;
      const hasUserId = model !== "skillEvidence" && model !== "projectMilestone";
      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        const { id, ...rest } = r;
        if (typeof id !== "string" || id === "") continue;
        try {
          const data = {
            ...rest,
            ...(hasUserId ? { userId: user.id } : {}),
          };
          await db[model as ModelName].upsert({
            where: { id },
            create: { ...data, id },
            update: data,
          });
        } catch {
          // skip rows incompatible with current schema
        }
      }
    };

    await upsertMany("project", bundle.projects);
    await upsertMany("skill", bundle.skills);
    await upsertMany("skillEvidence", bundle.skillEvidence);
    await upsertMany("projectMilestone", bundle.milestones);
    await upsertMany("dailyLog", bundle.dailyLogs);
    await upsertMany("focusSession", bundle.focusSessions);
    await upsertMany("distraction", bundle.distractions);
    await upsertMany("businessMetric", bundle.businessMetrics);
    await upsertMany("weeklyReview", bundle.weeklyReviews);
    await upsertMany("monthlyReview", bundle.monthlyReviews);
    await upsertMany("evidence", bundle.evidence);
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

type ModelName =
  | "evidence"
  | "skillEvidence"
  | "projectMilestone"
  | "weeklyReview"
  | "monthlyReview"
  | "businessMetric"
  | "distraction"
  | "focusSession"
  | "dailyLog"
  | "project"
  | "skill";

type DbRow = Record<string, unknown>;

type DbDeleteWhere = {
  userId?: string;
  skill?: { userId: string };
  project?: { userId: string };
};

type DbLike = Record<
  ModelName,
  {
    deleteMany(args?: { where: DbDeleteWhere }): Promise<{ count: number }>;
    upsert(args: {
      where: { id: string };
      create: DbRow & { id: string };
      update: DbRow;
    }): Promise<unknown>;
  }
>;

type DeleteStep = {
  model: ModelName;
  where: (userId: string) => DbDeleteWhere;
};

const byUser = (userId: string): DbDeleteWhere => ({ userId });
const bySkill = (userId: string): DbDeleteWhere => ({ skill: { userId } });
const byProject = (userId: string): DbDeleteWhere => ({ project: { userId } });

const DELETE_ORDER: DeleteStep[] = [
  { model: "evidence", where: byUser },
  { model: "skillEvidence", where: bySkill },
  { model: "projectMilestone", where: byProject },
  { model: "weeklyReview", where: byUser },
  { model: "monthlyReview", where: byUser },
  { model: "businessMetric", where: byUser },
  { model: "distraction", where: byUser },
  { model: "focusSession", where: byUser },
  { model: "dailyLog", where: byUser },
  { model: "project", where: byUser },
  { model: "skill", where: byUser },
];

export async function seedData(): Promise<ActionResult<{ teamId: string }>> {
  const user = await requireUser();

  const tx = await prisma.$transaction(async (db) => {
    let team = user.teamId
      ? await prisma.team.findUnique({ where: { id: user.teamId } })
      : null;

    if (!team) {
      team = await db.team.create({
        data: { name: "My Team", eodMeetingTime: "17:30", eodMeetingDurationMinutes: 30 },
      });
      await db.user.update({ where: { id: user.id }, data: { teamId: team.id, isHead: true } });
    }

    const members = await db.user.findMany({ where: { teamId: team.id } });

    const teammateSpecs = [
      { name: "Priya", emoji: "👩🏽\u200d💻" },
      { name: "Marcus", emoji: "🧑\u200d💻" },
    ];
    const teammatesNeeded = Math.max(0, 3 - members.length);
    for (let i = 0; i < Math.min(teammatesNeeded, teammateSpecs.length); i++) {
      await db.user.create({ data: { ...teammateSpecs[i], teamId: team.id } });
    }

    // Pull existing teammates too so the sample covers the whole team.
    const teamUsers = await db.user.findMany({
      where: { teamId: team.id },
      orderBy: [{ isHead: "desc" }, { createdAt: "asc" }],
    });

    const today = fromDateKey(toDateKey(new Date()));
    for (let i = 0; i < teamUsers.length; i++) {
      const member = teamUsers[i];
      await db.dailyLog.deleteMany({ where: { userId: member.id, date: today } });
      await db.dailyLog.upsert({
        where: { userId_date: { userId: member.id, date: today } },
        create: {
          userId: member.id,
          date: today,
          primaryObjective: member.isHead
            ? "Coordinate the team's daily output."
            : "Ship today's piece of the team goal.",
          deepWorkMinutes: 45 + i * 15,
          technicalGrowth: 3 + i,
          outputScore: 7 + i,
          businessScore: 5 + i,
          disciplineScore: 6 + i,
          focusScore: 7,
          whatWentWell: member.isHead
            ? "Wrapped up the day's plan and recorded everyone's output."
            : "Finished my milestone and left a clear note for tomorrow.",
        },
        update: {},
      });

      await db.focusSession.deleteMany({ where: { userId: member.id, date: today } });
      await db.focusSession.create({
        data: {
          userId: member.id,
          date: today,
          durationMinutes: 45 + i * 15,
          objective: member.isHead
            ? "Team wrap-up and next-day coordination"
            : "Deep work on today's milestone",
          accomplishment: member.isHead
            ? "Every member's output logged; tomorrow's plan set."
            : "Completed the milestone step and landed the evidence.",
          focusScore: 7,
        },
      });

      await db.distraction.deleteMany({ where: { userId: member.id, date: today } });
      await db.distraction.create({
        data: {
          userId: member.id,
          date: today,
          category: "SOCIAL_MEDIA",
          minutes: 20 + i * 5,
          note: "team channel noise",
        },
      });

      await db.businessMetric.deleteMany({ where: { userId: member.id, date: today } });
      await db.businessMetric.upsert({
        where: { userId_date: { userId: member.id, date: today } },
        create: {
          userId: member.id,
          date: today,
          peopleContacted: 4 + i * 2,
          conversations: 2,
          problemsDiscovered: 1,
          demos: 0,
          trials: 0,
          payingCustomers: 0,
          revenue: 0,
          retention: 0,
        },
        update: {},
      });
    }

    // Head user gets a sample project + skills to populate the other tabs.
    await db.project.deleteMany({ where: { userId: user.id } });
    const project = await db.project.create({
      data: {
        userId: user.id,
        name: "Family Care OS",
        description: "Coordinate aging-parent care as a team.",
        status: "BUILDING",
        primaryObjective: "Run a 2-week build sprint as a tight team.",
        currentMilestone: "Shared daily summary",
        nextAction: "Review everyone's evidence in the wrap-up",
        users: 0,
        revenue: 0,
      },
    });
    await db.projectMilestone.createMany({
      data: [
        {
          projectId: project.id,
          title: "Team profiles live",
          status: "COMPLETED",
          completedDate: today,
        },
        {
          projectId: project.id,
          title: "Daily summary reaches the team",
          status: "IN_PROGRESS",
        },
        {
          projectId: project.id,
          title: "EOD conclusion meeting ritual",
          status: "PLANNED",
        },
      ],
    });

    await db.skill.deleteMany({ where: { userId: user.id } });
    await db.skill.createMany({
      data: [
        { userId: user.id, name: "Product", level: 1, description: null },
        { userId: user.id, name: "Communication", level: 2, description: null },
        { userId: user.id, name: "TypeScript", level: 1, description: null },
      ],
    });

    return team;
  });

  revalidatePath("/", "layout");
  return { ok: true, data: { teamId: tx.id } };
}

const teamMeetingSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal("")),
  eodMeetingTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm"),
  eodMeetingDurationMinutes: z.number().int().min(5).max(180),
});

export async function updateTeamMeeting(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(teamMeetingSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  if (!user.isHead) return { ok: false, error: "Only the team head can change the meeting." };
  if (!user.teamId) return { ok: false, error: "You are not in a team." };
  const input = parsed.data;

  await prisma.team.update({
    where: { id: user.teamId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() || "My Team" } : {}),
      eodMeetingTime: input.eodMeetingTime,
      eodMeetingDurationMinutes: input.eodMeetingDurationMinutes,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/team");
  revalidatePath("/", "layout");
  return { ok: true };
}