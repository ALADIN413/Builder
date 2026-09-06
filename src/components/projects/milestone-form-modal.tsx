"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { createMilestone, updateMilestone } from "@/actions/projects";
import type { MilestoneStatus } from "@/lib/constants";
import { MILESTONE_STATUSES, MILESTONE_STATUS_LABELS } from "@/lib/constants";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type MilestoneData = {
  id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  targetDate: Date | null;
  completedDate: Date | null;
  evidenceUrl: string | null;
};

export function MilestoneFormModal({
  open,
  onClose,
  projectId,
  milestone,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  milestone?: MilestoneData | null;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={milestone ? "Edit Milestone" : "New Milestone"}
      size="md"
    >
      <FormFields
        key={milestone?.id ?? "__new__"}
        projectId={projectId}
        milestone={milestone ?? null}
        onClose={onClose}
      />
    </Modal>
  );
}

function FormFields({
  projectId,
  milestone,
  onClose,
}: {
  projectId: string;
  milestone: MilestoneData | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [status, setStatus] = useState<MilestoneStatus>(milestone?.status ?? "PLANNED");
  const [targetDate, setTargetDate] = useState(
    milestone?.targetDate ? milestone.targetDate.toISOString().slice(0, 10) : "",
  );
  const [evidenceUrl, setEvidenceUrl] = useState(milestone?.evidenceUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    const payload = {
      title,
      description,
      status,
      targetDate,
      evidenceUrl,
    };
    startTransition(async () => {
      const res = milestone
        ? await updateMilestone(milestone.id, payload)
        : await createMilestone(projectId, payload);
      if (!res.ok) {
        setError(res.error ?? "Failed to save milestone");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="m-title">Title</Label>
        <Input
          id="m-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ship onboarding flow"
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="m-desc">Description</Label>
        <Textarea
          id="m-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="m-status">Status</Label>
          <Select
            id="m-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
          >
            {MILESTONE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {MILESTONE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="m-target">Target date</Label>
          <Input
            id="m-target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="m-ev">Evidence URL</Label>
        <Input
          id="m-ev"
          type="url"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>
      {error ? <p className="text-xs text-bad">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} disabled={isPending}>
          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}