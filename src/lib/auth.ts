import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";

export type AuthUser = NonNullable<Awaited<ReturnType<typeof findUser>>>;

async function findUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { team: true },
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return findUser(id);
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export type ViewerUser = { id: string; name: string; emoji: string };

/**
 * Resolve which user a page should display data for.
 * Defaults to the signed-in user; honors `?view=<userId>` for teammates.
 */
export async function resolveViewer(
  searchParams: { view?: string },
  current: AuthUser,
): Promise<{ user: ViewerUser; isSelf: boolean }> {
  const viewId = searchParams.view;
  if (viewId && viewId !== current.id) {
    const member = current.team
      ? await prisma.user.findFirst({
          where: { id: viewId, teamId: current.team.id },
          select: { id: true, name: true, emoji: true },
        })
      : null;
    if (member) return { user: member, isSelf: false };
  }
  return { user: { id: current.id, name: current.name, emoji: current.emoji }, isSelf: true };
}