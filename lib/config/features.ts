/** Product surface flags for this release. Disabled surfaces stay visible but inert. */
export const features = {
  /** Training packs (lessons, drills, retests). Visible in nav; page is coming-soon until 4.1. */
  train: false,
  /** Lesson plans. Visible in nav; page is coming-soon until 4.1. */
  learn: false,
  /**
   * Algorithm catalog is browsable; drills and tracking are later.
   * Keep `true` so the catalog itself stays usable.
   */
  algorithms: true,
} as const;

export const upcoming = {
  train: "4.1",
  learn: "4.1",
  algorithms: "4.0",
} as const;
