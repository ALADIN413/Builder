import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SkillsView } from "@/components/skills/skills-view";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({
    include: { evidence: { orderBy: { createdAt: "desc" } } },
    orderBy: { name: "asc" },
  });

  const dto = skills.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    level: s.level,
    evidence: s.evidence.map((ev) => ({
      id: ev.id,
      title: ev.title,
      type: ev.type,
      url: ev.url,
      description: ev.description,
    })),
  }));

  return (
    <div className="fade-up flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">Skills</h1>
        <p className="text-sm text-faint">
          Demonstrated ability — not time spent studying. Back each level with evidence.
        </p>
      </header>
      <SkillsView skills={dto} />
    </div>
  );
}