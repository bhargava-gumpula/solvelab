import type { BluetoothTimerBrand } from "@/types/domain";
import type { StackmatSignal } from "./stackmat";
import { decodeStackmatPacket } from "./stackmat";
import {
  GAN_TIMER_SERVICE,
  GAN_TIMER_STATE_CHAR,
  QIYI_TIMER_SERVICE,
  decodeGanTimerPacket,
} from "./gan-timer";

export type { BluetoothTimerBrand };

export interface BluetoothTimerBrandProfile {
  id: BluetoothTimerBrand;
  label: string;
  shortLabel: string;
  description: string;
  namePrefixes: string[];
  /** Services included in discovery filters and optionalServices. */
  serviceUuids: string[];
  /** Prefer this service+characteristic for notifications when present. */
  preferredNotify?: { service: string; characteristic: string };
  decode: (bytes: ArrayLike<number>) => StackmatSignal;
}

/** QiYi notify characteristic (AES handshake not required for discovery). */
export const QIYI_TIMER_NOTIFY_CHAR = "00000002-0000-1001-8001-00805f9b07d0";

/**
 * Best-effort QiYi status nibble when plaintext slips through.
 * Full QiYi needs AES; this keeps the brand selectable and filters correct.
 */
export function decodeQiyiTimerPacket(bytes: ArrayLike<number>): StackmatSignal {
  if (bytes.length === 0) return "ignore";
  // csTimer status enum often appears near the end of decrypted frames.
  const code = bytes[bytes.length - 1]! & 0xff;
  // Heuristic mirror of IDLE/GET_SET/RUNNING/STOPPED-ish values.
  if (code === 0 || code === 5) return "reset";
  if (code === 1 || code === 2) return "press";
  if (code === 3 || code === 4) return "release";
  return "ignore";
}

function decodeAuto(bytes: ArrayLike<number>): StackmatSignal {
  const gan = decodeGanTimerPacket(bytes);
  if (gan !== "ignore") return gan;
  const stackmat = decodeStackmatPacket(bytes);
  if (stackmat !== "ignore") return stackmat;
  return decodeQiyiTimerPacket(bytes);
}

function decodeGeneric(bytes: ArrayLike<number>): StackmatSignal {
  const stackmat = decodeStackmatPacket(bytes);
  if (stackmat !== "ignore") return stackmat;
  return decodeGanTimerPacket(bytes);
}

export const BLUETOOTH_TIMER_BRANDS: Record<BluetoothTimerBrand, BluetoothTimerBrandProfile> = {
  auto: {
    id: "auto",
    label: "Auto-detect",
    shortLabel: "Auto",
    description: "Show known timer brands and try GAN, then Stackmat-style, then QiYi decode.",
    namePrefixes: ["GAN", "Gan", "gan", "Giiker", "QY-Timer", "QY-Adapter", "QIYI", "QiYi"],
    serviceUuids: [GAN_TIMER_SERVICE, QIYI_TIMER_SERVICE],
    preferredNotify: { service: GAN_TIMER_SERVICE, characteristic: GAN_TIMER_STATE_CHAR },
    decode: decodeAuto,
  },
  gan: {
    id: "gan",
    label: "GAN Smart Timer",
    shortLabel: "GAN",
    description:
      "GAN / Halo / Giiker timers and StackmatLink bridges that speak GAN BLE (fff0/fff5).",
    namePrefixes: ["GAN", "Gan", "gan", "Giiker"],
    serviceUuids: [GAN_TIMER_SERVICE],
    preferredNotify: { service: GAN_TIMER_SERVICE, characteristic: GAN_TIMER_STATE_CHAR },
    decode: decodeGanTimerPacket,
  },
  qiyi: {
    id: "qiyi",
    label: "QiYi Smart Timer",
    shortLabel: "QiYi",
    description:
      "QiYi Smart Timer / Adapter (QY-Timer). Discovery is brand-filtered; full AES decode is limited.",
    namePrefixes: ["QY-Timer", "QY-Adapter", "QIYI", "QiYi", "Qiyi"],
    serviceUuids: [QIYI_TIMER_SERVICE],
    preferredNotify: { service: QIYI_TIMER_SERVICE, characteristic: QIYI_TIMER_NOTIFY_CHAR },
    decode: decodeQiyiTimerPacket,
  },
  stackmat: {
    id: "stackmat",
    label: "Stackmat-compatible BLE",
    shortLabel: "Stackmat",
    description:
      "BLE bridges that emit Stackmat-style status bytes (not the audio-jack Gen4 itself).",
    namePrefixes: ["Stackmat", "Speed Stacks", "SpeedStacks", "GAN-Timer"],
    serviceUuids: [GAN_TIMER_SERVICE],
    preferredNotify: { service: GAN_TIMER_SERVICE, characteristic: GAN_TIMER_STATE_CHAR },
    decode: (bytes) => {
      const stackmat = decodeStackmatPacket(bytes);
      if (stackmat !== "ignore") return stackmat;
      // Many bridges actually speak GAN packets.
      return decodeGanTimerPacket(bytes);
    },
  },
  generic: {
    id: "generic",
    label: "Generic / other BLE",
    shortLabel: "Generic",
    description:
      "Wider name match (includes “Timer”) and Stackmat-first decode. Use if your brand isn’t listed.",
    namePrefixes: ["Timer", "Smart Timer", "iTimer", "CBD"],
    serviceUuids: [GAN_TIMER_SERVICE, QIYI_TIMER_SERVICE],
    decode: decodeGeneric,
  },
};

export const BLUETOOTH_TIMER_BRAND_IDS = Object.keys(
  BLUETOOTH_TIMER_BRANDS,
) as BluetoothTimerBrand[];

export function getBluetoothTimerBrandProfile(
  brand: BluetoothTimerBrand | null | undefined,
): BluetoothTimerBrandProfile {
  return BLUETOOTH_TIMER_BRANDS[brand ?? "auto"] ?? BLUETOOTH_TIMER_BRANDS.auto;
}

export function buildTimerRequestDeviceOptions(
  brand: BluetoothTimerBrand | null | undefined = "auto",
): RequestDeviceOptions {
  const profile = getBluetoothTimerBrandProfile(brand);
  const nameFilters = profile.namePrefixes.map((namePrefix) => ({ namePrefix }));
  const serviceFilters = profile.serviceUuids.map((service) => ({ services: [service] }));
  return {
    filters: [...nameFilters, ...serviceFilters],
    optionalServices: [...profile.serviceUuids],
  };
}
