"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Link2,
  LoaderCircle,
  Boxes,
} from "lucide-react";
import {
  addSkillEvidence,
  createSkill,
  deleteSkill,
  deleteSkillEvidence,
  updateSkill,
} from "@/actions/skills";
import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS, SKILL_LEVELS } from "@/lib/constants";
import type { EvidenceType } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export type SkillDTO = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  evidence: {
    id: string;
    title: string;
    type: EvidenceType;
    url: string;
    description: string | null;
  }[];
};

const LEVEL_COLORS = ["#5b6a7a", "#93a0af", "#4a9eda", "#43a6c4", "#3aa878", "#e8a33d", "#f4b756"];

export function SkillsView({ skills, readOnly = false }: { skills: SkillDTO[]; readOnly?: boolean }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSkill, setEditSkill] = useState<SkillDTO | null>(null);
  const [evidenceSkill, setEvidenceSkill] = useState<SkillDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SkillDTO | null>(null);
  const [, startTransition] = useTransition();

  function openEdit(s: SkillDTO) {
    setEditSkill(s);
    setCreateOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-faint">
          Level = demonstrated ability, not time studying.
        </p>
        {!readOnly ? (
          <Button variant="primary" size="sm" onClick={() => { setEditSkill(null); setCreateOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />
            Add Skill
          </Button>
        ) : null}
      </div>

      {skills.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-5 w-5" />}
          title="No skills tracked."
          hint="Add the capabilities you rely on, then back them with evidence of demonstrated work."
          action={
            readOnly ? undefined : (
              <Button variant="primary" size="sm" onClick={() => { setEditSkill(null); setCreateOpen(true); }}>
                Add your first skill
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((s) => {
            const levelMeta = SKILL_LEVELS[s.level] ?? SKILL_LEVELS[0];
            return (
              <div key={s.id} className="flex flex-col rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{s.name}</p>
                    {s.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-faint">{s.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    {!readOnly ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          aria-label={`Edit ${s.name}`}
                          className="rounded p-1 text-faint transition-colors hover:bg-surface-2 hover:text-text"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEvidenceSkill(s); }}
                          aria-label={`Evidence for ${s.name}`}
                          className="rounded p-1 text-faint transition-colors hover:bg-surface-2 hover:text-text"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(s)}
                          aria-label={`Delete ${s.name}`}
                          className="rounded p-1 text-faint transition-colors hover:bg-bad/20 hover:text-bad"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-faint">Level</span>
                    <span
                      className="font-mono text-xs font-semibold tabular"
                      style={{ color: LEVEL_COLORS[s.level] ?? "#93a0af" }}
                    >
                      {s.level} · {levelMeta.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {SKILL_LEVELS.map(({ value }) => (
                      <button
                        key={value}
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          startTransition(() => {
                            void updateSkill(s.id, { name: s.name, description: (s.description ?? ""), level: value }).then(() => router.refresh());
                          });
                        }}
                        aria-label={`Set level ${value}`}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          value <= s.level ? "bg-accent" : readOnly ? "bg-surface-3" : "bg-surface-3 hover:bg-border",
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[11px] text-faint">
                    {s.evidence.length} {s.evidence.length === 1 ? "proof" : "proofs"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setEvidenceSkill(s)}>
                    <Link2 className="h-3 w-3" />
                    Evidence
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SkillFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        skill={editSkill}
      />

      <EvidenceModal
        skill={evidenceSkill}
        onClose={() => setEvidenceSkill(null)}
        refresh={() => router.refresh()}
        readOnly={readOnly}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete skill"
        message={`Delete "${confirmDelete?.name}" and all its evidence?`}
        onConfirm={() => {
          if (!confirmDelete) return;
          startTransition(() => {
            void deleteSkill(confirmDelete.id).then(() => router.refresh());
          });
        }}
      />
    </div>
  );
}

function SkillFormModal({
  open,
  onClose,
  skill,
}: {
  open: boolean;
  onClose: () => void;
  skill: SkillDTO | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title={skill ? "Edit Skill" : "Add Skill"} size="sm">
      <FormFields key={skill?.id ?? "__new__"} skill={skill} onClose={onClose} />
    </Modal>
  );
}

function FormFields({
  skill,
  onClose,
}: {
  skill: SkillDTO | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(skill?.name ?? "");
  const [description, setDescription] = useState(skill?.description ?? "");
  const [level, setLevel] = useState(skill?.level ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = skill
        ? await updateSkill(skill.id, { name, description, level })
        : await createSkill({ name, description, level });
      if (!res.ok) {
        setError(res.error ?? "Failed to save skill");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="s-name">Name</Label>
        <Input
          id="s-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. TypeScript"
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="s-desc">Description</Label>
        <Textarea
          id="s-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this capability cover?"
        />
      </div>
      <div>
        <Label>Level</Label>
        <Select value={level} onChange={(e) => setLevel(Number(e.target.value))}>
          {SKILL_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.value} · {l.label}
            </option>
          ))}
        </Select>
        <p className="mt-1.5 text-[11px] text-faint">
          Rate demonstrated ability, not time spent studying.
        </p>
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

function EvidenceModal({
  skill,
  onClose,
  refresh,
  readOnly,
}: {
  skill: SkillDTO | null;
  onClose: () => void;
  refresh: () => void;
  readOnly?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EvidenceType>("GITHUB");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!skill) return;
    setError(null);
    startTransition(async () => {
      const res = await addSkillEvidence(skill.id, { title, type, url, description });
      if (!res.ok) {
        setError(res.error ?? "Failed to add evidence");
        return;
      }
      setTitle("");
      setType("GITHUB");
      setUrl("");
      setDescription("");
      refresh();
    });
  }

  return (
    <Modal
      open={skill !== null}
      onClose={onClose}
      title={skill ? `Evidence · ${skill.name}` : "Evidence"}
      size="md"
    >
      {skill ? (
        <div className="flex flex-col gap-4">
          {skill.evidence.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {skill.evidence.map((ev) => (
                <li key={ev.id} className="flex items-center gap-2 rounded-md border border-line bg-surface-2 px-3 py-2">
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 text-sm text-text hover:text-accent"
                  >
                    <span className="block truncate">{ev.title}</span>
                    <span className="text-[10px] uppercase tracking-wider text-faint">
                      {EVIDENCE_TYPE_LABELS[ev.type]}
                    </span>
                  </a>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => {
                        startTransition(() => {
                          void deleteSkillEvidence(ev.id).then(refresh);
                        });
                      }}
                      aria-label="Delete evidence"
                      className="rounded p-1 text-faint transition-colors hover:bg-bad/20 hover:text-bad"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-faint">
              No evidence yet. Link something that proves the capability.
            </p>
          )}

          {!readOnly ? (
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="ev-title">Title</Label>
                  <Input
                    id="ev-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Shipped auth flow"
                  />
                </div>
                <div>
                  <Label htmlFor="ev-type">Type</Label>
                  <Select value={type} onChange={(e) => setType(e.target.value as EvidenceType)}>
                    {EVIDENCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EVIDENCE_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ev-url">URL</Label>
                  <Input
                    id="ev-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="ev-desc">Description</Label>
                  <Textarea
                    id="ev-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              {error ? <p className="text-xs text-bad">{error}</p> : null}
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={submit} disabled={isPending}>
                  {isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                  Add Evidence
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}