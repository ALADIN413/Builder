"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fromDateKey, weekEnd } from "@/lib/date";
import { weeklyReviewInputSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { safeParse, type ActionResult } from "./helpers";
import { aggregateMonth, aggregateWeek } from "@/lib/aggregations";

export async function saveWeeklyReview(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(weeklyReviewInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  const input = parsed.data;

  const start = fromDateKey(input.weekStartDate);
  const end = weekEnd(start);
  const agg = await aggregateWeek(start, end, user.id);

  const data = {
    weekStartDate: start,
    deepWorkSessions: agg.deepWorkSessions,
    deepWorkMinutes: agg.deepWorkMinutes,
    avgFocus: agg.avgFocus,
    projectsProgressed: agg.projectsProgressed,
    projectsShipped: agg.projectsShipped,
    peopleContacted: agg.peopleContacted,
    customerConversations: agg.customerConversations,
    payingCustomers: agg.payingCustomers,
    revenue: agg.revenue,
    distractionMinutes: agg.distractionMinutes,
    avgFounderScore: agg.avgFounderScore,
    accomplished: input.accomplished?.trim() || null,
    notAccomplished: input.notAccomplished?.trim() || null,
    avoiding: input.avoiding?.trim() || null,
    wastedTime: input.wastedTime?.trim() || null,
    mostLeverage: input.mostLeverage?.trim() || null,
    stopDoing: input.stopDoing?.trim() || null,
    startDoing: input.startDoing?.trim() || null,
    nextObjective: input.nextObjective?.trim() || null,
  };

  await prisma.weeklyReview.upsert({
    where: { userId_weekStartDate: { userId: user.id, weekStartDate: start } },
    create: { userId: user.id, ...data },
    update: data,
  });

  revalidatePath("/reviews");
  return { ok: true };
}

export async function computeMonthlyReview(
  monthRaw: unknown,
): Promise<ActionResult<Record<string, number> | undefined>> {
  const month = String(monthRaw);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return { ok: false, error: "Invalid month" };
  }
  const [y, m] = month.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
    return { ok: false, error: "Invalid month" };
  }
  const user = await requireUser();
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const agg = await aggregateMonth(start, end, user.id);

  await prisma.monthlyReview.upsert({
    where: { userId_month: { userId: user.id, month } },
    create: {
      userId: user.id,
      month,
      deepWorkMinutes: agg.deepWorkMinutes,
      outputScore: agg.outputScore,
      technicalCapability: agg.technicalCapability,
      projectsCount: agg.projectsCount,
      users: agg.users,
      customers: agg.customers,
      revenue: agg.revenue,
      customerConversations: agg.customerConversations,
      distractionMinutes: agg.distractionMinutes,
      avgFounderScore: agg.avgFounderScore,
    },
    update: {
      deepWorkMinutes: agg.deepWorkMinutes,
      outputScore: agg.outputScore,
      technicalCapability: agg.technicalCapability,
      projectsCount: agg.projectsCount,
      users: agg.users,
      customers: agg.customers,
      revenue: agg.revenue,
      customerConversations: agg.customerConversations,
      distractionMinutes: agg.distractionMinutes,
      avgFounderScore: agg.avgFounderScore,
    },
  });

  revalidatePath("/reviews");
  return { ok: true };
}