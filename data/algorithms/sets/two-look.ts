import type { AlgorithmSetData } from "../types";

/**
 * The beginner's way through the last layer: orient in two steps, then permute
 * in two. Every step that is also a full-set case points at it, so learning it
 * here counts there too — knowing Sune is knowing Sune. Only the three
 * edge-orientation cases are this set's own, because they finish half a layer
 * and so belong to no other set.
 *
 * A recognition text gives the hold for the case's first algorithm; an
 * algorithm that wants another hold says so in its note. Both are checked on
 * the cube by `tests/unit/last-layer-texts.test.ts`.
 */
export const twoLookOll: AlgorithmSetData = {
  id: "two-look-oll",
  name: "2-look OLL",
  kind: "oll",
  cases: [
    {
      id: "2oll-dot",
      name: "Dot",
      group: "Step 1: make the cross",
      kind: "eoll",
      recognition: "No edge faces up yet. It looks the same from every side, so hold it any way.",
      algorithms: [
        {
          id: "2oll-dot-1",
          moves: "F R U R' U' F' f R U R' U' f'",
          note: "The line algorithm, then the L one straight away: the first half leaves the L at the front right, where f R U R' U' f' wants it.",
        },
        {
          id: "2oll-dot-2",
          moves: "R U2 R2 F R F' U2 R' F R F'",
          note: "One algorithm instead of two. This is OLL 1's: from any angle it makes the cross, but it turns the corners up too only on the OLL 1 pattern, held so the two sides with three yellow stickers are on the left and right.",
        },
      ],
    },
    {
      id: "2oll-line",
      name: "Line",
      group: "Step 1: make the cross",
      kind: "eoll",
      recognition: "Two edges face up, opposite each other. Hold the line side to side.",
      algorithms: [{ id: "2oll-line-1", moves: "F R U R' U' F'" }],
    },
    {
      id: "2oll-l",
      name: "L shape",
      group: "Step 1: make the cross",
      kind: "eoll",
      recognition:
        "Two edges face up, next to each other. Hold the L at the front right, with those edges at the front and right.",
      algorithms: [
        { id: "2oll-l-1", moves: "f R U R' U' f'" },
        {
          id: "2oll-l-2",
          moves: "F U R U' R' F'",
          note: "Hold the L at the back left, with its edges at the back and left.",
        },
        {
          id: "2oll-l-3",
          moves: "F' U' L' U L F",
          note: "The same idea on the left hand. Hold the L at the back right, with its edges at the back and right.",
        },
      ],
    },
    {
      id: "2oll-sune",
      name: "Sune",
      group: "Step 2: orient the corners",
      sameAs: "oll-27",
      recognition:
        "One corner faces up: hold it at the front left. The front-right corner's yellow faces you.",
      algorithms: [],
    },
    {
      id: "2oll-antisune",
      name: "Antisune",
      group: "Step 2: orient the corners",
      sameAs: "oll-26",
      recognition:
        "One corner faces up: hold it at the back right. The front-left corner's yellow faces you.",
      algorithms: [],
    },
    {
      id: "2oll-h",
      name: "H (Double Sune)",
      group: "Step 2: orient the corners",
      sameAs: "oll-21",
      recognition:
        "No corner faces up, and two opposite sides each show a pair of yellow stickers, like headlights. Hold those pairs at the front and back.",
      algorithms: [],
    },
    {
      id: "2oll-pi",
      name: "Pi",
      group: "Step 2: orient the corners",
      sameAs: "oll-22",
      recognition:
        "No corner faces up, and only one side shows a pair of yellow stickers: hold that side on the left.",
      algorithms: [],
    },
    {
      id: "2oll-headlights",
      name: "Headlights",
      group: "Step 2: orient the corners",
      sameAs: "oll-23",
      recognition:
        "Two corners face up, side by side. Hold them at the back: the two front corners then show their yellow at you, like a pair of headlights.",
      algorithms: [],
    },
    {
      id: "2oll-bowtie",
      name: "T (Chameleon)",
      group: "Step 2: orient the corners",
      sameAs: "oll-24",
      recognition:
        "Two corners face up, side by side. Hold them on the right: the other two show their yellow on the front and on the back.",
      algorithms: [],
    },
    {
      id: "2oll-fish",
      name: "Bowtie (L)",
      group: "Step 2: orient the corners",
      sameAs: "oll-25",
      recognition:
        "Two corners face up, diagonally opposite. Hold them at the front left and back right, with the front-right corner's yellow facing you.",
      algorithms: [],
    },
  ],
};

/**
 * Corners by T perm and Y perm, then edges: six algorithms, and T and Y are
 * full-PLL cases the learner keeps. The A perms and E perm are the other
 * published route for the corners, kept as an alternative.
 */
export const twoLookPll: AlgorithmSetData = {
  id: "two-look-pll",
  name: "2-look PLL",
  kind: "pll",
  cases: [
    {
      id: "2pll-t",
      name: "Neighbouring corners swap (T perm)",
      group: "Step 1: put the corners home",
      sameAs: "pll-t",
      recognition:
        "Headlights on one side: its two corners show the same colour. Hold that side on the left and do the T perm.",
      algorithms: [],
    },
    {
      id: "2pll-y",
      name: "Diagonal corners swap (Y perm)",
      group: "Step 1: put the corners home",
      sameAs: "pll-y",
      recognition:
        "No headlights on any side. The Y perm puts the corners home from any angle; held with the 1x2 blocks on the front and right, it solves the edges too.",
      algorithms: [],
    },
    {
      id: "2pll-ua",
      name: "Three edges, anticlockwise",
      group: "Step 2: put the edges home",
      sameAs: "pll-ua",
      recognition:
        "One side is a solved bar: hold it at the back. The front edge belongs on the right.",
      algorithms: [],
    },
    {
      id: "2pll-ub",
      name: "Three edges, clockwise",
      group: "Step 2: put the edges home",
      sameAs: "pll-ub",
      recognition:
        "One side is a solved bar: hold it at the back. The front edge belongs on the left.",
      algorithms: [],
    },
    {
      id: "2pll-z",
      name: "Two pairs swap",
      group: "Step 2: put the edges home",
      sameAs: "pll-z",
      recognition:
        "No bar. Every side shows headlights with a neighbouring side's colour between them. Hold it so the front edge belongs on the right.",
      algorithms: [],
    },
    {
      id: "2pll-h",
      name: "All four swap",
      group: "Step 2: put the edges home",
      sameAs: "pll-h",
      recognition:
        "No bar. Every side shows headlights with the opposite side's colour between them. Any angle works.",
      algorithms: [],
    },
    {
      id: "2pll-aa",
      name: "Three corners, clockwise",
      group: "Step 1, another way: A perms and E",
      sameAs: "pll-aa",
      recognition:
        "Instead of the T perm, for headlights on one side. For x L2 D2 L' U' L D2 L' U L' x', hold the headlights on the left.",
      algorithms: [],
    },
    {
      id: "2pll-ab",
      name: "Three corners, anticlockwise",
      group: "Step 1, another way: A perms and E",
      sameAs: "pll-ab",
      recognition:
        "Also instead of the T perm, for headlights on one side. For x L U' L D2 L' U L D2 L2 x', hold the headlights at the back.",
      algorithms: [],
    },
    {
      id: "2pll-e",
      name: "Two corner pairs swap",
      group: "Step 1, another way: A perms and E",
      sameAs: "pll-e",
      recognition:
        "Instead of the Y perm, for no headlights; it puts the corners home from any angle. In its own case every edge is home and the corners swap in two side-by-side pairs. To solve the whole case in one go, hold it so the front's corner stickers match the edges on the left and right.",
      algorithms: [],
    },
  ],
};
