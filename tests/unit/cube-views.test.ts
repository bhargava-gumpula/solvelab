// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cube3x3x3 } from "cubing/puzzles";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { CubeNet } from "@/components/cube/cube-net";
import { readPalette } from "@/components/cube/cube-scene";
import {
  CUBE_VIEWS,
  SCRAMBLE_VIEW,
  SOLVING_ROTATION,
  SOLVING_VIEW,
  STICKER_HEX,
  type CubeView,
  type StickerColour,
} from "@/lib/config/cube";
import { applyAlgorithm, FACE_ORDER, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import type { OuterFace } from "@/lib/cube/notation";
import { PLAYER_SETUP, solvingStickeringMask } from "@/lib/cube/solving-player";

/*
 * Every picture of a cube draws a solved cube with the right colour on each
 * face: the timer's scramble previews in the scrambling hold (white on top),
 * and every teaching view in the solving hold (white cross on the bottom,
 * yellow on top, green in front, orange on the right). The views read one
 * config, so these tests stop them drifting apart again.
 */

const fill = (colour: StickerColour) => `var(--sticker-${colour})`;

function render(element: ReactElement): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(element);
  return host;
}

/** The distinct fills drawn for each face (or slot side), by data attribute. */
function fillsBy(host: HTMLElement, attribute: string): Record<string, string[]> {
  const fills: Record<string, Set<string>> = {};
  for (const rect of host.querySelectorAll(`rect[${attribute}]`)) {
    const key = rect.getAttribute(attribute)!;
    (fills[key] ??= new Set()).add(rect.getAttribute("fill")!);
  }
  return Object.fromEntries(Object.entries(fills).map(([key, set]) => [key, [...set]]));
}

describe("the view config", () => {
  it("scrambles in the WCA orientation", () => {
    expect(SCRAMBLE_VIEW).toEqual({
      U: "white",
      D: "yellow",
      F: "green",
      B: "blue",
      R: "red",
      L: "orange",
    });
    expect(SOLVING_ROTATION).toBe("z2");
  });

  it("solves in the scramble view turned by the solving rotation", () => {
    // After the rotation, the centre at each spot shows the face that came there.
    const turned = applyAlgorithm(SOLVING_ROTATION);
    for (const face of FACE_ORDER) {
      const cameFrom = turned[FACE_ORDER.indexOf(face) * 9 + 4] as OuterFace;
      expect(SOLVING_VIEW[face]).toBe(SCRAMBLE_VIEW[cameFrom]);
    }
    expect(SOLVING_VIEW).toEqual({
      U: "yellow",
      D: "white",
      F: "green",
      B: "blue",
      R: "orange",
      L: "red",
    });
  });

  it("has a theme token for every sticker colour", () => {
    const css = readFileSync("app/globals.css", "utf8");
    for (const [colour, hex] of Object.entries(STICKER_HEX)) {
      expect(css).toContain(`--sticker-${colour}: ${hex};`);
    }
  });
});

function expectSolvedFaces(host: HTMLElement, view: CubeView, faces: readonly OuterFace[]) {
  const fills = fillsBy(host, "data-face");
  expect(Object.keys(fills).sort()).toEqual([...faces].sort());
  for (const face of faces) expect(fills[face]).toEqual([fill(view[face])]);
}

describe("CaseDiagram (teaching view)", () => {
  it("draws a solved cube yellow on top, green in front, orange right, red left, blue back", () => {
    // A PLL picture draws every colour; the other kinds grey what they don't fix.
    const host = render(createElement(CaseDiagram, { facelets: SOLVED_FACELETS, kind: "pll" }));
    expectSolvedFaces(host, SOLVING_VIEW, ["U", "F", "R", "L", "B"]);
  });

  it("draws the front-right slot green on the front and orange on the right", () => {
    const host = render(createElement(CaseDiagram, { facelets: SOLVED_FACELETS, kind: "f2l" }));
    expect(fillsBy(host, "data-slot")).toEqual({ F: [fill("green")], R: [fill("orange")] });
  });
});

describe("CubeNet", () => {
  it("previews scrambles white on top by default", () => {
    const host = render(createElement(CubeNet, { facelets: SOLVED_FACELETS }));
    expectSolvedFaces(host, SCRAMBLE_VIEW, FACE_ORDER);
  });

  it("draws the solving hold when a teaching screen asks for it", () => {
    const host = render(createElement(CubeNet, { facelets: SOLVED_FACELETS, view: "solving" }));
    expectSolvedFaces(host, SOLVING_VIEW, FACE_ORDER);
  });
});

describe("Cube3D's scene", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(Object.keys(CUBE_VIEWS) as (keyof typeof CUBE_VIEWS)[])(
    "colours each face for the %s view",
    (view) => {
      const palette = readPalette(document.body, view);
      for (const face of FACE_ORDER)
        expect(palette[face]).toBe(STICKER_HEX[CUBE_VIEWS[view][face]]);
    },
  );

  it("previews scrambles white on top by default, reading the theme's tokens", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: (name: string) => (name === "--sticker-white" ? " #fafafa " : ""),
    } as CSSStyleDeclaration);
    const palette = readPalette(document.body);
    expect(palette.U).toBe("#fafafa");
    expect(palette.R).toBe(STICKER_HEX.red);
  });
});

describe("CubePlayer (teaching view)", () => {
  /** cubing.js's centre order; its 3×3 is coloured in the WCA scheme, SCRAMBLE_VIEW. */
  const CENTRE_ORDER: readonly OuterFace[] = ["U", "L", "F", "R", "B", "D"];

  async function turnedPattern() {
    const kpuzzle = await cube3x3x3.kpuzzle();
    return kpuzzle.defaultPattern().applyAlg(PLAYER_SETUP).patternData;
  }

  it("finishes every demo in the solving hold", async () => {
    expect(PLAYER_SETUP).toBe(SOLVING_ROTATION);
    const centres = (await turnedPattern()).CENTERS!.pieces;
    CENTRE_ORDER.forEach((spot, index) => {
      expect(SCRAMBLE_VIEW[CENTRE_ORDER[centres[index]!]!]).toBe(SOLVING_VIEW[spot]);
    });
  });

  /** A facelet's mask name, whether cubing.js wrote it plain or with a hint. */
  const maskName = (facelet: unknown) =>
    typeof facelet === "string" ? facelet : (facelet as { mask: string }).mask;

  /** The mask on the piece sitting at each spot once the demo has finished. */
  async function masksBySpot(stickering: string) {
    const turned = await turnedPattern();
    const mask = await solvingStickeringMask(cube3x3x3, stickering);
    return (orbit: "EDGES" | "CORNERS", spot: number) => {
      const piece = mask.orbits[orbit]!.pieces[turned[orbit]!.pieces[spot]!] as {
        facelets: unknown[];
      };
      return piece.facelets.map(maskName);
    };
  }

  // cubing.js spots: edges UF UR UB UL DF DR DB DL FR FL BR BL; corners UFR URB UBL ULF DRF DFL DLB DBR.
  const TOP = { EDGES: [0, 1, 2, 3], CORNERS: [0, 1, 2, 3] } as const;
  const orbitSpots = { EDGES: 12, CORNERS: 8 } as const;
  const onTop = (orbit: "EDGES" | "CORNERS", spot: number) =>
    (TOP[orbit] as readonly number[]).includes(spot);

  it.each(["OLL", "PLL", "COLL", "EOLL"])(
    "%s greys the first two layers and shows the yellow top",
    async (stickering) => {
      const at = await masksBySpot(stickering);
      for (const orbit of ["EDGES", "CORNERS"] as const) {
        for (let spot = 0; spot < orbitSpots[orbit]; spot++) {
          const dimmed = at(orbit, spot).every((mask) => mask === "dim");
          expect(dimmed, `${stickering} ${orbit} ${spot}`).toBe(!onTop(orbit, spot));
        }
      }
    },
  );

  it("F2L hides the yellow top and shows the first two layers", async () => {
    const at = await masksBySpot("F2L");
    for (const orbit of ["EDGES", "CORNERS"] as const) {
      for (let spot = 0; spot < orbitSpots[orbit]; spot++) {
        const hidden = at(orbit, spot).every((mask) => mask === "ignored");
        expect(hidden, `F2L ${orbit} ${spot}`).toBe(onTop(orbit, spot));
      }
    }
  });

  it("WVLS keeps the front-right slot and greys the other slots", async () => {
    const at = await masksBySpot("WVLS");
    // The front-right slot: edge FR (8) and corner DRF (4).
    expect(at("EDGES", 8)).not.toContain("dim");
    expect(at("CORNERS", 4)).not.toContain("dim");
    for (const spot of [4, 5, 6, 7, 9, 10, 11]) expect(at("EDGES", spot)[0]).toBe("dim");
    for (const spot of [5, 6, 7]) expect(at("CORNERS", spot)[0]).toBe("dim");
  });
});
