"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { createProject, updateProject } from "@/actions/projects";
import type { ProjectStatus } from "@/lib/constants";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/constants";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type ProjectData = {
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
};

function fmtInput(d: Date | null | string | undefined): string {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return d;
}

export function ProjectFormModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: ProjectData | null;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Edit Project" : "New Project"}
      size="lg"
    >
      <FormFields
        key={project?.id ?? "__new__"}
        project={project ?? null}
        onClose={onClose}
      />
    </Modal>
  );
}

function FormFields({
  project,
  onClose,
}: {
  project: ProjectData | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "IDEA");
  const [startDate, setStartDate] = useState(fmtInput(project?.startDate));
  const [targetDate, setTargetDate] = useState(fmtInput(project?.targetDate));
  const [primaryObjective, setPrimaryObjective] = useState(project?.primaryObjective ?? "");
  const [currentMilestone, setCurrentMilestone] = useState(project?.currentMilestone ?? "");
  const [nextAction, setNextAction] = useState(project?.nextAction ?? "");
  const [users, setUsers] = useState(String(project?.users ?? 0));
  const [revenue, setRevenue] = useState(String(project?.revenue ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    const payload = {
      name,
      description,
      status,
      startDate,
      targetDate,
      primaryObjective,
      currentMilestone,
      nextAction,
      users: Number(users) || 0,
      revenue: Number(revenue) || 0,
    };
    startTransition(async () => {
      const res = project
        ? await updateProject(project.id, payload)
        : await createProject(payload);
      if (!res.ok) {
        setError(res.error ?? "Failed to save project");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Family Care OS"
            autoFocus
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this thing you're building?"
          />
        </div>
        <div>
          <Label htmlFor="p-status">Status</Label>
          <Select
            id="p-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="p-obj">Primary objective</Label>
          <Input
            id="p-obj"
            value={primaryObjective}
            onChange={(e) => setPrimaryObjective(e.target.value)}
            placeholder="What is this project trying to prove?"
          />
        </div>
        <div>
          <Label htmlFor="p-start">Start date</Label>
          <Input
            id="p-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="p-target">Target date</Label>
          <Input
            id="p-target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="p-milestone">Current milestone</Label>
          <Input
            id="p-milestone"
            value={currentMilestone}
            onChange={(e) => setCurrentMilestone(e.target.value)}
            placeholder="What milestone are you currently working on?"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="p-next">Next action</Label>
          <Input
            id="p-next"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="The very next concrete step"
          />
        </div>
        <div>
          <Label htmlFor="p-users">Users</Label>
          <Input
            id="p-users"
            type="number"
            min={0}
            value={users}
            onChange={(e) => setUsers(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="p-rev">Revenue</Label>
          <Input
            id="p-rev"
            type="number"
            min={0}
            step="0.01"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
          />
        </div>
      </div>
      {error ? <p className="mt-3 text-xs text-bad">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} disabled={isPending}>
          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {project ? "Save Changes" : "Create Project"}
        </Button>
      </div>
    </div>
  );
}