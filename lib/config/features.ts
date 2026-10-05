import { isDesktop } from "@/lib/config/platform";

/** Product surface flags for this release. Disabled surfaces stay visible but inert. */
export const features = {
  /** Training packs: lessons, drills and retests for each part of the solve. */
  train: true,
  /** The road from two minutes to sub-10, plus the lessons for the method itself. */
  learn: true,
  /**
   * Algorithm catalog is browsable; drills and tracking are later.
   * Keep `true` so the catalog itself stays usable.
   */
  algorithms: true,
  /**
   * A service worker that lets the timer reload without a network. Off removes it.
   * Off in the Mac app: its pages are already on the Mac and WebKit has no worker on `tauri://`.
   */
  offline: !isDesktop(),
  /** The local AI coach chat. Only the Mac app has it (it runs on the Mac through Ollama). */
  coachChat: isDesktop(),
  /** Bluetooth timers need Web Bluetooth, which the Mac app's WebKit lacks (D13). */
  bluetoothTimer: !isDesktop(),
} as const;

export const upcoming = {
  train: "4.1",
  learn: "4.1",
  algorithms: "4.0",
} as const;
