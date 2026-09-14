import { describe, expect, it } from "vitest";
import {
  BluetoothTimerAdapter,
  KeyboardTimerAdapter,
  TimerDeviceUnavailableError,
  getTimerDeviceAdapter,
} from "@/lib/timer/devices";

describe("timer device adapters", () => {
  it("connects the keyboard adapter without using Bluetooth", async () => {
    const adapter = getTimerDeviceAdapter("keyboard");
    expect(adapter).toBeInstanceOf(KeyboardTimerAdapter);
    const session = await adapter.connect();
    expect(session.connected).toBe(true);
    await session.disconnect();
  });

  it("rejects Bluetooth connect until hardware support ships", async () => {
    const adapter = getTimerDeviceAdapter("bluetooth");
    expect(adapter).toBeInstanceOf(BluetoothTimerAdapter);
    await expect(adapter.connect()).rejects.toBeInstanceOf(TimerDeviceUnavailableError);
    await expect(adapter.connect()).rejects.toThrow(/aren’t connected in this build/);
  });
});
