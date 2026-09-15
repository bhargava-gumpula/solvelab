import {
  TimerDeviceUnavailableError,
  type TimerDeviceAdapter,
  type TimerDeviceEvent,
  type TimerDeviceKind,
  type TimerDeviceSession,
} from "./types";
import { decodeStackmatPacket } from "./stackmat";

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

/**
 * Bluetooth / Stackmat-compatible adapter.
 * - Tries Web Bluetooth when available and preferSimulator is false.
 * - Falls back to an on-device simulator that emits the same press/release events
 *   (usable overnight without pairing UI, and for automated tests).
 */
export class BluetoothTimerAdapter implements TimerDeviceAdapter {
  readonly kind = "bluetooth" as const;
  readonly label = "Bluetooth timer";

  async connect(options?: { preferSimulator?: boolean }): Promise<TimerDeviceSession> {
    if (!options?.preferSimulator) {
      const native = await tryWebBluetoothStackmat();
      if (native) return native;
    }
    return connectStackmatSimulator();
  }
}

export function connectStackmatSimulator(label = "Stackmat simulator"): TimerDeviceSession {
  return createEmitterSession(label, "simulator");
}

async function tryWebBluetoothStackmat(): Promise<TimerDeviceSession | null> {
  const bluetooth = typeof navigator !== "undefined" ? navigator.bluetooth : undefined;
  if (!bluetooth?.requestDevice) return null;

  try {
    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        // Common vendor service UUIDs used by cubing timers; discovery still depends on the device.
        "0000fff0-0000-1000-8000-00805f9b34fb",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
      ],
    });
    const server = await device.gatt?.connect();
    if (!server) {
      throw new TimerDeviceUnavailableError("Bluetooth device had no GATT server.");
    }

    const session = createEmitterSession(device.name || "Bluetooth timer", "native", async () => {
      try {
        device.gatt?.disconnect();
      } catch {
        /* ignore */
      }
    });

    // Best-effort: listen on the first notifiable characteristic we can find.
    void attachBluetoothNotifications(server, (bytes) => {
      const signal = decodeStackmatPacket(bytes);
      if (signal === "ignore") return;
      session.emit?.({ type: signal, at: performance.now() });
    });

    device.addEventListener("gattserverdisconnected", () => {
      void session.disconnect();
    });

    return session;
  } catch (error) {
    if (error instanceof TimerDeviceUnavailableError) throw error;
    // User cancelled, permissions, or unsupported device — caller falls back to simulator.
    return null;
  }
}

async function attachBluetoothNotifications(
  server: BluetoothRemoteGATTServer,
  onBytes: (bytes: Uint8Array) => void,
): Promise<void> {
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const characteristic of characteristics) {
        if (!characteristic.properties.notify && !characteristic.properties.indicate) continue;
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
        return;
      }
    }
  } catch {
    // Native connection still counts; packets may be unavailable for unknown firmwares.
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
