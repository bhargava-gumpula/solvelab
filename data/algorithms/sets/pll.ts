import type { AlgorithmSetData } from "../types";

/**
 * The 21 last-layer permutations.
 *
 * Every algorithm here is checked against the cube engine by
 * `tests/unit/algorithms.test.ts`: it must solve the case its entry claims,
 * allowing a U turn on either side. The first algorithm of a case defines it.
 */
export const pll: AlgorithmSetData = {
  id: "pll",
  name: "PLL",
  kind: "pll",
  cases: [
    {
      id: "pll-aa",
      name: "Aa",
      group: "Corners only",
      recognition:
        "Headlights on one side and every edge home; three corners cycle clockwise. Hold the headlights on the left for the first algorithm.",
      algorithms: [
        {
          id: "aa-1",
          moves: "x L2 D2 L' U' L D2 L' U L' x'",
          note: "J Perm's version, all with the left hand. Many sheets lead with the right-hand one below.",
        },
        { id: "aa-2", moves: "x R' U R' D2 R U' R' D2 R2 x'" },
        { id: "aa-3", moves: "x' R2 D2 R' U' R D2 R' U R' x" },
        {
          id: "aa-4",
          moves: "R' F R' B2 R F' R' B2 R2",
          note: "No rotations, but it needs comfortable B turns.",
        },
      ],
    },
    {
      id: "pll-ab",
      name: "Ab",
      group: "Corners only",
      recognition:
        "Headlights on one side and every edge home; three corners cycle anticlockwise. Hold the headlights at the back for the first algorithm: blocks of two on the front and right meet at the front-right corner, and the left side shows three different colours. Held the same way, Aa's blocks meet at the front-left corner.",
      algorithms: [
        { id: "ab-1", moves: "x L U' L D2 L' U L D2 L2 x'" },
        { id: "ab-2", moves: "x R2 D2 R U R' D2 R U' R x'" },
        { id: "ab-3", moves: "R2 B2 R F R' B2 R F' R" },
        { id: "ab-4", moves: "R B' R F2 R' B R F2 R2" },
      ],
    },
    {
      id: "pll-e",
      name: "E",
      group: "Corners only",
      recognition:
        "No headlights on any side and every edge home; the corners swap in two side-by-side pairs.",
      algorithms: [
        { id: "e-1", moves: "x' L' U L D' L' U' L D L' U' L D' L' U L D x" },
        { id: "e-2", moves: "x' R U' R' D R U R' D' R U R' D R U' R' D' x" },
        { id: "e-3", moves: "R2 U R' U' y R U R' U' R U R' U' R U R' y' R U' R2" },
      ],
    },
    {
      id: "pll-f",
      name: "F",
      group: "Corners and edges",
      recognition:
        "One side is a solved bar of three, and no other side shows headlights or a block. Hold the bar on the left for the first algorithm: the two right corners swap, and so do the front and back edges.",
      algorithms: [
        { id: "f-1", moves: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
        { id: "f-2", moves: "R' U R U' R2 F' U' F U R F R' F' R2" },
        { id: "f-3", moves: "R' U2 R' U' y R' F' R2 U' R' U R' F R U' F" },
      ],
    },
    {
      id: "pll-ga",
      name: "Ga",
      group: "Corners and edges",
      recognition:
        "A G perm: headlights on one side and a single block of two that doesn't touch them, with a corner cycle and an edge cycle together. Hold the headlights on the left: the block is on the front, at the front-right corner.",
      algorithms: [
        { id: "ga-1", moves: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
        { id: "ga-2", moves: "R2 u R' U R' U' R u' R2 y' R' U R" },
        { id: "ga-4", moves: "D' R2 U R' U R' U' R U' R2 U' D R' U R" },
      ],
    },
    {
      id: "pll-gb",
      name: "Gb",
      group: "Corners and edges",
      recognition:
        "A G perm: headlights on one side and a single block of two that doesn't touch them, with a corner cycle and an edge cycle together. Hold the headlights on the left for the first algorithm: the block is on the right side, at the back-right corner.",
      algorithms: [
        { id: "gb-1", moves: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
        { id: "gb-2", moves: "F' U' F R2 u R' U R U' R u' R2" },
        { id: "gb-3", moves: "R' d' F R2 u R' U R U' R u' R2" },
        { id: "gb-4", moves: "D R' U' R U D' R2 U R' U R U' R U' R2" },
      ],
    },
    {
      id: "pll-gc",
      name: "Gc",
      group: "Corners and edges",
      recognition:
        "A G perm: headlights on one side and a single block of two that doesn't touch them, with a corner cycle and an edge cycle together. Hold the headlights on the left: the block is on the back, at the back-right corner.",
      algorithms: [
        { id: "gc-1", moves: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
        { id: "gc-2", moves: "R2 u' R U' R U R' u R2 y R U' R'" },
        { id: "gc-4", moves: "D R2 U' R U' R U R' U R2 U D' R U' R'" },
      ],
    },
    {
      id: "pll-gd",
      name: "Gd",
      group: "Corners and edges",
      recognition:
        "A G perm: headlights on one side and a single block of two that doesn't touch them, with a corner cycle and an edge cycle together. Hold the headlights on the left: the block is on the right side, at the front-right corner.",
      algorithms: [
        { id: "gd-1", moves: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
        { id: "gd-3", moves: "R U R' y' R2 u' R U' R' U R' u R2" },
        { id: "gd-4", moves: "D' R U R' U' D R2 U' R U' R' U R' U R2" },
      ],
    },
    {
      id: "pll-h",
      name: "H",
      group: "Edges only",
      recognition:
        "Every edge swaps with the one opposite; every side shows headlights with the opposite colour between them.",
      algorithms: [
        {
          id: "h-1",
          moves: "M2 U M2 U2 M2 U M2",
          note: "Short and symmetric; the easiest PLL to learn.",
        },
        { id: "h-2", moves: "M2 U' M2 U2 M2 U' M2" },
        { id: "h-3", moves: "R2 U2 R U2 R2 U2 R2 U2 R U2 R2" },
        { id: "h-4", moves: "R2 S2 R2 U' R2 S2 R2" },
      ],
    },
    {
      id: "pll-ja",
      name: "Ja",
      group: "Corners and edges",
      recognition:
        "A bar of three on one side, and a block of two round the corner from its right-hand end as you face it; two neighbouring corners swap, and so do two neighbouring edges.",
      algorithms: [
        { id: "ja-1", moves: "R' U L' U2 R U' R' U2 R L" },
        { id: "ja-2", moves: "x R2 F R F' R U2 r' U r U2 x'" },
        { id: "ja-3", moves: "R' U2 R U R' U2 L U' R U L'" },
      ],
    },
    {
      id: "pll-jb",
      name: "Jb",
      group: "Corners and edges",
      recognition:
        "A bar of three on one side, and a block of two round the corner from its left-hand end as you face it; two neighbouring corners swap, and so do two neighbouring edges.",
      algorithms: [
        {
          id: "jb-1",
          moves: "R U R' F' R U R' U' R' F R2 U' R' U'",
          note: "Built from the T perm's first half. Most sheets stop before the last U', which only lines the top up with the sides; in a solve, finish with whichever turn of the top does that.",
        },
        { id: "jb-2", moves: "R U2 R' U' R U2 L' U R' U' L" },
      ],
    },
    {
      id: "pll-na",
      name: "Na",
      group: "Corners and edges",
      recognition:
        "A block of two on every side and no headlights; two diagonal corners swap, and so do two opposite edges. Facing any side, Na's block is on the right and Nb's on the left.",
      algorithms: [
        { id: "na-1", moves: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
        { id: "na-2", moves: "z U R' D R2 U' R D' U R' D R2 U' R D' z'" },
        { id: "na-3", moves: "R U' L U2 R' U R L' U' L U2 R' U L'" },
        { id: "na-4", moves: "L U' R U2 L' U L R' U' R U2 L' U R'" },
      ],
    },
    {
      id: "pll-nb",
      name: "Nb",
      group: "Corners and edges",
      recognition:
        "A block of two on every side and no headlights; two diagonal corners swap, and so do two opposite edges. Facing any side, Nb's block is on the left and Na's on the right.",
      algorithms: [
        { id: "nb-1", moves: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
        { id: "nb-2", moves: "z U' R D' R2 U R' D U' R D' R2 U R' D z'" },
        { id: "nb-3", moves: "r' D' F r U' r' F' D r2 U r' U' r' F r F'" },
        { id: "nb-4", moves: "R' U L' U2 R U' L R' U L' U2 R U' L" },
      ],
    },
    {
      id: "pll-ra",
      name: "Ra",
      group: "Corners and edges",
      recognition:
        "Headlights on one side and a block of two touching them on one neighbouring side only; the other two sides each show three different colours. Hold the headlights on the left for the first algorithm: the block is on the front, at the front-left corner.",
      algorithms: [
        { id: "ra-1", moves: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
        { id: "ra-2", moves: "L U2 L' U2 L F' L' U' L U L F L2" },
        { id: "ra-3", moves: "R U2 R' U2 R B' R' U' R U R B R2" },
        { id: "ra-5", moves: "R U2 R D R' U R D' R' U' R' U R U R'" },
      ],
    },
    {
      id: "pll-rb",
      name: "Rb",
      group: "Corners and edges",
      recognition:
        "Headlights on one side and a block of two touching them on one neighbouring side only; the other two sides each show three different colours. Hold the headlights on the left for the first algorithm: the block is on the back, at the back-left corner.",
      algorithms: [
        { id: "rb-1", moves: "R2 F R U R U' R' F' R U2 R' U2 R" },
        { id: "rb-2", moves: "R' U2 R U2 R' F R U R' U' R' F' R2" },
        { id: "rb-4", moves: "R' U2 R' D' R U' R' D R U R U' R' U' R" },
      ],
    },
    {
      id: "pll-t",
      name: "T",
      group: "Corners and edges",
      recognition:
        "Headlights on one side, a block of two touching them on each neighbouring side, and three different colours on the side opposite. Hold the headlights on the left for the first algorithm: the two right corners swap, and so do the left and right edges.",
      algorithms: [
        {
          id: "t-1",
          moves: "R U R' U' R' F R2 U' R' U' R U R' F'",
          note: "One of the first PLLs most people learn.",
        },
        {
          id: "t-2",
          moves: "L' U' L U L F' L2 U L U L' U' L F",
          note: "The same idea mirrored, for left-handed finger tricks.",
        },
        { id: "t-3", moves: "F R U' R' U R U R2 F' R U R U' R'" },
      ],
    },
    {
      id: "pll-ua",
      name: "Ua",
      group: "Edges only",
      recognition: "Three edges cycle anticlockwise, with one edge and every corner already home.",
      algorithms: [
        { id: "ua-1", moves: "M2 U M U2 M' U M2", note: "Fast once M turns feel natural." },
        { id: "ua-2", moves: "R U' R U R U R U' R' U' R2" },
        { id: "ua-3", moves: "R2 U' R' U' R U R U R U' R" },
        { id: "ua-5", moves: "F2 U' L R' F2 L' R U' F2" },
      ],
    },
    {
      id: "pll-ub",
      name: "Ub",
      group: "Edges only",
      recognition: "Three edges cycle clockwise.",
      algorithms: [
        { id: "ub-1", moves: "M2 U' M U2 M' U' M2" },
        { id: "ub-2", moves: "R2 U R U R' U' R' U' R' U R'" },
        { id: "ub-4", moves: "F2 U L R' F2 L' R U F2" },
      ],
    },
    {
      id: "pll-v",
      name: "V",
      group: "Corners and edges",
      recognition:
        "No bar or headlights anywhere; blocks of two on two neighbouring sides meet at the corner between them, and the other two sides each show three different colours. In a Y perm the two blocks don't share a corner.",
      algorithms: [
        { id: "v-1", moves: "R' U R' U' y R' F' R2 U' R' U R' F R F y'" },
        { id: "v-2", moves: "R U' R U R' D R D' R U' D R2 U R2 D' R2" },
        { id: "v-3", moves: "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2" },
        { id: "v-4", moves: "z D' R2 D R2 U R' D' R U' R U R' D R U' z'" },
      ],
    },
    {
      id: "pll-y",
      name: "Y",
      group: "Corners and edges",
      recognition:
        "No bar or headlights anywhere, but blocks of two on two neighbouring sides that don't share a corner. Hold the blocks on the front and right: the front-right and back-left corners swap, and so do the back and left edges.",
      algorithms: [
        { id: "y-1", moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
        { id: "y-2", moves: "F R' F R2 U' R' U' R U R' F' R U R' U' F'" },
      ],
    },
    {
      id: "pll-z",
      name: "Z",
      group: "Edges only",
      recognition: "Two pairs of neighbouring edges swap; the sides show two colours alternating.",
      algorithms: [
        { id: "z-1", moves: "M2 U M2 U M' U2 M2 U2 M' U2" },
        { id: "z-2", moves: "M' U M2 U M2 U M' U2 M2" },
        { id: "z-3", moves: "M' U' M2 U' M2 U' M' U2 M2" },
        { id: "z-4", moves: "R' U' R U' R U R U' R' U R U R2 U' R'" },
        { id: "z-5", moves: "M2 U' M2 U' M' U2 M2 U2 M'" },
      ],
    },
  ],
};
