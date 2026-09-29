import { describe, expect, it } from "vitest";
import {
  algorithmsFor,
  caseStateFor,
  getAlgorithmSet,
  recognitionText,
} from "@/lib/algorithms/catalog";
import { casePicture } from "@/lib/algorithms/orientation";
import { caseStateOf } from "@/lib/cube/case-check";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import {
  cornersFacingUp,
  edgesFacingUp,
  f2lRecognition,
  hasBar,
  headlightSides,
  readF2lPair,
  topColourFacing,
} from "@/lib/cube/describe";

/** A case as its algorithm defines it: undone on a solved cube, no set-up turn. */
const ll = (moves: string) => caseStateOf(moves, "pll");
const oll = (moves: string) => caseStateOf(moves, "oll");

describe("reading an F2L case off the cube", () => {
  // The research notes' engine-checked list of where the white sticker faces
  // (audit 6.2 item 1), for SolveLab's own case numbers.
  const WHITE: Record<number, string> = {
    1: "right",
    2: "back",
    3: "left",
    4: "front",
    12: "back",
    13: "front",
    14: "front",
    15: "front",
    16: "front",
    22: "front",
    17: "right",
    18: "right",
    34: "right",
    19: "left",
    20: "left",
    23: "left",
    24: "left",
    33: "left",
    32: "back",
    35: "back",
  };

  it("finds the white sticker where the notes' engine check found it", () => {
    const set = getAlgorithmSet("f2l")!;
    for (const [number, facing] of Object.entries(WHITE)) {
      const entry = set.cases.find((item) => item.id === `f2l-${number}`)!;
      const state = caseStateOf(entry.algorithms[0]!.moves, "f2l");
      expect(readF2lPair(state).white, `F2L ${number}`).toBe(facing);
    }
  });

  it("describes F2L 1 (R U R') in words", () => {
    // Undoing R U R' leaves the corner above the slot with white to the right
    // and the edge on top at the back with green up.
    expect(f2lRecognition(caseStateOf("R U R'", "f2l"))).toBe(
      "Corner on top, right above its slot, white facing to the right. Edge on top at the back, green facing up.",
    );
  });

  it("says when a piece is already in the slot", () => {
    const reading = readF2lPair(caseStateOf("R U' R' U R U2 R' U R U' R'", "f2l"));
    expect(reading.corner).toBe("slot");
    expect(reading.edge).toBe("slot");
  });
});

describe("reading a last-layer case off the cube", () => {
  it("sees the edges and corners that face up", () => {
    // The L-shape algorithms from the notes: f R U R' U' f' wants the L at
    // front-right; F U R U' R' F' at back-left.
    expect(edgesFacingUp(oll("f R U R' U' f'")).sort()).toEqual(["front", "right"]);
    expect(edgesFacingUp(oll("F U R U' R' F'")).sort()).toEqual(["back", "left"]);
    // Sune has its one corner up at front-left, Antisune at back-right.
    expect(cornersFacingUp(oll("R U R' U R U2 R'"))).toEqual(["front-left"]);
    expect(cornersFacingUp(oll("R U2 R' U' R U' R'"))).toEqual(["back-right"]);
  });

  it("sees which way a corner's top colour points", () => {
    // Antisune: the front-left corner's top colour faces you.
    expect(topColourFacing(oll("R U2 R' U' R U' R'"), "front-left")).toBe("front");
  });

  it("sees headlights and bars", () => {
    // T perm and this Aa both want the headlights on the left.
    expect(headlightSides(ll("R U R' U' R' F R2 U' R' U' R U R' F'"))).toEqual(["left"]);
    expect(headlightSides(ll("x L2 D2 L' U' L D2 L' U L' x'"))).toEqual(["left"]);
    // A U perm has a solved bar; the H perm has headlights on every side.
    expect(
      hasBar(ll("R U' R U R U R U' R' U' R2"), "back") ||
        hasBar(ll("R U' R U R U R U' R' U' R2"), "front"),
    ).toBe(true);
    expect(headlightSides(ll("M2 U M2 U2 M2 U M2")).length).toBe(4);
  });
});

describe("F2L recognition in the algorithm bank", () => {
  const set = getAlgorithmSet("f2l")!;
  const WORDS: Record<string, string> = {
    up: "up",
    down: "down",
    front: "towards you",
    back: "to the back",
    left: "to the left",
    right: "to the right",
  };

  it("carries no hand-written recognition that could drift from the picture", () => {
    for (const entry of set.cases) expect(entry.recognition, entry.id).toBeUndefined();
  });

  it("describes every case as drawn for each of its algorithms", () => {
    for (const entry of set.cases) {
      for (const algorithm of algorithmsFor(entry)) {
        const { facelets } = casePicture(entry, "f2l", algorithm.moves);
        const text = recognitionText(entry, "f2l", facelets)!;
        const reading = readF2lPair(facelets);
        expect(text, `${entry.id} ${algorithm.moves}`).toContain(
          `white facing ${WORDS[reading.white]}`,
        );
        expect(text, `${entry.id} ${algorithm.moves}`).toContain(
          `green facing ${WORDS[reading.green]}`,
        );
        const cornerWords =
          reading.corner === "slot"
            ? "Corner in its slot"
            : reading.corner === "front-right"
              ? "Corner on top, right above its slot"
              : `Corner on top at the ${reading.corner.replace("-", " ")}`;
        expect(text, entry.id).toContain(cornerWords);
        expect(text, entry.id).toContain(
          reading.edge === "slot" ? "Edge in its slot" : `Edge on top at the ${reading.edge}`,
        );
      }
    }
  });

  it("keeps written recognition for the other sets", () => {
    const pllT = getAlgorithmSet("pll")!.cases.find((entry) => entry.id === "pll-t")!;
    expect(recognitionText(pllT, "pll", caseStateOf(pllT.algorithms[0]!.moves, "pll"))).toBe(
      pllT.recognition,
    );
  });
});

describe("written recognition when the picture is turned", () => {
  it("says how to turn back to the hold the text describes", () => {
    const pllSet = getAlgorithmSet("pll")!;
    const turned = pllSet.cases
      .flatMap((entry) =>
        algorithmsFor(entry).map((algorithm) => ({
          entry,
          picture: casePicture(entry, "pll", algorithm.moves),
        })),
      )
      .filter(({ entry, picture }) => entry.recognition && picture.quarter !== 0);
    expect(turned.length).toBeGreaterThan(0);
    for (const { entry, picture } of turned) {
      const text = recognitionText(entry, "pll", picture.facelets, picture.quarter)!;
      const back = ["", "U", "U2", "U'"][(4 - picture.quarter) % 4]!;
      expect(text, entry.id).toContain(`turn this picture's top ${back} to match`);
      // Turning the picture's top that way gives back the case the text describes.
      expect(applyAlgorithm(back, picture.facelets), entry.id).toBe(caseStateFor(entry, "pll"));
    }
  });
});
