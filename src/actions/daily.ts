"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fromDateKey, toDateKey } from "@/lib/date";
import { dailyLogInputSchema, primaryObjectiveSchema } from "@/lib/validations";
import { safeParse, type ActionResult } from "./helpers";

function parseNullableScores(input: {
  technicalGrowth?: number | null;
  outputScore?: number | null;
  businessScore?: number | null;
  disciplineScore?: number | null;
  focusScore?: number | null;
}) {
  return {
    technicalGrowth: input.technicalGrowth ?? null,
    outputScore: input.outputScore ?? null,
    businessScore: input.businessScore ?? null,
    disciplineScore: input.disciplineScore ?? null,
    focusScore: input.focusScore ?? null,
  };
}

export async function upsertDailyLog(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(dailyLogInputSchema, raw);
  if (!parsed.ok) return parsed;

  const input = parsed.data;
  const date = fromDateKey(input.date);

  const scores = parseNullableScores(input);

  const data = {
    primaryObjective: (input.primaryObjective ?? "").trim(),
    deepWorkMinutes: Math.max(
      input.deepWorkMinutes,
      await sumSessionMinutes(date),
    ),
    ...scores,
    whatWentWell: input.whatWentWell?.trim() || null,
    whatWentWrong: input.whatWentWrong?.trim() || null,
    whatIAmAvoiding: input.whatIAmAvoiding?.trim() || null,
    highestLeverageNextAction:
      input.highestLeverageNextAction?.trim() || null,
  };

  await prisma.dailyLog.upsert({
    where: { date },
    create: { date, ...data },
    update: data,
  });

  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/reviews");
  return { ok: true };
}

async function sumSessionMinutes(date: Date): Promise<number> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  const sessions = await prisma.focusSession.findMany({
    where: { date: { gte: start, lte: end } },
    select: { durationMinutes: true },
  });
  return sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
}

export async function setPrimaryObjective(
  objectiveRaw: unknown,
  dateRaw: unknown,
): Promise<ActionResult> {
  const parsed = safeParse(primaryObjectiveSchema, objectiveRaw);
  if (!parsed.ok) return parsed;
  const objective = parsed.data.objective.trim();

  const dateKey = typeof dateRaw === "string" ? dateRaw : toDateKey(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return { ok: false, error: "Invalid date" };
  }
  const date = fromDateKey(dateKey);

  await prisma.dailyLog.upsert({
    where: { date },
    create: { date, primaryObjective: objective },
    update: { primaryObjective: objective },
  });

  revalidatePath("/");
  revalidatePath("/daily");
  return { ok: true };
}