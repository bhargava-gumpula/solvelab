"use client";

import { Bluetooth, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { useTimerDevice } from "@/components/timer/timer-device-provider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TimerInput } from "@/types/domain";

export function HardwareTimerControls({
  value,
  onChange,
}: {
  value: TimerInput;
  onChange: (value: TimerInput) => void;
}) {
  const { session, connectBluetooth, connectSimulator, disconnect } = useTimerDevice();
  const connected = session.connected && session.mode !== "idle";

  const connect = async (preferSimulator: boolean) => {
    try {
      const next = preferSimulator
        ? await connectSimulator()
        : await connectBluetooth({ preferSimulator: false });
      if (next.mode === "simulator") {
        toast.success("Stackmat simulator connected", {
          description: "Use the simulator buttons on the timer, or pair a real device in Chrome.",
        });
      } else {
        toast.success(`Connected to ${next.label}`);
      }
      onChange("bluetooth");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn’t connect a Bluetooth timer.");
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
            Keyboard (Space) is the default. Bluetooth mode uses a paired Stackmat-compatible timer
            when the browser allows it, or the on-device simulator.
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
      <div className="flex flex-col gap-3 rounded-xl border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Bluetooth timer</p>
          <p className="text-xs text-muted-foreground" role="status">
            {connected
              ? `${session.label} · ${session.mode === "simulator" ? "Simulator" : "Device"}`
              : "Not connected"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {connected ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void disconnect()}>
              Disconnect
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={value !== "bluetooth"}
                onClick={() => void connect(false)}
              >
                Connect device
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={value !== "bluetooth"}
                onClick={() => void connect(true)}
              >
                Use simulator
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
