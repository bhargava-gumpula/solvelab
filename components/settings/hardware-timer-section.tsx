"use client";

import { Bluetooth, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { useTimerDevice } from "@/components/timer/timer-device-provider";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BLUETOOTH_TIMER_BRANDS,
  BLUETOOTH_TIMER_BRAND_IDS,
  getBluetoothTimerBrandProfile,
} from "@/lib/timer/devices";
import type { BluetoothTimerBrand, TimerInput } from "@/types/domain";

export function HardwareTimerControls({
  timerInput,
  bluetoothTimerBrand,
  onChangeTimerInput,
  onChangeBrand,
}: {
  timerInput: TimerInput;
  bluetoothTimerBrand: BluetoothTimerBrand;
  onChangeTimerInput: (value: TimerInput) => void;
  onChangeBrand: (value: BluetoothTimerBrand) => void;
}) {
  const { session, connectBluetooth, connectSimulator, disconnect } = useTimerDevice();
  const connected = session.connected && session.mode !== "idle";
  const profile = getBluetoothTimerBrandProfile(bluetoothTimerBrand);

  const connect = async (preferSimulator: boolean) => {
    try {
      const next = preferSimulator
        ? await connectSimulator()
        : await connectBluetooth({ preferSimulator: false, brand: bluetoothTimerBrand });
      if (next.mode === "simulator") {
        toast.success("Stackmat simulator connected", {
          description: "Use the simulator pads on the timer page.",
        });
      } else {
        toast.success(`Connected to ${next.label}`, {
          description: `Using ${profile.label} detection and decode.`,
        });
      }
      onChangeTimerInput("bluetooth");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn’t connect a Bluetooth timer.");
    }
  };

  const changeBrand = async (next: BluetoothTimerBrand) => {
    onChangeBrand(next);
    if (connected && session.mode === "native") {
      await disconnect();
      toast.message("Timer brand updated", {
        description: "Reconnect so the new filters and decode apply.",
      });
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
            Keyboard (Space) is the default. Bluetooth mode pairs a hardware timer — pick your brand
            below so the browser only lists matching devices and reads pads correctly.
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-labelledby="timer-input-label"
          value={timerInput}
          onValueChange={(next) => {
            if (next === "keyboard" || next === "bluetooth") onChangeTimerInput(next);
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

      <div className="grid gap-3 rounded-xl border border-border px-3 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium" id="timer-brand-label">
              Timer brand
            </p>
            <p className="text-xs text-muted-foreground">{profile.description}</p>
          </div>
          <NativeSelect
            aria-labelledby="timer-brand-label"
            className="min-w-[12rem]"
            value={bluetoothTimerBrand}
            disabled={timerInput !== "bluetooth"}
            onChange={(event) => {
              const next = event.target.value as BluetoothTimerBrand;
              if (BLUETOOTH_TIMER_BRAND_IDS.includes(next)) void changeBrand(next);
            }}
          >
            {BLUETOOTH_TIMER_BRAND_IDS.map((id) => (
              <NativeSelectOption key={id} value={id}>
                {BLUETOOTH_TIMER_BRANDS[id].label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Connection</p>
            <p className="text-xs text-muted-foreground" role="status">
              {connected
                ? `${session.label} · ${session.mode === "simulator" ? "Simulator" : profile.shortLabel}`
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
                  disabled={timerInput !== "bluetooth"}
                  onClick={() => void connect(false)}
                >
                  Connect device
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={timerInput !== "bluetooth"}
                  onClick={() => void connect(true)}
                >
                  Use simulator
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
