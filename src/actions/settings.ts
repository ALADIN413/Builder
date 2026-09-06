"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/date";
import type { ActionResult } from "./helpers";

export async function exportAll(): Promise<
  ActionResult<Record<string, unknown>>
> {
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
    prisma.dailyLog.findMany(),
    prisma.focusSession.findMany(),
    prisma.distraction.findMany(),
    prisma.skill.findMany(),
    prisma.skillEvidence.findMany(),
    prisma.project.findMany(),
    prisma.projectMilestone.findMany(),
    prisma.businessMetric.findMany(),
    prisma.weeklyReview.findMany(),
    prisma.monthlyReview.findMany(),
    prisma.evidence.findMany(),
  ]);

  return {
    ok: true,
    data: {
      meta: { exporter: "founder-os", version: 1, exportedAt: new Date().toISOString() },
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

type DbLike = Record<
  ModelName,
  {
    deleteMany(): Promise<{ count: number }>;
    upsert(args: {
      where: { id: string };
      create: DbRow & { id: string };
      update: DbRow;
    }): Promise<unknown>;
  }
>;

const DELETE_ORDER: ModelName[] = [
  "evidence",
  "skillEvidence",
  "projectMilestone",
  "weeklyReview",
  "monthlyReview",
  "businessMetric",
  "distraction",
  "focusSession",
  "dailyLog",
];

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

  await prisma.$transaction(async (tx) => {
    const db = tx as unknown as DbLike;
    for (const model of DELETE_ORDER) {
      await db[model].deleteMany();
    }

    const upsertMany = async (model: string, rows: unknown[] | undefined) => {
      if (!Array.isArray(rows)) return;
      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        const { id, ...rest } = r;
        if (typeof id !== "string" || id === "") continue;
        try {
          await db[model as ModelName].upsert({
            where: { id },
            create: { ...rest, id },
            update: rest,
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

export async function seedData(): Promise<
  ActionResult<{ dayKey: string; before: string }>
> {
  const today = new Date();
  const dayKey = toDateKey(today);
  const before = toDateKey(new Date(today.getTime() - 86_400_000));

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: "Family Care OS",
        description:
          "Validate whether working adults struggle with fragmented aging-parent care coordination.",
        status: "RESEARCH",
        startDate: new Date(today.getTime() - 14_000_000 * 60),
        primaryObjective:
          "Validate whether working adults struggle with fragmented aging-parent care coordination.",
        currentMilestone: "Customer interviews",
        nextAction: "Book 2 more customer interviews",
        users: 0,
        revenue: 0,
      },
    });

    await tx.projectMilestone.createMany({
      data: [
        {
          projectId: project.id,
          title: "Conduct 5 customer interviews",
          description: "Talk to working adults coordinating care for aging parents.",
          status: "COMPLETED",
          completedDate: new Date(today.getTime() - 3_600_000 * 24 * 3),
        },
        {
          projectId: project.id,
          title: "Build initial care timeline prototype",
          description: "Minimal prototype to test the coordination flow.",
          status: "COMPLETED",
          completedDate: new Date(today.getTime() - 3_600_000 * 24 * 2),
        },
        {
          projectId: project.id,
          title: "Book 10 interviews total",
          status: "PLANNED",
        },
      ],
    });

    await tx.skill.createMany({
      data: [
        { name: "Python", level: 2 },
        { name: "TypeScript", level: 1 },
        { name: "React", level: 1 },
        { name: "Backend", level: 1 },
        { name: "Databases", level: 0 },
        { name: "AI Engineering", level: 0 },
        { name: "Cloud", level: 0 },
        { name: "System Design", level: 0 },
        { name: "Product", level: 1 },
        { name: "Sales", level: 0 },
        { name: "Marketing", level: 0 },
        { name: "Communication", level: 1 },
        { name: "Leadership", level: 0 },
      ].map((s) => ({ ...s, description: null })),
    });

    await tx.dailyLog.createMany({
      data: [
        {
          date: new Date(today.getTime() - 3_600_000 * 24),
          primaryObjective: "Conduct 3 customer interviews",
          deepWorkMinutes: 90,
          technicalGrowth: 2,
          outputScore: 8,
          businessScore: 7,
          disciplineScore: 8,
          focusScore: 7,
          whatWentWell: "Conducted 3 interviews; found a strong coordination pain point.",
          whatWentWrong: "Underestimated time to transcribe calls.",
          whatIAmAvoiding: "Writing the validation summary doc.",
          highestLeverageNextAction: "Write the validation summary.",
        },
        {
          date: today,
          primaryObjective: "Build document upload API for Care OS.",
          deepWorkMinutes: 0,
          technicalGrowth: null,
          outputScore: null,
          businessScore: null,
          disciplineScore: null,
          focusScore: null,
          whatWentWell: "",
          whatWentWrong: "",
          whatIAmAvoiding: "",
          highestLeverageNextAction: "",
        },
      ],
    });

    await tx.businessMetric.createMany({
      data: [
        {
          date: new Date(today.getTime() - 3_600_000 * 24),
          peopleContacted: 15,
          conversations: 5,
          problemsDiscovered: 3,
          demos: 1,
          trials: 0,
          payingCustomers: 0,
          revenue: 0,
          retention: 0,
        },
        {
          date: today,
          peopleContacted: 0,
          conversations: 0,
          problemsDiscovered: 0,
          demos: 0,
          trials: 0,
          payingCustomers: 0,
          revenue: 0,
          retention: 0,
        },
      ],
    });
  });

  revalidatePath("/", "layout");
  return { ok: true, data: { dayKey, before } };
}