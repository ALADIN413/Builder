import type { Metadata } from "next";
import { FocusTimer } from "@/components/focus/focus-timer";

export const metadata: Metadata = { title: "Focus" };

export default function FocusPage() {
  return (
    <div className="fade-up">
      <FocusTimer />
    </div>
  );
}