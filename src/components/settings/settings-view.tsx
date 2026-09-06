"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  Trash2,
  LoaderCircle,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";
import { clearAll, exportAll, importAll, seedData } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function SettingsView() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);

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
      a.download = `founder-os-export-${new Date().toISOString().slice(0, 10)}.json`;
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
        setNotice("Data imported. Your workspace has been rebuilt.");
        router.refresh();
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="fade-up grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel>
        <PanelHeader title="Data Control" subtitle="This system lives on your machine. Own the data." />
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={doExport} disabled={isPending}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export all data (JSON)
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
          >
            <Upload className="h-4 w-4" />
            Import from JSON
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
            Clear all data
          </Button>
          <p className="text-[11px] text-faint">
            Wipes every record. Export first if you might ever want it back.
          </p>
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <PanelHeader
          title="Development Seed"
          subtitle="Sample data to see how the system behaves. Never mistaken for real achievements."
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setConfirmSeed(true)} disabled={isPending}>
            <FlaskConical className="h-4 w-4" />
            Load seed data
          </Button>
          <p className="max-w-md text-[11px] text-faint">
            Adds the &quot;Family Care OS&quot; example project, sample skills, a done daily log, and
            business metrics. You can clear it anytime.
          </p>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all data"
        message="This permanently deletes every daily log, session, project, skill, and metric. This cannot be undone."
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
        title="Load seed data"
        message="Adds the Family Care OS example project and sample records to your workspace. Sample data is not real achievement."
        confirmLabel="Load seed data"
        danger={false}
        onConfirm={() => {
          startTransition(async () => {
            await seedData();
            setNotice("Seed data loaded.");
            router.refresh();
          });
        }}
      />
    </div>
  );
}