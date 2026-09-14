"use client";

import { Bluetooth, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getTimerDeviceAdapter } from "@/lib/timer/devices";
import type { TimerInput } from "@/types/domain";

export function HardwareTimerControls({
  value,
  onChange,
}: {
  value: TimerInput;
  onChange: (value: TimerInput) => void;
}) {
  const connect = async () => {
    try {
      await getTimerDeviceAdapter("bluetooth").connect();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Bluetooth timers aren’t connected in this build yet.",
      );
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium" id="timer-input-label">
            Start and stop
          </p>
          <p className="text-sm text-muted-foreground">
            Keyboard (Space) stays the default. A Bluetooth timer can be selected; connecting a
            device comes in a later update.
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-labelledby="timer-input-label"
          value={value}
          onValueChange={(next) => {
            if (next === "keyboard" || next === "bluetooth") onChange(next);
          }}
        >
          <ToggleGroupItem value="keyboard" className="gap-1.5 px-3">
            <Keyboard className="size-3.5" aria-hidden />
            Keyboard
          </ToggleGroupItem>
          <ToggleGroupItem value="bluetooth" className="gap-1.5 px-3">
            <Bluetooth className="size-3.5" aria-hidden />
            Bluetooth timer
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">Bluetooth timer</p>
          <p className="text-xs text-muted-foreground" role="status">
            Not connected
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value !== "bluetooth"}
          onClick={() => void connect()}
        >
          Connect
        </Button>
      </div>
    </div>
  );
}
