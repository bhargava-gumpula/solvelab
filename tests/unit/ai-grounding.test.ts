import { describe, expect, it } from "vitest";
import { unknownReferences } from "@/lib/ai/grounding";

describe("the grounding check on AI answers", () => {
  it("lets real packs and tests through, however they are written", () => {
    expect(
      unknownReferences(
        'Start with the **Lookahead, properly** pack, then take the "F2L test". The **F2L** test comes after.',
      ),
    ).toEqual([]);
  });

  it("names a pack, test or drill SolveLab doesn't have", () => {
    expect(
      unknownReferences(
        'Try the "Cross Mastery" pack, the **Speed Blitz** drill and the pack called “Finger Gym”.',
      ),
    ).toEqual(["Cross Mastery", "Speed Blitz", "Finger Gym"]);
  });

  it("leaves ordinary advice alone", () => {
    expect(
      unknownReferences(
        "Do **slow solves** for a week. Your cross test result is fine, and a pack of cards won't help.",
      ),
    ).toEqual([]);
  });

  it("reports a made-up name once", () => {
    expect(unknownReferences('The "Cross Mastery" pack. Again: "Cross Mastery" pack.')).toEqual([
      "Cross Mastery",
    ]);
  });
});
