import { describe, expect, it } from "vitest";
import {
  BluetoothTimerAdapter,
  KeyboardTimerAdapter,
  buildTimerRequestDeviceOptions,
  connectStackmatSimulator,
  crc16ccitt,
  decodeGanSmartTimerPacket,
  decodeGanTimerPacket,
  decodeStackmatPacket,
  getBluetoothTimerBrandProfile,
  getTimerDeviceAdapter,
  interpretStackmatStatus,
  GanState,
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

function ganPacket(state: number, min = 0, sec = 0, ms = 0): number[] {
  const bytes = [0xfe, 0x01, 0x00, state, min, sec, ms & 0xff, (ms >> 8) & 0xff, 0, 0];
  const crc = crc16ccitt(bytes, 2, 8);
  bytes[8] = crc & 0xff;
  bytes[9] = (crc >> 8) & 0xff;
  return bytes;
}

describe("brand profiles", () => {
  it("scopes GAN discovery to GAN name prefixes", () => {
    const options = buildTimerRequestDeviceOptions("gan");
    const prefixes =
      options.filters?.flatMap((f) => ("namePrefix" in f && f.namePrefix ? [f.namePrefix] : [])) ??
      [];
    expect(prefixes.every((p) => /^(GAN|Gan|gan|Giiker)/.test(p))).toBe(true);
    expect(prefixes).not.toContain("QY-Timer");
    expect(getBluetoothTimerBrandProfile("gan").decode(ganPacket(GanState.HANDS_ON))).toBe("press");
  });

  it("scopes QiYi discovery to QY prefixes", () => {
    const options = buildTimerRequestDeviceOptions("qiyi");
    expect(options.filters?.some((f) => "namePrefix" in f && f.namePrefix === "QY-Timer")).toBe(
      true,
    );
    expect(options.filters?.some((f) => "namePrefix" in f && f.namePrefix === "GAN")).toBe(false);
  });

  it("auto-detect includes multiple brands", () => {
    const options = buildTimerRequestDeviceOptions("auto");
    expect(options.filters?.some((f) => "namePrefix" in f && f.namePrefix === "GAN")).toBe(true);
    expect(options.filters?.some((f) => "namePrefix" in f && f.namePrefix === "QY-Timer")).toBe(
      true,
    );
  });
});

describe("stackmat / GAN packet decode", () => {
  it("maps known Stackmat status bytes", () => {
    expect(interpretStackmatStatus(0x09)).toBe("press");
    expect(interpretStackmatStatus(0x0c)).toBe("release");
    expect(interpretStackmatStatus(0x0a)).toBe("reset");
    expect(decodeStackmatPacket([0x00, 0x0c])).toBe("release");
  });

  it("decodes GAN Smart Timer 0xFE packets with CRC", () => {
    const handsOn = ganPacket(GanState.HANDS_ON);
    expect(decodeGanSmartTimerPacket(handsOn)?.signal).toBe("press");
    expect(decodeGanTimerPacket(handsOn)).toBe("press");

    const running = ganPacket(GanState.RUNNING);
    expect(decodeGanTimerPacket(running)).toBe("release");

    const stopped = ganPacket(GanState.STOPPED, 0, 12, 345);
    const parsed = decodeGanSmartTimerPacket(stopped);
    expect(parsed?.signal).toBe("press");
    expect(parsed?.solveTimeMs).toBe(12_345);

    const runningTimed = ganPacket(GanState.RUNNING, 0, 3, 210);
    expect(decodeGanSmartTimerPacket(runningTimed)?.solveTimeMs).toBe(3_210);
  });

  it("rejects GAN packets with bad CRC", () => {
    const bad = ganPacket(GanState.HANDS_ON);
    bad[8] = 0;
    bad[9] = 0;
    expect(decodeGanSmartTimerPacket(bad)).toBeNull();
  });
});
