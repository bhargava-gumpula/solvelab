import type { StackmatSignal } from "./stackmat";

/** GAN Smart Timer / Halo GATT (also used by StackmatLink bridges). */
export const GAN_TIMER_SERVICE = "0000fff0-0000-1000-8000-00805f9b34fb";
export const GAN_TIMER_STATE_CHAR = "0000fff5-0000-1000-8000-00805f9b34fb";

/** QiYi Smart Timer service (AES path not fully wired yet — discovery only). */
export const QIYI_TIMER_SERVICE = "0000fd50-0000-1000-8000-00805f9b34fb";

/**
 * GAN state byte (offset 3 in 0xFE packets).
 * @see https://github.com/afedotov/gan-web-bluetooth/blob/main/src/gan-smart-timer.ts
 * @see https://github.com/cs0x7f/cstimer/blob/master/src/js/hardware/gantimer.js
 */
export const GanState = {
  DISCONNECT: 0,
  GET_SET: 1,
  HANDS_OFF: 2,
  RUNNING: 3,
  STOPPED: 4,
  IDLE: 5,
  HANDS_ON: 6,
  FINISHED: 7,
} as const;

export type GanStateCode = (typeof GanState)[keyof typeof GanState];

/** CRC16-CCITT-FALSE over a byte range (used by GAN Smart Timer packets). */
export function crc16ccitt(bytes: ArrayLike<number>, start: number, end: number): number {
  let crc = 0xffff;
  for (let i = start; i < end; i++) {
    crc ^= (bytes[i]! & 0xff) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
}

export interface GanTimerEvent {
  state: GanStateCode;
  signal: StackmatSignal;
  solveTimeMs?: number;
}

/**
 * Decode a GAN Smart Timer notification.
 * Layout: [0]=0xFE, [1]=?, [2]=seq, [3]=state, [4]=min, [5]=sec, [6..7]=ms LE, [8..9]=CRC LE
 */
export function decodeGanSmartTimerPacket(bytes: ArrayLike<number>): GanTimerEvent | null {
  if (bytes.length < 10) return null;
  if ((bytes[0]! & 0xff) !== 0xfe) return null;

  const got = (bytes[bytes.length - 2]! & 0xff) | ((bytes[bytes.length - 1]! & 0xff) << 8);
  const calc = crc16ccitt(bytes, 2, bytes.length - 2);
  if (got !== calc) return null;

  const state = (bytes[3]! & 0xff) as GanStateCode;
  const signal = ganStateToSignal(state);
  const event: GanTimerEvent = { state, signal };

  if (state === GanState.STOPPED || state === GanState.RUNNING || state === GanState.FINISHED) {
    const min = bytes[4]! & 0xff;
    const sec = bytes[5]! & 0xff;
    const ms = (bytes[6]! & 0xff) | ((bytes[7]! & 0xff) << 8);
    event.solveTimeMs = min * 60_000 + sec * 1000 + ms;
  }

  return event;
}

/** Map GAN pad states onto our press / release / reset timer signals. */
export function ganStateToSignal(state: number): StackmatSignal {
  switch (state) {
    case GanState.HANDS_ON:
    case GanState.GET_SET:
      return "press";
    case GanState.HANDS_OFF:
    case GanState.RUNNING:
      return "release";
    case GanState.STOPPED:
      // Hands returned to stop the running solve.
      return "press";
    case GanState.IDLE:
    case GanState.FINISHED:
      return "reset";
    default:
      return "ignore";
  }
}

/** Prefer the real GAN decoder; fall back to a single-byte heuristic for odd firmwares. */
export function decodeGanTimerPacket(bytes: ArrayLike<number>): StackmatSignal {
  const parsed = decodeGanSmartTimerPacket(bytes);
  if (parsed) return parsed.signal;
  if (bytes.length === 0) return "ignore";
  // Legacy single-status packets (rare clones)
  return ganStateToSignal(bytes[Math.min(3, bytes.length - 1)]! & 0xff);
}
