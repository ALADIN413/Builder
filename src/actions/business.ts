"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/date";
import { businessMetricInputSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { safeParse, type ActionResult } from "./helpers";

export async function upsertBusinessMetric(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(businessMetricInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  const input = parsed.data;
  const date = fromDateKey(input.date);

  const data = {
    peopleContacted: input.peopleContacted,
    conversations: input.conversations,
    problemsDiscovered: input.problemsDiscovered,
    demos: input.demos,
    trials: input.trials,
    payingCustomers: input.payingCustomers,
    revenue: input.revenue,
    retention: input.retention,
  };

  await prisma.businessMetric.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, ...data },
    update: data,
  });

  revalidatePath("/business");
  revalidatePath("/reviews");
  return { ok: true };
}

export async function deleteBusinessMetric(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.businessMetric.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/business");
  revalidatePath("/reviews");
  return { ok: true };
}