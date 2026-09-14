/** Hardware timer adapters. Web Bluetooth is not used in this build. */

export type TimerDeviceKind = "keyboard" | "bluetooth";

export interface TimerDeviceSession {
  readonly connected: boolean;
  disconnect(): Promise<void>;
}

export interface TimerDeviceAdapter {
  readonly kind: TimerDeviceKind;
  readonly label: string;
  connect(): Promise<TimerDeviceSession>;
}

export class TimerDeviceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimerDeviceUnavailableError";
  }
}
