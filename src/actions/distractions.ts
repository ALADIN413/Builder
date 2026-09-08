"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/date";
import { distractionInputSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { safeParse, type ActionResult } from "./helpers";

export async function addDistraction(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(distractionInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  const input = parsed.data;
  const date = fromDateKey(input.date);

  await prisma.distraction.create({
    data: {
      userId: user.id,
      date,
      category: input.category,
      minutes: input.minutes,
      note: input.note?.trim() || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/reviews");
  return { ok: true };
}

export async function deleteDistraction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.distraction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/reviews");
  return { ok: true };
}