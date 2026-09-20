import type { AlgorithmSetData } from "../types";

/**
 * The beginner's way through the last layer: orient in two steps, then permute
 * in two. Every step that is also a full-set case points at it, so learning it
 * here counts there too — knowing Sune is knowing Sune. Only the three
 * edge-orientation cases are this set's own, because they finish half a layer
 * and so belong to no other set.
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
      recognition: "No edge faces up yet.",
      algorithms: [
        {
          id: "2oll-dot-1",
          moves: "F R U R' U' F' f R U R' U' f'",
          note: "The line algorithm, then the L one.",
        },
        {
          id: "2oll-dot-2",
          moves: "R U2 R2 F R F' U2 R' F R F'",
          note: "One look: this is OLL 1, which finishes the whole layer.",
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
      recognition: "Two edges face up, next to each other, pointing back and left.",
      algorithms: [
        { id: "2oll-l-1", moves: "f R U R' U' f'" },
        { id: "2oll-l-2", moves: "F U R U' R' F'" },
        { id: "2oll-l-3", moves: "F' U' L' U L F", note: "The same idea on the left hand." },
      ],
    },
    {
      id: "2oll-sune",
      name: "Sune",
      group: "Step 2: orient the corners",
      sameAs: "oll-27",
      recognition: "One corner faces up, at the front left, with the other three pointing round.",
      algorithms: [],
    },
    {
      id: "2oll-antisune",
      name: "Antisune",
      group: "Step 2: orient the corners",
      sameAs: "oll-26",
      recognition: "One corner faces up, at the front right. The mirror of Sune.",
      algorithms: [],
    },
    {
      id: "2oll-h",
      name: "Double Sune",
      group: "Step 2: orient the corners",
      sameAs: "oll-21",
      recognition: "No corner faces up; the four side stickers face out in pairs.",
      algorithms: [],
    },
    {
      id: "2oll-pi",
      name: "Pi",
      group: "Step 2: orient the corners",
      sameAs: "oll-22",
      recognition: "No corner faces up, with two stickers on one side.",
      algorithms: [],
    },
    {
      id: "2oll-headlights",
      name: "Headlights",
      group: "Step 2: orient the corners",
      sameAs: "oll-23",
      recognition: "Two corners face up at the back, like a pair of headlights.",
      algorithms: [],
    },
    {
      id: "2oll-bowtie",
      name: "Bowtie",
      group: "Step 2: orient the corners",
      sameAs: "oll-24",
      recognition: "Two corners face up, diagonal from each other.",
      algorithms: [],
    },
    {
      id: "2oll-fish",
      name: "Fish",
      group: "Step 2: orient the corners",
      sameAs: "oll-25",
      recognition: "Two corners face up, the other diagonal pair pointing out.",
      algorithms: [],
    },
  ],
};

export const twoLookPll: AlgorithmSetData = {
  id: "two-look-pll",
  name: "2-look PLL",
  kind: "pll",
  cases: [
    {
      id: "2pll-aa",
      name: "Three corners, clockwise",
      group: "Step 1: put the corners home",
      sameAs: "pll-aa",
      recognition:
        "Two corners match on one side — hold that pair at the back. The other three cycle.",
      algorithms: [],
    },
    {
      id: "2pll-ab",
      name: "Three corners, anticlockwise",
      group: "Step 1: put the corners home",
      sameAs: "pll-ab",
      recognition: "The same with the pair held at the back, cycling the other way.",
      algorithms: [],
    },
    {
      id: "2pll-e",
      name: "Corners swap across",
      group: "Step 1: put the corners home",
      sameAs: "pll-e",
      recognition: "No two corners match on any side; they swap diagonally.",
      algorithms: [],
    },
    {
      id: "2pll-ua",
      name: "Three edges, anticlockwise",
      group: "Step 2: put the edges home",
      sameAs: "pll-ua",
      algorithms: [],
    },
    {
      id: "2pll-ub",
      name: "Three edges, clockwise",
      group: "Step 2: put the edges home",
      sameAs: "pll-ub",
      algorithms: [],
    },
    {
      id: "2pll-z",
      name: "Two pairs swap",
      group: "Step 2: put the edges home",
      sameAs: "pll-z",
      algorithms: [],
    },
    {
      id: "2pll-h",
      name: "All four swap",
      group: "Step 2: put the edges home",
      sameAs: "pll-h",
      algorithms: [],
    },
  ],
};
