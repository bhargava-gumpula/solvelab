/** Product surface flags for this release. Hidden features stay in the repo for later. */
export const features = {
  /** Practice sessions after a diagnostic. */
  train: false,
  /** Lesson plans. */
  learn: false,
  /**
   * Algorithm catalog is visible as a preview; drills and tracking are later.
   * Keep `true` so the page stays in nav.
   */
  algorithms: true,
} as const;

export const upcoming = {
  train: "3.1",
  learn: "3.2",
  algorithms: "3.1–3.2",
} as const;
