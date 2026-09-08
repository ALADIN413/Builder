"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  Trash2,
  LoaderCircle,
  CheckCircle2,
  FlaskConical,
  Crown,
  Clock,
  UserRound,
} from "lucide-react";
import { clearAll, exportAll, importAll, seedData, updateTeamMeeting } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Input, Label } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export type SettingsUser = {
  id: string;
  name: string;
  emoji: string;
  isHead: boolean;
};

export type SettingsMember = SettingsUser;

export type SettingsMeeting = {
  name: string;
  eodMeetingTime: string;
  eodMeetingDurationMinutes: number;
} | null;

export function SettingsView({
  user,
  members,
  meeting,
}: {
  user: SettingsUser;
  members: SettingsMember[];
  meeting: SettingsMeeting;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);

  const [teamName, setTeamName] = useState(meeting?.name ?? "My Team");
  const [meetingTime, setMeetingTime] = useState(meeting?.eodMeetingTime ?? "17:00");
  const [meetingDuration, setMeetingDuration] = useState(meeting?.eodMeetingDurationMinutes ?? 30);
  const [meetingSaved, setMeetingSaved] = useState(false);

  function doExport() {
    setNotice(null);
    setError(null);
    startTransition(async () => {
      const res = await exportAll();
      if (!res.ok) {
        setError(res.error ?? "Export failed");
        return;
      }
      if (!res.data) {
        setError("Export returned no data");
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `founder-os-export-${user.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice("Export downloaded.");
    });
  }

  function onImportFile(file: File) {
    setNotice(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      let json: unknown;
      try {
        json = JSON.parse(String(reader.result));
      } catch {
        setError("Not a valid JSON file.");
        return;
      }
      startTransition(async () => {
        const res = await importAll(json);
        if (!res.ok) {
          setError(res.error ?? "Import failed");
          return;
        }
        setNotice("Data imported. Your profile has been rebuilt.");
        router.refresh();
      });
    };
    reader.readAsText(file);
  }

  function saveMeeting() {
    setMeetingSaved(false);
    setError(null);
    startTransition(async () => {
      const res = await updateTeamMeeting({
        name: teamName,
        eodMeetingTime: meetingTime,
        eodMeetingDurationMinutes: Number(meetingDuration) || 30,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save meeting.");
        return;
      }
      setMeetingSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="fade-up grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel>
        <PanelHeader title="Your Profile" subtitle="Who you are on this team." />
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {user.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-text">
              <UserRound className="h-4 w-4 text-muted" aria-hidden />
              {user.name}
              {user.isHead ? (
                <>
                  <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="team head" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
                    team head
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            Switch
          </Link>
        </div>
      </Panel>

      <Panel id="meeting">
        <PanelHeader
          title="EOD Conclusion Meeting"
          subtitle={
            user.isHead
              ? "The team's end-of-day wrap-up. Everyone sees a reminder."
              : "Only the team head can change the meeting time."
          }
        />
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!user.isHead}
              maxLength={80}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="meeting-time">Time</Label>
              <Input
                id="meeting-time"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                disabled={!user.isHead}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="meeting-duration">Duration (min)</Label>
              <Input
                id="meeting-duration"
                type="number"
                min={5}
                max={180}
                value={meetingDuration}
                onChange={(e) => setMeetingDuration(Number(e.target.value))}
                disabled={!user.isHead}
              />
            </div>
          </div>
          {user.isHead ? (
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={saveMeeting} disabled={isPending}>
                {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Save meeting
              </Button>
              {meetingSaved ? (
                <p className="flex items-center gap-1.5 text-xs text-good">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved.
                </p>
              ) : null}
            </div>
          ) : null}
          {error ? <p className="text-xs text-bad">{error}</p> : null}
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-faint">Team ({members.length})</p>
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-muted">
                <span aria-hidden>{m.emoji}</span>
                <span className="flex-1 text-text">{m.name}</span>
                {m.isHead ? (
                  <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="team head" />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Data Control" subtitle="This system belongs to you. Own the data." />
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={doExport} disabled={isPending}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export my data (JSON)
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
          >
            <Upload className="h-4 w-4" />
            Import into my profile
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
          {notice ? (
            <p className="flex items-center gap-1.5 text-xs text-good">
              <CheckCircle2 className="h-3.5 w-3.5" /> {notice}
            </p>
          ) : null}
          {error ? <p className="text-xs text-bad">{error}</p> : null}
        </div>
      </Panel>

      <Panel className="border-bad/25">
        <PanelHeader
          title="Danger Zone"
          subtitle="Destructive. Confirm before you mean it."
        />
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            onClick={() => setConfirmClear(true)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
            Clear my data
          </Button>
          <p className="text-[11px] text-faint">
            Wipes your records only. Export first if you might ever want them back.
          </p>
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <PanelHeader
          title="Development Seed"
          subtitle="Sample data to see how the team behaves. Never mistaken for real achievements."
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setConfirmSeed(true)} disabled={isPending}>
            <FlaskConical className="h-4 w-4" />
            Load team seed data
          </Button>
          <p className="max-w-md text-[11px] text-faint">
            Creates a team if there isn&apos;t one, adds sample teammates (or reuses yours), and seeds
            today&apos;s summary for every member. You can clear it anytime.
          </p>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all your data"
        message="This permanently deletes every one of your daily logs, sessions, projects, skills, and metrics. This cannot be undone."
        confirmLabel="Delete everything"
        onConfirm={() => {
          startTransition(async () => {
            await clearAll();
            setNotice(null);
            setError(null);
            router.refresh();
          });
        }}
      />
      <ConfirmDialog
        open={confirmSeed}
        onClose={() => setConfirmSeed(false)}
        title="Load team seed data"
        message="Builds sample profiles and today's summary for a demo team. Sample data is not real achievement."
        confirmLabel="Load seed data"
        danger={false}
        onConfirm={() => {
          startTransition(async () => {
            await seedData();
            setNotice("Team seed data loaded.");
            router.refresh();
          });
        }}
      />
    </div>
  );
}