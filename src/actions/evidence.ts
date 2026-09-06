"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { evidenceInputSchema } from "@/lib/validations";
import { safeParse, type ActionResult } from "./helpers";

export async function addEvidence(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(evidenceInputSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;

  await prisma.evidence.create({
    data: {
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
  await prisma.evidence.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/skills");
  revalidatePath("/daily");
  return { ok: true };
}