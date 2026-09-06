"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/date";
import { businessMetricInputSchema } from "@/lib/validations";
import { safeParse, type ActionResult } from "./helpers";

export async function upsertBusinessMetric(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(businessMetricInputSchema, raw);
  if (!parsed.ok) return parsed;
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
    where: { date },
    create: { date, ...data },
    update: data,
  });

  revalidatePath("/business");
  revalidatePath("/reviews");
  return { ok: true };
}

export async function deleteBusinessMetric(id: string): Promise<ActionResult> {
  await prisma.businessMetric.delete({ where: { id } });
  revalidatePath("/business");
  revalidatePath("/reviews");
  return { ok: true };
}