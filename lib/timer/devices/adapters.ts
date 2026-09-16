import {
  TimerDeviceUnavailableError,
  type TimerDeviceAdapter,
  type TimerDeviceEvent,
  type TimerDeviceKind,
  type TimerDeviceSession,
} from "./types";
import {
  buildTimerRequestDeviceOptions,
  getBluetoothTimerBrandProfile,
  type BluetoothTimerBrand,
} from "./brands";
import { decodeGanSmartTimerPacket, GanState } from "./gan-timer";

function createEmitterSession(
  label: string,
  mode: TimerDeviceSession["mode"],
  onDisconnect?: () => Promise<void> | void,
): TimerDeviceSession {
  const listeners = new Set<(event: TimerDeviceEvent) => void>();
  let connected = true;

  const session: TimerDeviceSession = {
    get connected() {
      return connected;
    },
    mode,
    label,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event) {
      if (!connected) return;
      for (const listener of listeners) listener(event);
    },
    async disconnect() {
      connected = false;
      listeners.clear();
      await onDisconnect?.();
    },
  };
  return session;
}

export class KeyboardTimerAdapter implements TimerDeviceAdapter {
  readonly kind = "keyboard" as const;
  readonly label = "Keyboard";

  async connect(): Promise<TimerDeviceSession> {
    return {
      connected: true,
      mode: "native",
      label: this.label,
      subscribe: () => () => {},
      disconnect: async () => {},
    };
  }
}

export class BluetoothTimerAdapter implements TimerDeviceAdapter {
  readonly kind = "bluetooth" as const;
  readonly label = "Bluetooth timer";

  async connect(options?: {
    preferSimulator?: boolean;
    brand?: BluetoothTimerBrand;
  }): Promise<TimerDeviceSession> {
    if (!options?.preferSimulator) {
      const native = await tryWebBluetoothTimer(options?.brand ?? "auto");
      if (native) return native;
    }
    return connectStackmatSimulator();
  }
}

export function connectStackmatSimulator(label = "Stackmat simulator"): TimerDeviceSession {
  return createEmitterSession(label, "simulator");
}

async function tryWebBluetoothTimer(
  brand: BluetoothTimerBrand,
): Promise<TimerDeviceSession | null> {
  const bluetooth = typeof navigator !== "undefined" ? navigator.bluetooth : undefined;
  if (!bluetooth?.requestDevice) return null;

  const profile = getBluetoothTimerBrandProfile(brand);

  try {
    const device = await bluetooth.requestDevice(buildTimerRequestDeviceOptions(brand));
    const server = await device.gatt?.connect();
    if (!server) {
      throw new TimerDeviceUnavailableError("Bluetooth device had no GATT server.");
    }

    const session = createEmitterSession(device.name || profile.shortLabel, "native", async () => {
      try {
        device.gatt?.disconnect();
      } catch {
        /* ignore */
      }
    });

    let lastSignal: string | null = null;
    const onBytes = (bytes: Uint8Array) => {
      const now = performance.now();
      // Prefer full GAN decode so RUNNING/STOPPED carry the official solve time.
      const gan = decodeGanSmartTimerPacket(bytes);
      if (gan) {
        if (gan.state === GanState.RUNNING && gan.solveTimeMs !== undefined) {
          // RUNNING: start if needed, then keep UI digits locked to the hardware.
          if (lastSignal !== "release") {
            session.emit?.({ type: "release", at: now });
            lastSignal = "release";
          }
          session.emit?.({ type: "sync", at: now, solveTimeMs: gan.solveTimeMs });
          return;
        }
        if (gan.signal === "ignore") return;
        if (gan.signal === lastSignal && gan.signal !== "reset") return;
        lastSignal = gan.signal;
        session.emit?.({
          type: gan.signal,
          at: now,
          ...(gan.solveTimeMs !== undefined ? { solveTimeMs: gan.solveTimeMs } : {}),
        });
        return;
      }
      const signal = profile.decode(bytes);
      if (signal === "ignore") return;
      if (signal === lastSignal && signal !== "reset") return;
      lastSignal = signal;
      session.emit?.({ type: signal, at: now });
    };

    const preferred = await attachPreferredNotifications(server, profile.preferredNotify, onBytes);
    if (!preferred) {
      await attachAnyNotifications(server, onBytes);
    }

    device.addEventListener("gattserverdisconnected", () => {
      void session.disconnect();
    });

    return session;
  } catch (error) {
    if (error instanceof TimerDeviceUnavailableError) throw error;
    return null;
  }
}

async function attachPreferredNotifications(
  server: BluetoothRemoteGATTServer,
  preferred: { service: string; characteristic: string } | undefined,
  onBytes: (bytes: Uint8Array) => void,
): Promise<boolean> {
  if (!preferred) return false;
  try {
    const service = await server.getPrimaryService(preferred.service);
    const characteristic = await service.getCharacteristic(preferred.characteristic);
    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", (event) => {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (!value) return;
      onBytes(
        new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)),
      );
    });
    return true;
  } catch {
    return false;
  }
}

async function attachAnyNotifications(
  server: BluetoothRemoteGATTServer,
  onBytes: (bytes: Uint8Array) => void,
): Promise<void> {
  try {
    const services = await server.getPrimaryServices();
    let attached = 0;
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const characteristic of characteristics) {
        if (!characteristic.properties.notify && !characteristic.properties.indicate) continue;
        try {
          await characteristic.startNotifications();
          characteristic.addEventListener("characteristicvaluechanged", (event) => {
            const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
            if (!value) return;
            onBytes(
              new Uint8Array(
                value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
              ),
            );
          });
          attached += 1;
        } catch {
          /* try next */
        }
      }
    }
    if (attached === 0) {
      console.warn("Bluetooth timer connected but no notify characteristics could be subscribed.");
    }
  } catch {
    /* native connection still counts */
  }
}

export function getTimerDeviceAdapter(kind: TimerDeviceKind): TimerDeviceAdapter {
  return kind === "bluetooth" ? new BluetoothTimerAdapter() : new KeyboardTimerAdapter();
}

export function disconnectedSession(): TimerDeviceSession {
  return {
    connected: false,
    mode: "idle",
    label: "Disconnected",
    subscribe: () => () => {},
    disconnect: async () => {},
  };
}
