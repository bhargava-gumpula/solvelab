import type { Metadata } from "next";
import { TimerWorkspace } from "@/components/timer/timer-workspace";

export const metadata: Metadata = { title: "Timer" };

export default function TimerPage() {
  return <TimerWorkspace />;
}
