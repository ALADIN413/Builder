"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

export function EodMeetingBanner({
  time,
  durationMinutes,
}: {
  time: string;
  durationMinutes: number;
}) {
  const [state, setState] = useState<"hidden" | "upcoming" | "live" | "past">("hidden");
  const [minutesUntil, setMinutesUntil] = useState(0);

  useEffect(() => {
    const [h = 0, m = 0] = time.split(":").map(Number);

    function update() {
      const now = new Date();
      const start = new Date(now);
      start.setHours(h, m, 0, 0);
      const diffMs = start.getTime() - now.getTime();
      const diffMin = Math.floor(diffMs / 60_000);
      setMinutesUntil(diffMin);
      if (diffMin > 60) {
        setState("hidden");
        return;
      }
      if (diffMin > 0) {
        setState("upcoming");
      } else if (diffMin > -durationMinutes) {
        setState("live");
      } else if (diffMin > -(60 + durationMinutes)) {
        setState("past");
      } else {
        setState("hidden");
      }
    }
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [time, durationMinutes]);

  useEffect(() => {
    if (state !== "upcoming" || minutesUntil > 60) return;
    const [h = 0, m = 0] = time.split(":").map(Number);
    const now = new Date();
    const start = new Date(now);
    start.setHours(h, m, 0, 0);
    const delay = start.getTime() - now.getTime();
    if (delay <= 0) return;

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const scheduled = setTimeout(() => {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("EOD conclusion meeting", {
          body: "Time to wrap up the day and share what everyone shipped.",
        });
      }
    }, delay);
    return () => clearTimeout(scheduled);
  }, [state, minutesUntil, time]);

  if (state === "hidden") return null;

  const endLabel = (() => {
    const now = new Date();
    const [h = 0, m = 0] = time.split(":").map(Number);
    const end = new Date(now);
    end.setHours(h, m + durationMinutes, 0, 0);
    return end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  })();

  const label =
    state === "upcoming"
      ? `EOD conclusion meeting at ${time}${minutesUntil > 0 ? ` (in ~${minutesUntil}m)` : ""}`
      : state === "live"
        ? `EOD conclusion meeting now — until ${endLabel}`
        : `EOD conclusion meeting was at ${time} — is the day wrapped up?`;

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2 text-sm md:px-6",
        state === "live" ? "bg-accent/15 text-text" : "bg-surface text-muted",
      )}
      role="status"
    >
      <BellRing className={cn("h-4 w-4 shrink-0", state === "live" ? "text-accent" : "text-faint")} />
      <span className="truncate">{label}</span>
    </div>
  );
}