import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser, resolveViewer } from "@/lib/auth";
import { ProjectsView } from "@/components/projects/projects-view";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const current = await requireUser();
  const { user, isSelf } = await resolveViewer(await searchParams, current);

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      milestones: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const dto = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    startDate: p.startDate,
    targetDate: p.targetDate,
    primaryObjective: p.primaryObjective,
    currentMilestone: p.currentMilestone,
    nextAction: p.nextAction,
    users: p.users,
    revenue: p.revenue,
    milestones: p.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      status: m.status,
      targetDate: m.targetDate,
      completedDate: m.completedDate,
      evidenceUrl: m.evidenceUrl,
    })),
  }));

  return (
    <div className="fade-up flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">Projects</h1>
        <p className="text-sm text-faint">
          The things you&apos;re actually building. Complete the next milestone.
        </p>
      </header>
      <ProjectsView projects={dto} readOnly={!isSelf} />
    </div>
  );
}