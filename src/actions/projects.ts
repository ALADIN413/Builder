"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  milestoneInputSchema,
  projectInputSchema,
  projectStatusSchema,
} from "@/lib/validations";
import { dateFromForm, safeParse, type ActionResult } from "./helpers";

export async function createProject(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = safeParse(projectInputSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;

  const project = await prisma.project.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      startDate: dateFromForm(input.startDate),
      targetDate: dateFromForm(input.targetDate),
      primaryObjective: input.primaryObjective?.trim() || null,
      currentMilestone: input.currentMilestone?.trim() || null,
      nextAction: input.nextAction?.trim() || null,
      users: input.users,
      revenue: input.revenue,
    },
  });

  revalidatePath("/projects");
  return { ok: true, data: { id: project.id } };
}

export async function updateProject(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(projectInputSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;

  await prisma.project.update({
    where: { id },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      startDate: dateFromForm(input.startDate),
      targetDate: dateFromForm(input.targetDate),
      primaryObjective: input.primaryObjective?.trim() || null,
      currentMilestone: input.currentMilestone?.trim() || null,
      nextAction: input.nextAction?.trim() || null,
      users: input.users,
      revenue: input.revenue,
    },
  });

  revalidatePath("/projects");
  return { ok: true };
}

export async function updateProjectStatus(id: string, statusRaw: unknown): Promise<ActionResult> {
  const parsed = safeParse(projectStatusSchema, { status: statusRaw });
  if (!parsed.ok) return parsed;
  await prisma.project.update({ where: { id }, data: { status: parsed.data.status } });
  revalidatePath("/projects");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/reviews");
  return { ok: true };
}

export async function createMilestone(projectId: string, raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(milestoneInputSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;

  await prisma.projectMilestone.create({
    data: {
      projectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      targetDate: dateFromForm(input.targetDate),
      completedDate: dateFromForm(input.completedDate),
      evidenceUrl: input.evidenceUrl?.trim() || null,
    },
  });

  revalidatePath("/projects");
  return { ok: true };
}

export async function updateMilestone(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(milestoneInputSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;

  const completedDate =
    input.status === "COMPLETED"
      ? (dateFromForm(input.completedDate) ?? new Date())
      : null;

  await prisma.projectMilestone.update({
    where: { id },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      targetDate: dateFromForm(input.targetDate),
      completedDate,
      evidenceUrl: input.evidenceUrl?.trim() || null,
    },
  });

  revalidatePath("/projects");
  return { ok: true };
}

export async function deleteMilestone(id: string): Promise<ActionResult> {
  await prisma.projectMilestone.delete({ where: { id } });
  revalidatePath("/projects");
  return { ok: true };
}