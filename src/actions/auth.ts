"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import { safeParse, type ActionResult } from "./helpers";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40, "Name too long"),
  emoji: z.string().trim().max(8).default("👤"),
});

export async function selectProfile(userId: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Profile not found" };
  await setSession(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createProfile(raw: unknown): Promise<ActionResult> {
  const parsed = safeParse(profileSchema, raw);
  if (!parsed.ok) return parsed;
  const input = parsed.data;

  const teamCount = await prisma.team.count();
  let teamId: string | null = null;
  let isHead = false;

  if (teamCount === 0) {
    const team = await prisma.team.create({ data: {} });
    teamId = team.id;
    isHead = true;
  } else {
    const first = await prisma.team.findFirst({ select: { id: true } });
    teamId = first?.id ?? null;
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      emoji: input.emoji || "👤",
      teamId,
      isHead,
    },
  });

  await setSession(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

async function setSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}