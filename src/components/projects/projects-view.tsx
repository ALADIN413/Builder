"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Milestone as MilestoneIcon,
  GitBranch,
  Calendar,
} from "lucide-react";
import {
  deleteMilestone,
  deleteProject,
  updateProjectStatus,
} from "@/actions/projects";
import type { ProjectStatus, MilestoneStatus } from "@/lib/constants";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
} from "@/lib/constants";
import { formatShort } from "@/lib/date";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFormModal } from "./project-form-modal";
import { MilestoneFormModal } from "./milestone-form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";

export type ProjectDTO = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  targetDate: Date | null;
  primaryObjective: string | null;
  currentMilestone: string | null;
  nextAction: string | null;
  users: number;
  revenue: number;
  milestones: {
    id: string;
    title: string;
    description: string | null;
    status: MilestoneStatus;
    targetDate: Date | null;
    completedDate: Date | null;
    evidenceUrl: string | null;
  }[];
};

const STATUS_TONE: Record<ProjectStatus, "neutral" | "info" | "accent" | "good" | "bad"> = {
  IDEA: "neutral",
  RESEARCH: "info",
  BUILDING: "accent",
  TESTING: "info",
  LAUNCHED: "good",
  GROWING: "good",
  PAUSED: "neutral",
  KILLED: "bad",
};

const M_TONE: Record<MilestoneStatus, "neutral" | "info" | "accent" | "good" | "bad"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "accent",
  COMPLETED: "good",
  BLOCKED: "bad",
};

export function ProjectsView({ projects }: { projects: ProjectDTO[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDTO | null>(null);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectDTO["milestones"][number] | null>(null);
  const [milestoneProjectId, setMilestoneProjectId] = useState("");
  const [confirm, setConfirm] = useState<null | {
    kind: "project" | "milestone";
    id: string;
    title: string;
  }>(null);
  const [, startTransition] = useTransition();

  function openCreate() {
    setEditingProject(null);
    setFormOpen(true);
  }

  function openEdit(p: ProjectDTO) {
    setEditingProject(p);
    setFormOpen(true);
  }

  function openNewMilestone(projectId: string) {
    setEditingMilestone(null);
    setMilestoneProjectId(projectId);
    setMilestoneOpen(true);
  }

  function openEditMilestone(p: ProjectDTO, m: ProjectDTO["milestones"][number]) {
    setMilestoneProjectId(p.id);
    setEditingMilestone(m);
    setMilestoneOpen(true);
  }

  function changeStatus(id: string, status: ProjectStatus) {
    startTransition(() => {
      void updateProjectStatus(id, status).then(() => router.refresh());
    });
  }

  function doDelete(
    kind: "project" | "milestone",
    id: string,
  ) {
    startTransition(async () => {
      if (kind === "project") await deleteProject(id);
      else await deleteMilestone(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-faint">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </p>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-5 w-5" />}
          title="Nothing here yet."
          hint="Create the thing you're actually trying to build."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              Create your first project
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((p) => {
            const isOpen = expanded === p.id;
            const completedMilestones = p.milestones.filter((m) => m.status === "COMPLETED").length;
            const isDead = p.status === "KILLED" || p.status === "PAUSED";
            return (
              <li
                key={p.id}
                className={cn(
                  "overflow-hidden rounded-lg border bg-surface transition-colors",
                  isDead ? "border-line opacity-60" : "border-border",
                )}
              >
                <div
                  className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  <button
                    type="button"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    className="text-faint"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{p.name}</p>
                    {p.nextAction ? (
                      <p className="truncate text-xs text-muted">
                        Next: {p.nextAction}
                      </p>
                    ) : null}
                  </div>
                  {p.milestones.length > 0 ? (
                    <span className="hidden font-mono text-[11px] text-faint tabular sm:inline">
                      {completedMilestones}/{p.milestones.length} ms
                    </span>
                  ) : null}
                  <Badge tone={STATUS_TONE[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
                </div>

                {isOpen ? (
                  <div className="border-t border-line px-4 py-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
                      <div className="flex flex-col gap-4">
                        {p.description ? (
                          <p className="text-sm text-muted">{p.description}</p>
                        ) : null}
                        {p.primaryObjective ? (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-faint">
                              Objective
                            </p>
                            <p className="text-sm text-text">{p.primaryObjective}</p>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-4">
                          <Meta label="Status">
                            <Select
                              value={p.status}
                              onChange={(e) => changeStatus(p.id, e.target.value as ProjectStatus)}
                              className="h-8 w-auto text-xs"
                            >
                              {PROJECT_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {PROJECT_STATUS_LABELS[s]}
                                </option>
                              ))}
                            </Select>
                          </Meta>
                          <Meta label="Users">{String(p.users)}</Meta>
                          <Meta label="Revenue">${p.revenue.toFixed(0)}</Meta>
                          {p.targetDate ? (
                            <Meta label="Target">
                              <Calendar className="mr-1 inline h-3 w-3" />
                              {formatShort(p.targetDate)}
                            </Meta>
                          ) : null}
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-[11px] uppercase tracking-wider text-faint">
                              Milestones
                            </p>
                            <Button variant="ghost" size="sm" onClick={() => openNewMilestone(p.id)}>
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          </div>
                          {p.milestones.length === 0 ? (
                            <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-faint">
                              No milestones yet. Break the project into prove-it steps.
                            </p>
                          ) : (
                            <ul className="flex flex-col gap-2">
                              {p.milestones.map((m) => (
                                <li
                                  key={m.id}
                                  className="flex items-center gap-3 rounded-md border border-line bg-surface-2 px-3 py-2.5"
                                >
                                  <MilestoneIcon
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0",
                                      m.status === "COMPLETED" ? "text-good" : "text-faint",
                                    )}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={cn(
                                        "text-sm",
                                        m.status === "COMPLETED" ? "text-muted line-through" : "text-text",
                                      )}
                                    >
                                      {m.title}
                                    </p>
                                    {m.targetDate ? (
                                      <p className="font-mono text-[10px] text-faint tabular">
                                        {formatShort(m.targetDate)}
                                      </p>
                                    ) : null}
                                  </div>
                                  <Badge tone={M_TONE[m.status]}>
                                    {MILESTONE_STATUS_LABELS[m.status]}
                                  </Badge>
                                  <button
                                    type="button"
                                    onClick={() => openEditMilestone(p, m)}
                                    aria-label="Edit milestone"
                                    className="rounded p-1 text-faint transition-colors hover:bg-surface-3 hover:text-text"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirm({ kind: "milestone", id: m.id, title: m.title })
                                    }
                                    aria-label="Delete milestone"
                                    className="rounded p-1 text-faint transition-colors hover:bg-bad/20 hover:text-bad"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setConfirm({ kind: "project", id: p.id, title: p.name })
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                        {p.currentMilestone ? (
                          <div className="rounded-md border border-accent/25 bg-accent/5 px-3 py-2.5">
                            <p className="text-[11px] uppercase tracking-wider text-accent">
                              Current Milestone
                            </p>
                            <p className="mt-0.5 text-sm text-text">{p.currentMilestone}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        project={editingProject}
      />
      <MilestoneFormModal
        open={milestoneOpen}
        onClose={() => setMilestoneOpen(false)}
        projectId={milestoneProjectId}
        milestone={editingMilestone}
      />
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "project" ? "Delete project" : "Delete milestone"}
        message={
          confirm?.kind === "project"
            ? `"${confirm?.title}" and all its milestones will be gone. This cannot be undone.`
            : `Delete milestone "${confirm?.title}"?`
        }
        onConfirm={() => {
          if (!confirm) return;
          doDelete(confirm.kind, confirm.id);
        }}
      />
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-faint">{label}</p>
      <p className="text-sm text-text">{children}</p>
    </div>
  );
}