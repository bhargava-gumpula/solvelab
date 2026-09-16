/**
 * Minimal Stackmat-style packet helpers + multi-vendor decode.
 * Real Gen4 Bluetooth devices stream status bytes; we normalize to press/release.
 */

export type StackmatSignal = "press" | "release" | "reset" | "ignore";

/** Interpret a single status nibble/byte from common Stackmat-compatible timers. */
export function interpretStackmatStatus(byte: number): StackmatSignal {
  const code = byte & 0xff;
  // Heuristic map used by several open-source timers:
  // green / running-adjacent → hands off (release to start when armed)
  // red / hands-on → press
  // reset / idle packages → reset
  if (code === 0x0a || code === 0x3a) return "reset";
  if (code === 0x09 || code === 0x39) return "press";
  if (code === 0x0c || code === 0x3c) return "release";
  return "ignore";
}

export function decodeStackmatPacket(bytes: ArrayLike<number>): StackmatSignal {
  if (bytes.length === 0) return "ignore";
  return interpretStackmatStatus(bytes[bytes.length - 1]!);
}

/**
 * Decode a notification from either Stackmat-compatible or GAN-style timers.
 * Returns the first non-ignore signal found.
 */
export function decodeTimerNotification(
  bytes: ArrayLike<number>,
  ganDecode: (b: ArrayLike<number>) => StackmatSignal,
): StackmatSignal {
  const stackmat = decodeStackmatPacket(bytes);
  if (stackmat !== "ignore") return stackmat;
  return ganDecode(bytes);
}
