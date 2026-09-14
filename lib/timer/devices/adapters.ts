import {
  TimerDeviceUnavailableError,
  type TimerDeviceAdapter,
  type TimerDeviceKind,
  type TimerDeviceSession,
} from "./types";

const idleSession = (): TimerDeviceSession => ({
  connected: false,
  disconnect: async () => {},
});

export class KeyboardTimerAdapter implements TimerDeviceAdapter {
  readonly kind = "keyboard" as const;
  readonly label = "Keyboard";

  async connect(): Promise<TimerDeviceSession> {
    return { connected: true, disconnect: async () => {} };
  }
}

export class BluetoothTimerAdapter implements TimerDeviceAdapter {
  readonly kind = "bluetooth" as const;
  readonly label = "Bluetooth timer";

  async connect(): Promise<TimerDeviceSession> {
    return Promise.reject(
      new TimerDeviceUnavailableError("Bluetooth timers aren’t connected in this build yet."),
    );
  }
}

export function getTimerDeviceAdapter(kind: TimerDeviceKind): TimerDeviceAdapter {
  return kind === "bluetooth" ? new BluetoothTimerAdapter() : new KeyboardTimerAdapter();
}

export function disconnectedSession(): TimerDeviceSession {
  return idleSession();
}
