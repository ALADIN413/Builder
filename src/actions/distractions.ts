"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/date";
import { distractionInputSchema } from "@/lib/validations";
import { safeParse, type ActionResult } from "./helpers";

export async function addDistraction(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(distractionInputSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;
  const date = fromDateKey(input.date);

  await prisma.distraction.create({
    data: {
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
  await prisma.distraction.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/reviews");
  return { ok: true };
}