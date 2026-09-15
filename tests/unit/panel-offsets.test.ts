import { describe, expect, it } from "vitest";
import { sanitizePanelOffsets, usableOffset } from "@/lib/timer/panel-offsets";

describe("panel offsets", () => {
  it("keeps small drag offsets and drops oversized leftovers", () => {
    expect(usableOffset({ x: -40, y: 12 })).toEqual({ x: -40, y: 12 });
    expect(usableOffset({ x: -300, y: 0 })).toBeNull();
    expect(usableOffset({ x: 0, y: 100 })).toBeNull();
  });

  it("sanitizes a map of panel offsets", () => {
    expect(
      sanitizePanelOffsets({
        stats: { x: -20, y: 8 },
        cube: { x: 500, y: 0 },
      }),
    ).toEqual({ stats: { x: -20, y: 8 } });
  });
});
