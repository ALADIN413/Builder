import type { Metadata } from "next";
import { FocusTimer } from "@/components/focus/focus-timer";
import { Panel } from "@/components/ui/panel";
import { requireUser, resolveViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Focus" };

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const current = await requireUser();
  const { isSelf } = await resolveViewer(await searchParams, current);

  return (
    <div className="fade-up">
      {isSelf ? (
        <FocusTimer />
      ) : (
        <Panel>
          <p className="text-sm text-text">
            You&apos;re viewing a teammate&apos;s dashboard. Start your own focus session from your
            own view.
          </p>
        </Panel>
      )}
    </div>
  );
}