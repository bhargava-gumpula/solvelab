// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { useTimerControls } from "@/hooks/use-timer-controls";
import {
  BluetoothTimerAdapter,
  crc16ccitt,
  GanState,
  type TimerDeviceSession,
} from "@/lib/timer/devices";
import { createTimerStore, type TimerStore } from "@/lib/timer/store";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The keyboard controls on a page, with no touch surface. */
const noSurface = { current: null };

function Controls({ store, enabled }: { store: TimerStore; enabled: boolean }) {
  useTimerControls(store, { enabled, surfaceRef: noSurface });
  return null;
}

const key = (type: "keydown" | "keyup") =>
  window.dispatchEvent(new KeyboardEvent(type, { key: " ", code: "Space", bubbles: true }));

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
});

describe("the timer's keyboard controls", () => {
  it("don't swallow the next start when switched off between the stopping press and its release", async () => {
    const store = createTimerStore({ inspectionMs: 0, holdToStartMs: 0 });
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    const render = (enabled: boolean) =>
      act(() => root!.render(createElement(Controls, { store, enabled })));

    render(true);
    // Start a solve.
    act(() => key("keydown"));
    act(() => key("keyup"));
    expect(store.getState().phase).toBe("running");

    // Stop it; before the key comes up, the page switches the timer off (as the
    // algorithm trainer does while it makes the next scramble), then back on.
    act(() => key("keydown"));
    expect(store.getState().phase).toBe("stopped");
    render(false);
    act(() => key("keyup"));
    render(true);

    // The next press starts a new hold rather than being taken for the old release.
    act(() => key("keydown"));
    expect(store.getState().phase).toBe("ready");
  });
});

function DeviceControls({ store, session }: { store: TimerStore; session: TimerDeviceSession }) {
  useTimerControls(store, {
    enabled: true,
    surfaceRef: noSurface,
    inputSource: "bluetooth",
    deviceSession: session,
  });
  return null;
}

/** A GAN Smart Timer state packet (0xFE framing, CRC-16/CCITT over bytes 2–7). */
function ganPacket(state: number, seconds = 0): number[] {
  const bytes = [0xfe, 0x01, 0x00, state, 0, seconds, 0, 0, 0, 0];
  const crc = crc16ccitt(bytes, 2, 8);
  bytes[8] = crc & 0xff;
  bytes[9] = (crc >> 8) & 0xff;
  return bytes;
}

/** Connects the real Bluetooth adapter to a fake GAN timer; `send` plays one packet. */
async function connectGanTimer() {
  let notify: ((event: { target: { value: DataView } }) => void) | undefined;
  const characteristic = {
    startNotifications: async () => {},
    addEventListener: (_type: string, listener: typeof notify) => {
      notify = listener;
    },
  };
  const device = {
    name: "GAN-test",
    gatt: {
      connect: async () => ({
        getPrimaryService: async () => ({ getCharacteristic: async () => characteristic }),
      }),
      disconnect() {},
    },
    addEventListener() {},
  };
  Object.defineProperty(navigator, "bluetooth", {
    value: { requestDevice: async () => device },
    configurable: true,
  });
  const session = await new BluetoothTimerAdapter().connect({ brand: "gan" });
  const send = (bytes: number[]) =>
    notify!({ target: { value: new DataView(new Uint8Array(bytes).buffer) } });
  return { session, send };
}

describe("the timer's Bluetooth controls", () => {
  for (const inspectionMs of [0, 15_000]) {
    it(`record every solve from a GAN timer (inspection ${inspectionMs ? "on" : "off"})`, async () => {
      const { session, send } = await connectGanTimer();
      expect(session.mode).toBe("native");
      const store = createTimerStore({ inspectionMs, holdToStartMs: 0 });
      const recorded: number[] = [];
      store.onComplete((result) => recorded.push(result.rawTimeMs));
      const container = document.createElement("div");
      document.body.append(container);
      root = createRoot(container);
      act(() => root!.render(createElement(DeviceControls, { store, session })));

      const solve = (seconds: number) => {
        send(ganPacket(GanState.IDLE));
        send(ganPacket(GanState.HANDS_ON));
        if (inspectionMs) {
          // Tap the pads to start inspection, then hands back on to start.
          send(ganPacket(GanState.HANDS_OFF));
          send(ganPacket(GanState.HANDS_ON));
        }
        send(ganPacket(GanState.GET_SET));
        send(ganPacket(GanState.RUNNING));
        send(ganPacket(GanState.STOPPED, seconds));
        send(ganPacket(GanState.FINISHED, seconds));
      };
      act(() => {
        solve(11);
        solve(12);
        solve(13);
      });
      expect(recorded).toEqual([11_000, 12_000, 13_000]);
    });
  }
});

function TouchControls({ store, surface }: { store: TimerStore; surface: HTMLElement }) {
  useTimerControls(store, { enabled: true, surfaceRef: { current: surface } });
  return null;
}

describe("the timer's touch controls", () => {
  it("don't start the timer when the system takes an armed touch (pointercancel)", () => {
    const store = createTimerStore({ inspectionMs: 0, holdToStartMs: 0 });
    const surface = document.createElement("div");
    document.body.append(surface);
    root = createRoot(document.createElement("div"));
    act(() => root!.render(createElement(TouchControls, { store, surface })));
    const touch = (type: string) =>
      surface.dispatchEvent(
        new PointerEvent(type, { pointerType: "touch", isPrimary: true, bubbles: true }),
      );

    act(() => touch("pointerdown"));
    expect(store.getState().phase).toBe("ready");
    act(() => touch("pointercancel"));
    expect(store.getState().phase).toBe("idle");

    // A real lift still starts it.
    act(() => touch("pointerdown"));
    act(() => touch("pointerup"));
    expect(store.getState().phase).toBe("running");
  });
});
