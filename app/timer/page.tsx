import type { Metadata } from "next";
import { CoachModelUnloader } from "@/components/timer/coach-model-unloader";
import { TimerWorkspace } from "@/components/timer/timer-workspace";

export const metadata: Metadata = { title: "Timer" };

export default function TimerPage() {
  return (
    <>
      <CoachModelUnloader />
      <TimerWorkspace />
    </>
  );
}
