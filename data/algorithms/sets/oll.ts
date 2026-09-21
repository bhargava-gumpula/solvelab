import type { AlgorithmSetData } from "../types";

/**
 * The 57 last-layer orientations.
 *
 * Every algorithm is checked against the cube engine by
 * `tests/unit/algorithms.test.ts`: it must leave the last layer facing up with
 * the first two layers untouched. The first algorithm of a case defines it.
 */
export const oll: AlgorithmSetData = {
  id: "oll",
  name: "OLL",
  kind: "oll",
  cases: [
    {
      id: "oll-1",
      name: "OLL 1",
      group: "Dot",
      aliases: ["Runway"],
      algorithms: [
        { id: "o1-1", moves: "R U2 R2 F R F' U2 R' F R F'" },
        { id: "o1-2", moves: "R U B' R B R2 U' R' F R F'" },
      ],
    },
    {
      id: "oll-2",
      name: "OLL 2",
      group: "Dot",
      aliases: ["Zamboni"],
      algorithms: [
        { id: "o2-1", moves: "F R U R' U' F' f R U R' U' f'" },
        { id: "o2-2", moves: "r U r' U2 r U2 R' U2 R U' r'" },
      ],
    },
    {
      id: "oll-3",
      name: "OLL 3",
      group: "Dot",
      aliases: ["Anti-Nazi"],
      algorithms: [
        { id: "o3-1", moves: "f R U R' U' f' U' F R U R' U' F'" },
        { id: "o3-2", moves: "f' L' U' L U f U F R U R' U' F'" },
        { id: "o3-3", moves: "r' R2 U R' U r U2 r' U M'" },
      ],
    },
    {
      id: "oll-4",
      name: "OLL 4",
      group: "Dot",
      aliases: ["Nazi"],
      algorithms: [
        { id: "o4-1", moves: "f R U R' U' f' U F R U R' U' F'" },
        { id: "o4-2", moves: "f' L' U' L U f U' F R U R' U' F'" },
        { id: "o4-3", moves: "M U' r U2 r' U' R U' R' M'" },
      ],
    },
    {
      id: "oll-5",
      name: "OLL 5",
      group: "Square",
      aliases: ["Wario"],
      algorithms: [
        { id: "o5-1", moves: "r' U2 R U R' U r" },
        { id: "o5-2", moves: "l' U2 L U L' U l" },
      ],
    },
    {
      id: "oll-6",
      name: "OLL 6",
      group: "Square",
      aliases: ["Mario"],
      algorithms: [
        { id: "o6-1", moves: "r U2 R' U' R U' r'" },
        { id: "o6-2", moves: "l U2 L' U' L U' l'" },
      ],
    },
    {
      id: "oll-7",
      name: "OLL 7",
      group: "Lightning",
      aliases: ["Lightning"],
      algorithms: [{ id: "o7-1", moves: "r U R' U R U2 r'" }],
    },
    {
      id: "oll-8",
      name: "OLL 8",
      group: "Lightning",
      aliases: ["Reverse Lightning"],
      algorithms: [{ id: "o8-1", moves: "r' U' R U' R' U2 r" }],
    },
    {
      id: "oll-9",
      name: "OLL 9",
      group: "Fish",
      aliases: ["Kite"],
      algorithms: [{ id: "o9-1", moves: "R U R' U' R' F R2 U R' U' F'" }],
    },
    {
      id: "oll-10",
      name: "OLL 10",
      group: "Fish",
      aliases: ["Anti-Kite"],
      algorithms: [
        { id: "o10-1", moves: "R U R' U R' F R F' R U2 R'" },
        { id: "o10-2", moves: "R U R' y R' F R U' R' F' R" },
      ],
    },
    {
      id: "oll-11",
      name: "OLL 11",
      group: "Lightning",
      aliases: ["Downstairs"],
      algorithms: [
        { id: "o11-1", moves: "r U R' U R' F R F' R U2 r'" },
        { id: "o11-2", moves: "r' R2 U R' U R U2 R' U M'" },
        { id: "o11-3", moves: "M R U R' U R U2 R' U M'" },
      ],
    },
    {
      id: "oll-12",
      name: "OLL 12",
      group: "Lightning",
      aliases: ["Upstairs"],
      algorithms: [
        { id: "o12-1", moves: "F R U R' U' F' U F R U R' U' F'" },
        { id: "o12-2", moves: "M' R' U' R U' R' U2 R U' R r'" },
        { id: "o12-3", moves: "M' R' U' R U' R' U2 R U' M" },
      ],
    },
    {
      id: "oll-13",
      name: "OLL 13",
      group: "Knight move",
      aliases: ["Gun"],
      algorithms: [
        { id: "o13-1", moves: "F U R U' R2 F' R U R U' R'" },
        { id: "o13-2", moves: "r U' r' U' r U r' F' U F" },
      ],
    },
    {
      id: "oll-14",
      name: "OLL 14",
      group: "Knight move",
      aliases: ["Anti-Gun"],
      algorithms: [
        { id: "o14-1", moves: "R' F R U R' F' R F U' F'" },
        { id: "o14-2", moves: "r U R' U' r' F R2 U R' U' F'" },
      ],
    },
    {
      id: "oll-15",
      name: "OLL 15",
      group: "Knight move",
      aliases: ["Squeegee"],
      algorithms: [
        { id: "o15-1", moves: "l' U' l L' U' L U l' U l" },
        { id: "o15-2", moves: "r' U' r R' U' R U r' U r" },
      ],
    },
    {
      id: "oll-16",
      name: "OLL 16",
      group: "Knight move",
      aliases: ["Anti-Squeegee"],
      algorithms: [{ id: "o16-1", moves: "r U r' R U R' U' r U' r'" }],
    },
    {
      id: "oll-17",
      name: "OLL 17",
      group: "Dot",
      aliases: ["Slash"],
      algorithms: [{ id: "o17-1", moves: "R U R' U R' F R F' U2 R' F R F'" }],
    },
    {
      id: "oll-18",
      name: "OLL 18",
      group: "Dot",
      aliases: ["Crown"],
      algorithms: [
        { id: "o18-1", moves: "r U R' U R U2 r2 U' R U' R' U2 r" },
        { id: "o18-2", moves: "F R U R' U y' R' U2 R' F R F'" },
      ],
    },
    {
      id: "oll-19",
      name: "OLL 19",
      group: "Dot",
      aliases: ["Bunny"],
      algorithms: [
        { id: "o19-1", moves: "r' R U R U R' U' r R2 F R F'" },
        { id: "o19-2", moves: "M U R U R' U' M' R' F R F'" },
      ],
    },
    {
      id: "oll-20",
      name: "OLL 20",
      group: "Dot",
      aliases: ["Checkers"],
      algorithms: [
        { id: "o20-1", moves: "r U R' U' M2 U R U' R' U' M'" },
        { id: "o20-2", moves: "M U R U R' U' M2 U R U' r'" },
      ],
    },
    {
      id: "oll-21",
      name: "OLL 21",
      group: "All edges oriented",
      aliases: ["Double Sune"],
      algorithms: [
        { id: "o21-1", moves: "R U2 R' U' R U R' U' R U' R'" },
        { id: "o21-2", moves: "F R U R' U' R U R' U' R U R' U' F'" },
        { id: "o21-3", moves: "R U R' U R U' R' U R U2 R'" },
      ],
    },
    {
      id: "oll-22",
      name: "OLL 22",
      group: "All edges oriented",
      aliases: ["Pi"],
      algorithms: [
        { id: "o22-1", moves: "R U2 R2 U' R2 U' R2 U2 R" },
        { id: "o22-2", moves: "f R U R' U' f' F R U R' U' F'" },
      ],
    },
    {
      id: "oll-23",
      name: "OLL 23",
      group: "All edges oriented",
      aliases: ["Headlights"],
      algorithms: [
        { id: "o23-1", moves: "R2 D R' U2 R D' R' U2 R'" },
        { id: "o23-2", moves: "R2 D' R U2 R' D R U2 R" },
      ],
    },
    {
      id: "oll-24",
      name: "OLL 24",
      group: "All edges oriented",
      aliases: ["Bowtie"],
      algorithms: [
        { id: "o24-1", moves: "r U R' U' r' F R F'" },
        { id: "o24-2", moves: "x' R U R' D R U' R' D' x" },
      ],
    },
    {
      id: "oll-25",
      name: "OLL 25",
      group: "All edges oriented",
      aliases: ["Fish Salad"],
      algorithms: [
        { id: "o25-1", moves: "F' r U R' U' r' F R" },
        { id: "o25-2", moves: "x' R U' R' D R U R' D' x" },
        { id: "o25-3", moves: "R U2 R D R' U2 R D' R2" },
      ],
    },
    {
      id: "oll-26",
      name: "OLL 26",
      group: "All edges oriented",
      aliases: ["Antisune"],
      algorithms: [
        { id: "o26-1", moves: "R U2 R' U' R U' R'" },
        { id: "o26-2", moves: "L' U' L U' L' U2 L" },
      ],
    },
    {
      id: "oll-27",
      name: "OLL 27",
      group: "All edges oriented",
      aliases: ["Sune"],
      algorithms: [
        { id: "o27-1", moves: "R U R' U R U2 R'" },
        { id: "o27-2", moves: "L' U2 L U L' U L" },
      ],
    },
    {
      id: "oll-28",
      name: "OLL 28",
      group: "Other",
      aliases: ["Stealth"],
      algorithms: [
        { id: "o28-1", moves: "r U R' U' r' R U R U' R'" },
        { id: "o28-2", moves: "M' U M U2 M' U M" },
      ],
    },
    {
      id: "oll-29",
      name: "OLL 29",
      group: "Awkward",
      aliases: ["Spotted Chameleon"],
      algorithms: [
        { id: "o29-1", moves: "R U R' U' R U' R' F' U' F R U R'" },
        { id: "o29-2", moves: "M U R U R' U' R' F R F' M'" },
      ],
    },
    {
      id: "oll-30",
      name: "OLL 30",
      group: "Awkward",
      aliases: ["Knight Move"],
      algorithms: [
        { id: "o30-1", moves: "F R' F R2 U' R' U' R U R' F2" },
        { id: "o30-2", moves: "r' D' r U' r' D r2 U' r' U r U r'" },
      ],
    },
    {
      id: "oll-31",
      name: "OLL 31",
      group: "P",
      aliases: ["P"],
      algorithms: [
        { id: "o31-1", moves: "R' U' F U R U' R' F' R" },
        { id: "o31-2", moves: "S' L' U' L U L F' L' f" },
      ],
    },
    {
      id: "oll-32",
      name: "OLL 32",
      group: "P",
      aliases: ["Anti-P"],
      algorithms: [
        { id: "o32-1", moves: "L U F' U' L' U L F L'" },
        { id: "o32-2", moves: "S R U R' U' R' F R f'" },
      ],
    },
    {
      id: "oll-33",
      name: "OLL 33",
      group: "Cross and T",
      aliases: ["Key"],
      algorithms: [
        { id: "o33-1", moves: "R U R' U' R' F R F'" },
        { id: "o33-2", moves: "L' U' L U L F' L' F" },
      ],
    },
    {
      id: "oll-34",
      name: "OLL 34",
      group: "C",
      aliases: ["City"],
      algorithms: [
        { id: "o34-1", moves: "R U R2 U' R' F R U R U' F'" },
        { id: "o34-3", moves: "F R U R' U' R' F' r U R U' r'" },
      ],
    },
    {
      id: "oll-35",
      name: "OLL 35",
      group: "Fish",
      aliases: ["Fish Salad 2"],
      algorithms: [
        { id: "o35-1", moves: "R U2 R2 F R F' R U2 R'" },
        { id: "o35-3", moves: "f R U R' U' f' R U R' U R U2 R'" },
      ],
    },
    {
      id: "oll-36",
      name: "OLL 36",
      group: "W",
      aliases: ["Sea Makai"],
      algorithms: [
        { id: "o36-1", moves: "L' U' L U' L' U L U L F' L' F" },
        { id: "o36-3", moves: "R' U' R U' R' U R U R B' R' B" },
      ],
    },
    {
      id: "oll-37",
      name: "OLL 37",
      group: "Fish",
      aliases: ["Mounted Fish"],
      algorithms: [
        { id: "o37-1", moves: "F R' F' R U R U' R'" },
        { id: "o37-2", moves: "F R U' R' U' R U R' F'" },
      ],
    },
    {
      id: "oll-38",
      name: "OLL 38",
      group: "W",
      aliases: ["Mario 2"],
      algorithms: [
        { id: "o38-1", moves: "R U R' U R U' R' U' R' F R F'" },
        { id: "o38-3", moves: "L U L' U L U' L' U' L' B L B'" },
      ],
    },
    {
      id: "oll-39",
      name: "OLL 39",
      group: "Lightning",
      aliases: ["Big Lightning"],
      algorithms: [
        { id: "o39-1", moves: "L F' L' U' L U F U' L'" },
        { id: "o39-3", moves: "R B' R' U' R U B U' R'" },
      ],
    },
    {
      id: "oll-40",
      name: "OLL 40",
      group: "Lightning",
      aliases: ["Anti-Big Lightning"],
      algorithms: [
        { id: "o40-1", moves: "R' F R U R' U' F' U R" },
        { id: "o40-3", moves: "L' B L U L' U' B' U L" },
      ],
    },
    {
      id: "oll-41",
      name: "OLL 41",
      group: "Awkward",
      aliases: ["Awkward Fish"],
      algorithms: [{ id: "o41-1", moves: "R U R' U R U2 R' F R U R' U' F'" }],
    },
    {
      id: "oll-42",
      name: "OLL 42",
      group: "Awkward",
      aliases: ["Anti-Awkward Fish"],
      algorithms: [{ id: "o42-1", moves: "R' U' R U' R' U2 R F R U R' U' F'" }],
    },
    {
      id: "oll-43",
      name: "OLL 43",
      group: "P",
      aliases: ["Anti-Fung"],
      algorithms: [
        { id: "o43-1", moves: "F' U' L' U L F" },
        { id: "o43-2", moves: "f' L' U' L U f" },
        { id: "o43-3", moves: "R' U' F' U F R" },
      ],
    },
    {
      id: "oll-44",
      name: "OLL 44",
      group: "P",
      aliases: ["Fung"],
      algorithms: [
        { id: "o44-1", moves: "F U R U' R' F'" },
        { id: "o44-2", moves: "f R U R' U' f'" },
      ],
    },
    {
      id: "oll-45",
      name: "OLL 45",
      group: "Cross and T",
      aliases: ["Suit Up"],
      algorithms: [
        { id: "o45-1", moves: "F R U R' U' F'" },
        { id: "o45-2", moves: "F' L' U' L U F" },
      ],
    },
    {
      id: "oll-46",
      name: "OLL 46",
      group: "C",
      aliases: ["Seein' Headlights"],
      algorithms: [{ id: "o46-1", moves: "R' U' R' F R F' U R" }],
    },
    {
      id: "oll-47",
      name: "OLL 47",
      group: "L",
      aliases: ["Breakneck"],
      algorithms: [
        { id: "o47-1", moves: "F' L' U' L U L' U' L U F" },
        { id: "o47-2", moves: "R' U' R' F R F' R' F R F' U R" },
      ],
    },
    {
      id: "oll-48",
      name: "OLL 48",
      group: "L",
      aliases: ["Right Back Squeezy"],
      algorithms: [{ id: "o48-1", moves: "F R U R' U' R U R' U' F'" }],
    },
    {
      id: "oll-49",
      name: "OLL 49",
      group: "L",
      aliases: ["Right Front Squeezy"],
      algorithms: [
        { id: "o49-1", moves: "r U' r2 U r2 U r2 U' r" },
        { id: "o49-3", moves: "l U' l2 U l2 U l2 U' l" },
      ],
    },
    {
      id: "oll-50",
      name: "OLL 50",
      group: "L",
      aliases: ["Left Back Squeezy"],
      algorithms: [
        { id: "o50-1", moves: "r' U r2 U' r2 U' r2 U r'" },
        { id: "o50-3", moves: "l' U l2 U' l2 U' l2 U l'" },
      ],
    },
    {
      id: "oll-51",
      name: "OLL 51",
      group: "Line",
      aliases: ["Bottlecap"],
      algorithms: [
        { id: "o51-1", moves: "f R U R' U' R U R' U' f'" },
        { id: "o51-3", moves: "F U R U' R' U R U' R' F'" },
      ],
    },
    {
      id: "oll-52",
      name: "OLL 52",
      group: "Line",
      aliases: ["Rice Cooker"],
      algorithms: [
        { id: "o52-1", moves: "R U R' U R U' B U' B' R'" },
        { id: "o52-2", moves: "R' U' R U' R' U F' U F R" },
        { id: "o52-3", moves: "R U R' U R d' R U' R' F'" },
      ],
    },
    {
      id: "oll-53",
      name: "OLL 53",
      group: "L",
      aliases: ["Frying Pan"],
      algorithms: [
        { id: "o53-1", moves: "l' U2 L U L' U' L U L' U l" },
        { id: "o53-2", moves: "r' U' R U' R' U R U' R' U2 r" },
      ],
    },
    {
      id: "oll-54",
      name: "OLL 54",
      group: "L",
      aliases: ["Anti-Frying Pan"],
      algorithms: [
        { id: "o54-1", moves: "r U2 R' U' R U R' U' R U' r'" },
        { id: "o54-2", moves: "l U2 L' U' L U L' U' L U' l'" },
      ],
    },
    {
      id: "oll-55",
      name: "OLL 55",
      group: "Line",
      aliases: ["Highway"],
      algorithms: [
        { id: "o55-1", moves: "R U2 R2 U' R U' R' U2 F R F'" },
        { id: "o55-3", moves: "R' F U R U' R2 F' R2 U R' U' R" },
      ],
    },
    {
      id: "oll-56",
      name: "OLL 56",
      group: "Line",
      aliases: ["Streetlights"],
      algorithms: [
        { id: "o56-1", moves: "r U r' U R U' R' U R U' R' r U' r'" },
        { id: "o56-2", moves: "r' U' r U' R' U R U' R' U R r' U r" },
        { id: "o56-3", moves: "F R U R' U' R F' r U R' U' r'" },
      ],
    },
    {
      id: "oll-57",
      name: "OLL 57",
      group: "Other",
      aliases: ["Mummy"],
      algorithms: [
        { id: "o57-1", moves: "R U R' U' M' U R U' r'" },
        { id: "o57-2", moves: "R U R' U' r R' U R U' r'" },
        { id: "o57-3", moves: "M' U M' U M' U2 M U M U M U2" },
      ],
    },
  ],
};
