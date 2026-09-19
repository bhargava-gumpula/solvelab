/** Product surface flags for this release. Disabled surfaces stay visible but inert. */
export const features = {
  /** Training packs (lessons, drills, retests). Visible in nav; page is coming-soon until 3.4. */
  train: false,
  /** Lesson plans. Visible in nav; page is coming-soon until 3.4. */
  learn: false,
  /**
   * Algorithm catalog is browsable; drills and tracking are later.
   * Keep `true` so the catalog itself stays usable.
   */
  algorithms: true,
} as const;

export const upcoming = {
  train: "3.4",
  learn: "3.4",
  algorithms: "3.3",
} as const;
