import { Crown, Clock, BellRing, Timer } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMemberTodayDigest, getTeamMembers, type MeetingInfo } from "@/lib/queries";
import { formatDuration } from "@/lib/date";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requireUser();
  const members = await getTeamMembers(user.teamId ?? "");
  const meeting = user.team ? meetingInfo(user.team) : null;

  const digests = await Promise.all(
    members.map((m) => getMemberTodayDigest(m.id)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Team today</h1>
        <p className="mt-0.5 text-sm text-muted">
          What every member shipped today — inputs are not achievements. Output is.
        </p>
      </div>

      {meeting ? (
        <MeetingCard meeting={meeting} isHead={user.isHead} />
      ) : (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
          No team yet. Ask the team head to set up the end-of-day conclusion meeting.
        </p>
      )}

      {digests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {digests.map((d) => (
            <MemberCard key={d.user.id} {...d} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No members in this team yet.
        </p>
      )}
    </div>
  );
}

function meetingInfo(
  team: { eodMeetingTime: string; eodMeetingDurationMinutes: number; name: string },
): MeetingInfo {
  return {
    name: team.name,
    eodMeetingTime: team.eodMeetingTime,
    eodMeetingDurationMinutes: team.eodMeetingDurationMinutes,
  };
}

function MeetingCard({ meeting, isHead }: { meeting: MeetingInfo; isHead: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface/60 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <BellRing className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-text">EOD conclusion meeting</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {meeting.eodMeetingTime} · {meeting.eodMeetingDurationMinutes} min
            {meeting.name && meeting.name !== "My Team" ? ` · ${meeting.name}` : ""}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {isHead ? (
          <a
            href="/settings#meeting"
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            Change time
          </a>
        ) : null}
      </div>
    </div>
  );
}

function MemberCard(
  digest: Awaited<ReturnType<typeof getMemberTodayDigest>>,
) {
  const { user, dailyLog } = digest;
  return (
    <div className="rounded-xl border border-line bg-surface/60 p-4 fade-up">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {user.emoji}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-text">
            {user.name}
            {user.isHead ? (
              <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="team head" />
            ) : null}
          </p>
          <p className="text-xs text-faint">
            {digest.sessionCount} session{digest.sessionCount === 1 ? "" : "s"} ·{" "}
            {formatDuration(digest.deepWorkMinutes)} deep work
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-mono text-lg font-semibold tabular text-accent">
            {digest.deepWorkMinutes}m
          </p>
        </div>
      </div>

      {dailyLog?.primaryObjective ? (
        <p className="mt-3 text-sm text-text">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
            Objective&nbsp;
          </span>
          {dailyLog.primaryObjective}
        </p>
      ) : null}

      {digest.outputs.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {digest.outputs.map((o) => (
            <li key={o.id} className="flex items-start gap-2 text-sm text-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
              <span className="line-clamp-2">{o.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-faint">No recorded output yet today.</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <Stat
          label="Contacts"
          value={String(digest.peopleContacted)}
        />
        <Stat
          label="Talks"
          value={String(digest.customerConversations)}
        />
        <Stat
          label="Revenue"
          value={digest.revenue > 0 ? `$${digest.revenue}` : "—"}
        />
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
        <span className="flex items-center gap-1 text-bad">
          <span className="font-mono text-faint">distracted</span>{" "}
          {digest.distractionMinutes}m
        </span>
        <span className="flex items-center gap-1 text-muted">
          <Timer className="h-3.5 w-3.5" aria-hidden />
          {digest.evidenceCount} evidence
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-sm font-semibold tabular text-text">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
    </div>
  );
}