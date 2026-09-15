"use client";

import { useTimerDevice } from "@/components/timer/timer-device-provider";
import { Button } from "@/components/ui/button";

/** On-screen Stackmat pads for the simulator session. */
export function StackmatSimulatorPad({ visible }: { visible: boolean }) {
  const { session } = useTimerDevice();
  if (!visible || !session.connected || session.mode !== "simulator" || !session.emit) return null;

  const press = () => session.emit?.({ type: "press", at: performance.now() });
  const release = () => session.emit?.({ type: "release", at: performance.now() });

  return (
    <div
      data-focus-hide
      data-testid="stackmat-simulator"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-w-28"
        onPointerDown={(event) => {
          event.preventDefault();
          press();
        }}
        onPointerUp={(event) => {
          event.preventDefault();
          release();
        }}
        onPointerLeave={() => {
          // If the pointer leaves while held, treat as release so the timer isn't stuck.
          release();
        }}
      >
        Sensor pad
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => session.emit?.({ type: "reset", at: performance.now() })}
      >
        Reset
      </Button>
    </div>
  );
}
