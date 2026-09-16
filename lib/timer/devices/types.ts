/** Hardware timer adapters. Prefer real BLE when the browser allows it; otherwise use the Stackmat simulator. */

export type TimerDeviceKind = "keyboard" | "bluetooth";

export type TimerDeviceEventType = "press" | "release" | "reset" | "sync";

export interface TimerDeviceEvent {
  type: TimerDeviceEventType;
  at: number;
  /** Official solve duration from the device (ms), when reported. */
  solveTimeMs?: number;
}

export type TimerDeviceMode = "native" | "simulator" | "idle";

export interface TimerDeviceSession {
  readonly connected: boolean;
  readonly mode: TimerDeviceMode;
  readonly label: string;
  subscribe(listener: (event: TimerDeviceEvent) => void): () => void;
  /** Simulator / test helper — ignored on native sessions that do not expose it. */
  emit?(event: TimerDeviceEvent): void;
  disconnect(): Promise<void>;
}

export type TimerDeviceAdapter = {
  readonly kind: TimerDeviceKind;
  readonly label: string;
  connect(options?: {
    preferSimulator?: boolean;
    brand?: import("./brands").BluetoothTimerBrand;
  }): Promise<TimerDeviceSession>;
};

export class TimerDeviceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimerDeviceUnavailableError";
  }
}
