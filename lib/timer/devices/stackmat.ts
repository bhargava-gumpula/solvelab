/**
 * Minimal Stackmat-style packet helpers.
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
  if (code === 0x09 || code === 0x39 || code === 0x1) return "press";
  if (code === 0x0c || code === 0x3c || code === 0x2) return "release";
  return "ignore";
}

export function decodeStackmatPacket(bytes: ArrayLike<number>): StackmatSignal {
  if (bytes.length === 0) return "ignore";
  // Prefer the last status byte in the packet.
  return interpretStackmatStatus(bytes[bytes.length - 1]!);
}
