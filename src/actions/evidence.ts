"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { evidenceInputSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { safeParse, type ActionResult } from "./helpers";

export async function addEvidence(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(evidenceInputSchema, raw);
  if (!parsed.ok) return parsed;
  const user = await requireUser();
  const input = parsed.data;

  await prisma.evidence.create({
    data: {
      userId: user.id,
      title: input.title.trim(),
      type: input.type,
      url: input.url.trim(),
      description: input.description?.trim() || null,
      relatedType: input.relatedType?.trim() || null,
      relatedId: input.relatedId?.trim() || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/skills");
  revalidatePath("/daily");
  return { ok: true };
}

export async function deleteEvidence(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.evidence.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/skills");
  revalidatePath("/daily");
  return { ok: true };
}