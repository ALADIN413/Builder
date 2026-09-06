import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">Settings</h1>
        <p className="text-sm text-faint">Local data. No accounts. You own it.</p>
      </header>
      <SettingsView />
    </div>
  );
}