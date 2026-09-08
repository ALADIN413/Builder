"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/date";
import { focusSessionInputSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { safeParse, type ActionResult } from "./helpers";

export async function createFocusSession(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(focusSessionInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();

  const input = parsed.data;
  const date = fromDateKey(input.date);
  const start = new Date(date);
  const end = new Date(date);

  await prisma.focusSession.create({
    data: {
      userId: user.id,
      date,
      startTime: start,
      endTime: new Date(start.getTime() + input.durationMinutes * 60_000),
      durationMinutes: input.durationMinutes,
      objective: input.objective.trim(),
      accomplishment: input.accomplishment?.trim() || null,
      output: input.output?.trim() || null,
      blocker: input.blocker?.trim() || null,
      focusScore: input.focusScore ?? null,
      evidenceUrl: input.evidenceUrl?.trim() || null,
      evidenceType: input.evidenceUrl ? (input.evidenceType ?? "LIVE_PRODUCT") : null,
    },
  });

  const sessions = await prisma.focusSession.findMany({
    where: { userId: user.id, date: { gte: start, lte: end } },
    select: { durationMinutes: true },
  });
  const total = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const existingLog = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });
  const deepWorkMinutes = Math.max(existingLog?.deepWorkMinutes ?? 0, total);

  await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: {
      userId: user.id,
      date,
      deepWorkMinutes,
      primaryObjective: existingLog?.primaryObjective ?? "",
    },
    update: { deepWorkMinutes },
  });

  revalidatePath("/");
  revalidatePath("/focus");
  revalidatePath("/daily");
  revalidatePath("/reviews");
  return { ok: true };
}