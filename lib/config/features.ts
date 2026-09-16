/** Product surface flags for this release. Disabled surfaces stay visible but inert. */
export const features = {
  /** Practice sessions after a diagnostic. Visible in nav; page is coming-soon until 3.1. */
  train: false,
  /** Lesson plans. Visible in nav; page is coming-soon until 3.2. */
  learn: false,
  /**
   * Algorithm catalog is browsable; drills and tracking are later.
   * Keep `true` so the catalog itself stays usable.
   */
  algorithms: true,
} as const;

export const upcoming = {
  train: "3.1",
  learn: "3.2",
  algorithms: "3.1–3.2",
} as const;
