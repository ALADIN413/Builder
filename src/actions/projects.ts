"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  milestoneInputSchema,
  projectInputSchema,
  projectStatusSchema,
} from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { dateFromForm, safeParse, type ActionResult } from "./helpers";

export async function createProject(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = safeParse(projectInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  const input = parsed.data;

  const project = await prisma.project.create({
    data: {
      userId: user.id,
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
  const user = await requireUser();
  if (!(await ownsProject(user.id, id))) return { ok: false, error: "Project not found" };
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
  const user = await requireUser();
  if (!(await ownsProject(user.id, id))) return { ok: false, error: "Project not found" };
  await prisma.project.update({ where: { id }, data: { status: parsed.data.status } });
  revalidatePath("/projects");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await ownsProject(user.id, id))) return { ok: false, error: "Project not found" };
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/reviews");
  return { ok: true };
}

export async function createMilestone(projectId: string, raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(milestoneInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  if (!(await ownsProject(user.id, projectId))) return { ok: false, error: "Project not found" };
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
  const user = await requireUser();
  if (!(await ownsMilestone(user.id, id))) return { ok: false, error: "Milestone not found" };
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
  const user = await requireUser();
  if (!(await ownsMilestone(user.id, id))) return { ok: false, error: "Milestone not found" };
  await prisma.projectMilestone.delete({ where: { id } });
  revalidatePath("/projects");
  return { ok: true };
}

async function ownsProject(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return project !== null;
}

async function ownsMilestone(userId: string, milestoneId: string): Promise<boolean> {
  const milestone = await prisma.projectMilestone.findFirst({
    where: { id: milestoneId, project: { userId } },
    select: { id: true },
  });
  return milestone !== null;
}