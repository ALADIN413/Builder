import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTeamDirectory } from "@/lib/queries";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const { members, meeting } = await getTeamDirectory(user);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">Settings</h1>
        <p className="text-sm text-faint">
          Your profile, your data, and your team&apos;s end-of-day conclusion meeting.
        </p>
      </header>
      <SettingsView
        user={{ id: user.id, name: user.name, emoji: user.emoji, isHead: user.isHead }}
        members={members}
        meeting={meeting}
      />
    </div>
  );
}