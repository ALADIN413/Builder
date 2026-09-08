"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { skillEvidenceInputSchema, skillInputSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { safeParse, type ActionResult } from "./helpers";

export async function createSkill(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = safeParse(skillInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  const input = parsed.data;

  const skill = await prisma.skill.create({
    data: {
      userId: user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      level: input.level,
    },
  });

  revalidatePath("/skills");
  return { ok: true, data: { id: skill.id } };
}

export async function updateSkill(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(skillInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  if (!(await ownsSkill(user.id, id))) return { ok: false, error: "Skill not found" };
  const input = parsed.data;

  await prisma.skill.update({
    where: { id },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      level: input.level,
    },
  });

  revalidatePath("/skills");
  return { ok: true };
}

export async function setSkillLevel(id: string, levelRaw: unknown): Promise<ActionResult> {
  const level = Number(levelRaw);
  if (!Number.isInteger(level) || level < 0 || level > 6) {
    return { ok: false, error: "Level must be between 0 and 6" };
  }
  const user = await requireUser();
  if (!(await ownsSkill(user.id, id))) return { ok: false, error: "Skill not found" };
  await prisma.skill.update({ where: { id }, data: { level } });
  revalidatePath("/skills");
  return { ok: true };
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await ownsSkill(user.id, id))) return { ok: false, error: "Skill not found" };
  await prisma.skill.delete({ where: { id } });
  revalidatePath("/skills");
  return { ok: true };
}

export async function addSkillEvidence(skillId: string, raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(skillEvidenceInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  if (!(await ownsSkill(user.id, skillId))) return { ok: false, error: "Skill not found" };
  const input = parsed.data;

  await prisma.skillEvidence.create({
    data: {
      skillId,
      title: input.title.trim(),
      type: input.type,
      url: input.url.trim(),
      description: input.description?.trim() || null,
    },
  });

  revalidatePath("/skills");
  return { ok: true };
}

export async function deleteSkillEvidence(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const evidence = await prisma.skillEvidence.findFirst({
    where: { id, skill: { userId: user.id } },
    select: { id: true },
  });
  if (!evidence) return { ok: false, error: "Evidence not found" };
  await prisma.skillEvidence.delete({ where: { id } });
  revalidatePath("/skills");
  return { ok: true };
}

async function ownsSkill(userId: string, skillId: string): Promise<boolean> {
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, userId },
    select: { id: true },
  });
  return skill !== null;
}