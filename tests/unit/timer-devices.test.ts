import { describe, expect, it } from "vitest";
import {
  BluetoothTimerAdapter,
  KeyboardTimerAdapter,
  connectStackmatSimulator,
  decodeStackmatPacket,
  getTimerDeviceAdapter,
  interpretStackmatStatus,
} from "@/lib/timer/devices";

describe("timer device adapters", () => {
  it("connects the keyboard adapter without using Bluetooth", async () => {
    const adapter = getTimerDeviceAdapter("keyboard");
    expect(adapter).toBeInstanceOf(KeyboardTimerAdapter);
    const session = await adapter.connect();
    expect(session.connected).toBe(true);
    await session.disconnect();
  });

  it("connects a Stackmat simulator when Bluetooth hardware is unavailable", async () => {
    const adapter = getTimerDeviceAdapter("bluetooth");
    expect(adapter).toBeInstanceOf(BluetoothTimerAdapter);
    const session = await adapter.connect({ preferSimulator: true });
    expect(session.connected).toBe(true);
    expect(session.mode).toBe("simulator");

    const events: string[] = [];
    const stop = session.subscribe((event) => events.push(event.type));
    session.emit?.({ type: "press", at: 1 });
    session.emit?.({ type: "release", at: 2 });
    stop();
    expect(events).toEqual(["press", "release"]);
    await session.disconnect();
  });

  it("exposes connectStackmatSimulator for tests", async () => {
    const session = connectStackmatSimulator();
    expect(session.label).toMatch(/simulator/i);
    await session.disconnect();
  });
});

describe("stackmat packet decode", () => {
  it("maps known status bytes", () => {
    expect(interpretStackmatStatus(0x09)).toBe("press");
    expect(interpretStackmatStatus(0x0c)).toBe("release");
    expect(interpretStackmatStatus(0x0a)).toBe("reset");
    expect(decodeStackmatPacket([0x00, 0x0c])).toBe("release");
  });
});
