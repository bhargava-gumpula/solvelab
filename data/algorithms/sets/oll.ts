import type { AlgorithmSetData } from "../types";

/**
 * The 57 last-layer orientations.
 *
 * Every algorithm is checked against the cube engine by
 * `tests/unit/algorithms.test.ts`: it must leave the last layer facing up with
 * the first two layers untouched. The first algorithm of a case defines it.
 *
 * The groups are the standard shape families the SpeedSolving wiki and J Perm
 * use, so a case sits under the same heading here as on their sheets: T shapes
 * (33, 45), small lightning (7, 8, 11, 12) and big lightning (39, 40), corners
 * oriented (28, 57), I shapes (51, 52, 55, 56), and so on.
 *
 * Each recognition text reads the case as drawn for its first algorithm, with
 * no set-up turn: the edge shape, the corners that face up, then a sticker or
 * two that tell it from its neighbours and its mirror. Every claim is checked
 * on the cube by `tests/unit/oll-recognition.test.ts`.
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
      recognition:
        "Dot, no corner up: three yellow stickers along the left side and three along the right. Dots are easy to spot but long and hard to tell apart, so learn them last.",
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
      recognition:
        "Dot, no corner up: three yellow stickers along the left side but only one on the right. OLL 1 has three on both sides.",
      algorithms: [
        { id: "o2-1", moves: "F R U R' U' F' f R U R' U' f'" },
        { id: "o2-2", moves: "r U r' U2 r U2 R' U2 R U' r'" },
      ],
    },
    {
      id: "oll-3",
      name: "OLL 3",
      group: "Dot",
      aliases: ["One-corner dot"],
      recognition:
        "Dot, one corner up at the front right, and the front-left corner's yellow faces left. The corners match Sune's, where OLL 4's match Antisune's.",
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
      aliases: ["One-corner dot, mirror"],
      recognition:
        "Dot, one corner up at the back right, and the front-left corner's yellow faces you. The corners match Antisune's, where OLL 3's match Sune's.",
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
      aliases: ["Lefty Square"],
      recognition:
        "L at the front and right, one corner up at the front right: a 2x2 square. No yellow on the front side; the corners match Sune's, where OLL 6's match Antisune's.",
      algorithms: [
        { id: "o5-1", moves: "r' U2 R U R' U r" },
        { id: "o5-2", moves: "l' U2 L U L' U l" },
      ],
    },
    {
      id: "oll-6",
      name: "OLL 6",
      group: "Square",
      aliases: ["Righty Square"],
      recognition:
        "L at the back and right, one corner up at the back right: a 2x2 square. No yellow on the back side; the corners match Antisune's, where OLL 5's match Sune's.",
      algorithms: [
        { id: "o6-1", moves: "r U2 R' U' R U' r'" },
        { id: "o6-2", moves: "l U2 L' U' L U' l'" },
      ],
    },
    {
      id: "oll-7",
      name: "OLL 7",
      group: "Small lightning",
      aliases: ["Lightning"],
      recognition:
        "L at the back and left, one corner up at the front left: a small lightning bolt. No yellow on the left side; the corners match Sune's, where OLL 8's match Antisune's.",
      algorithms: [{ id: "o7-1", moves: "r U R' U R U2 r'" }],
    },
    {
      id: "oll-8",
      name: "OLL 8",
      group: "Small lightning",
      aliases: ["Reverse Lightning"],
      recognition:
        "L at the front and left, one corner up at the back left: a small lightning bolt. No yellow on the left side; the corners match Antisune's, where OLL 7's match Sune's.",
      algorithms: [{ id: "o8-1", moves: "r' U' R U' R' U2 r" }],
    },
    {
      id: "oll-9",
      name: "OLL 9",
      group: "Fish",
      aliases: ["Kite"],
      recognition:
        "L at the back and left, one corner up at the front right: a fish. Two yellow stickers side by side on the front; the corners match Antisune's, where OLL 10's match Sune's.",
      algorithms: [{ id: "o9-1", moves: "R U R' U' R' F R2 U R' U' F'" }],
    },
    {
      id: "oll-10",
      name: "OLL 10",
      group: "Fish",
      aliases: ["Anti-Kite"],
      recognition:
        "L at the front and left, one corner up at the back right: a fish. Two yellow stickers side by side on the back; the corners match Sune's, where OLL 9's match Antisune's.",
      algorithms: [
        { id: "o10-1", moves: "R U R' U R' F R F' R U2 R'" },
        { id: "o10-2", moves: "R U R' y R' F R U' R' F' R" },
      ],
    },
    {
      id: "oll-11",
      name: "OLL 11",
      group: "Small lightning",
      aliases: ["Downstairs"],
      recognition:
        "L at the back and left, one corner up at the back right: a small lightning bolt. Two yellow stickers side by side on the front; the corners match Sune's, where OLL 12's match Antisune's.",
      algorithms: [
        { id: "o11-1", moves: "r U R' U R' F R F' R U2 r'" },
        { id: "o11-2", moves: "r' R2 U R' U R U2 R' U M'" },
        { id: "o11-3", moves: "M R U R' U R U2 R' U M'" },
      ],
    },
    {
      id: "oll-12",
      name: "OLL 12",
      group: "Small lightning",
      aliases: ["Upstairs"],
      recognition:
        "L at the front and right, one corner up at the back right: a small lightning bolt. Two yellow stickers side by side on the left; the corners match Antisune's, where OLL 11's match Sune's.",
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
      recognition:
        "Line left to right, one corner up at the front left. No yellow on the left side; the corners match Sune's, where OLL 14's match Antisune's.",
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
      recognition:
        "Line left to right, one corner up at the front right. No yellow on the right side; the corners match Antisune's, where OLL 13's match Sune's.",
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
      recognition:
        "Line left to right, one corner up at the back left. Every side shows yellow, two stickers on the front; the corners match Sune's, where OLL 16's match Antisune's.",
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
      recognition:
        "Line left to right, one corner up at the back right. Every side shows yellow, two stickers on the front; the corners match Antisune's, where OLL 15's match Sune's.",
      algorithms: [{ id: "o16-1", moves: "r U r' R U R' U' r U' r'" }],
    },
    {
      id: "oll-17",
      name: "OLL 17",
      group: "Dot",
      aliases: ["Slash"],
      recognition:
        "Dot, two corners up at the back left and front right: a diagonal. The back-right corner's yellow faces the back and the front-left corner's faces left.",
      algorithms: [{ id: "o17-1", moves: "R U R' U R' F R F' U2 R' F R F'" }],
    },
    {
      id: "oll-18",
      name: "OLL 18",
      group: "Dot",
      aliases: ["Crown"],
      recognition:
        "Dot, two corners up at the back, and both front corners show their yellow on the front: three in a row. In OLL 19 they face left and right.",
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
      recognition:
        "Dot, two corners up at the back, and the front corners show their yellow on the left and right. In OLL 18 both face the front.",
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
      recognition:
        "Dot, all four corners up: an X that looks the same from every side, and the rarest case. Each side shows only its middle sticker in yellow.",
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
      recognition:
        "Cross, no corner up, and the front and back each show a pair of yellow corner stickers. One of the seven corner cases to learn first; Pi has a pair on one side only.",
      algorithms: [
        { id: "o21-1", moves: "R U2 R' U' R U R' U' R U' R'" },
        { id: "o21-2", moves: "F R U R' U' R U R' U' R U R' U' F'" },
        {
          id: "o21-3",
          moves: "R U R' U R U' R' U R U2 R'",
          note: "Hold the pairs of yellow stickers on the left and right.",
        },
      ],
    },
    {
      id: "oll-22",
      name: "OLL 22",
      group: "All edges oriented",
      aliases: ["Pi"],
      recognition:
        "Cross, no corner up, and only the left side shows a pair of yellow corner stickers. The other two face front and back at the right; learn it first, with the other corner cases.",
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
      recognition:
        "Cross, two corners up at the back, and both front corners show their yellow on the front, like headlights. One of the seven corner cases to learn first.",
      algorithms: [
        { id: "o23-1", moves: "R2 D R' U2 R D' R' U2 R'" },
        {
          id: "o23-2",
          moves: "R2 D' R U2 R' D R U2 R",
          note: "Hold the two up corners at the front, so the headlights face away from you.",
        },
      ],
    },
    {
      id: "oll-24",
      name: "OLL 24",
      group: "All edges oriented",
      aliases: ["Chameleon"],
      recognition:
        "Cross, two corners up on the right, and the left-hand corners show their yellow on the front and back. One of the seven corner cases to learn first.",
      algorithms: [
        { id: "o24-1", moves: "r U R' U' r' F R F'" },
        {
          id: "o24-2",
          moves: "x' R U R' D R U' R' D' x",
          note: "Hold the two up corners at the back; the front two show their yellow on the left and right.",
        },
      ],
    },
    {
      id: "oll-25",
      name: "OLL 25",
      group: "All edges oriented",
      aliases: ["Bowtie"],
      recognition:
        "Cross, two corners up at the back right and front left, and the front-right corner's yellow faces you. One of the seven corner cases to learn first.",
      algorithms: [
        { id: "o25-1", moves: "F' r U R' U' r' F R" },
        {
          id: "o25-2",
          moves: "x' R U' R' D R U R' D' x",
          note: "Hold the up corners at the front left and back right, with the front-right corner's yellow facing right.",
        },
        {
          id: "o25-3",
          moves: "R U2 R D R' U2 R D' R2",
          note: "Hold the up corners at the back left and front right; the front-left corner's yellow faces you.",
        },
      ],
    },
    {
      id: "oll-26",
      name: "OLL 26",
      group: "All edges oriented",
      aliases: ["Antisune"],
      recognition:
        "Cross, one corner up at the back right, and the front-left corner's yellow faces you. Learn it first, with Sune: held with its up corner here, Sune's front-left yellow faces left.",
      algorithms: [
        { id: "o26-1", moves: "R U2 R' U' R U' R'" },
        {
          id: "o26-2",
          moves: "L' U' L U' L' U2 L",
          note: "Left-hand version: hold the up corner at the front right.",
        },
      ],
    },
    {
      id: "oll-27",
      name: "OLL 27",
      group: "All edges oriented",
      aliases: ["Sune"],
      recognition:
        "Cross, one corner up at the front left, and the front-right corner's yellow faces you. Learn it first, with Antisune: held with its up corner here, Antisune's front-right yellow faces right.",
      algorithms: [
        { id: "o27-1", moves: "R U R' U R U2 R'" },
        {
          id: "o27-2",
          moves: "L' U2 L U L' U L",
          note: "Left-hand version: hold the up corner at the back left.",
        },
      ],
    },
    {
      id: "oll-28",
      name: "OLL 28",
      group: "Corners oriented",
      aliases: ["Stealth"],
      recognition:
        "L at the back and left, all four corners up: only the front and right edges show their yellow on the sides. Learn it first, with the corner cases.",
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
      recognition:
        "L at the back and left, two corners up on the right; the left-hand corners show their yellow on the back and front. OLL 30 is its mirror: with the L held here, its up corners are at the front.",
      algorithms: [
        { id: "o29-1", moves: "R U R' U' R U' R' F' U' F R U R'" },
        { id: "o29-2", moves: "M U R U R' U' R' F R F' M'" },
      ],
    },
    {
      id: "oll-30",
      name: "OLL 30",
      group: "Awkward",
      aliases: ["Anti-Spotted Chameleon"],
      recognition:
        "L at the back and left, two corners up at the front; the back corners show their yellow on the left and right. OLL 29 is its mirror: with the L held here, its up corners are on the right.",
      algorithms: [
        { id: "o30-1", moves: "F R' F R2 U' R' U' R U R' F2" },
        { id: "o30-2", moves: "r' D' r U' r' D r2 U' r' U r U r'" },
      ],
    },
    {
      id: "oll-31",
      name: "OLL 31",
      group: "P",
      aliases: ["Couch"],
      recognition:
        "L at the back and right, two corners up on the right, so the top's right-hand column is yellow: a P. Two yellow stickers side by side on the front; OLL 32 is its mirror, with the column on the left.",
      algorithms: [
        { id: "o31-1", moves: "R' U' F U R U' R' F' R" },
        { id: "o31-2", moves: "S' L' U' L U L F' L' f" },
      ],
    },
    {
      id: "oll-32",
      name: "OLL 32",
      group: "P",
      aliases: ["Anti-Couch"],
      recognition:
        "L at the back and left, two corners up on the left, so the top's left-hand column is yellow: a P. Two yellow stickers side by side on the front; OLL 31 is its mirror, with the column on the right.",
      algorithms: [
        { id: "o32-1", moves: "L U F' U' L' U L F L'" },
        { id: "o32-2", moves: "S R U R' U' R' F R f'" },
      ],
    },
    {
      id: "oll-33",
      name: "OLL 33",
      group: "T shapes",
      aliases: ["Key"],
      recognition:
        "Line left to right, two corners up on the right: a T. The left-hand corners show their yellow on the front and back, where OLL 45's both face left; eight moves, so learn it early.",
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
      recognition:
        "Line left to right, two corners up at the front: a C. The back corners show their yellow on the left and right, so every side has one yellow sticker.",
      algorithms: [
        { id: "o34-1", moves: "R U R2 U' R' F R U R U' F'" },
        { id: "o34-3", moves: "F R U R' U' R' F' r U R U' r'" },
      ],
    },
    {
      id: "oll-35",
      name: "OLL 35",
      group: "Fish",
      aliases: ["Fish Salad"],
      recognition:
        "L at the front and right, two corners up at the back left and front right: a fish. Each side shows one yellow sticker; in OLL 37, the other two-corner fish, two sides show none.",
      algorithms: [
        { id: "o35-1", moves: "R U2 R2 F R F' R U2 R'" },
        { id: "o35-3", moves: "f R U R' U' f' R U R' U R U2 R'" },
      ],
    },
    {
      id: "oll-36",
      name: "OLL 36",
      group: "W",
      aliases: ["Sea-Mew"],
      recognition:
        "L at the back and right, two corners up at the back left and front right: a W. No yellow on the right side and two stickers side by side on the left; OLL 38 is its mirror.",
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
      recognition:
        "L at the back and left, two corners up at the back left and front right: a fish. No yellow on the back or left side; eight moves, so learn it early.",
      algorithms: [
        { id: "o37-1", moves: "F R' F' R U R U' R'" },
        { id: "o37-2", moves: "F R U' R' U' R U R' F'" },
      ],
    },
    {
      id: "oll-38",
      name: "OLL 38",
      group: "W",
      aliases: ["Mario"],
      recognition:
        "L at the back and left, two corners up at the back right and front left: a W. No yellow on the left side and two stickers side by side on the right; OLL 36 is its mirror.",
      algorithms: [
        { id: "o38-1", moves: "R U R' U R U' R' U' R' F R F'" },
        { id: "o38-3", moves: "L U L' U L U' L' U' L' B L B'" },
      ],
    },
    {
      id: "oll-39",
      name: "OLL 39",
      group: "Big lightning",
      aliases: ["Fung"],
      recognition:
        "Line left to right, two corners up at the back right and front left: a big lightning bolt. Two yellow stickers at the back and none on the left; in OLL 40, its mirror, the bare side is the right.",
      algorithms: [
        { id: "o39-1", moves: "L F' L' U' L U F U' L'" },
        { id: "o39-3", moves: "R B' R' U' R U B U' R'" },
      ],
    },
    {
      id: "oll-40",
      name: "OLL 40",
      group: "Big lightning",
      aliases: ["Anti-Fung"],
      recognition:
        "Line left to right, two corners up at the back left and front right: a big lightning bolt. Two yellow stickers at the back and none on the right; in OLL 39, its mirror, the bare side is the left.",
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
      recognition:
        "L at the back and left, two corners up at the front, and a pair of yellow corner stickers on the back. Turn that pair to face you and the L sits front and right; in OLL 42, its mirror, it sits front and left.",
      algorithms: [{ id: "o41-1", moves: "R U R' U R U2 R' F R U R' U' F'" }],
    },
    {
      id: "oll-42",
      name: "OLL 42",
      group: "Awkward",
      aliases: ["Lefty Awkward Fish"],
      recognition:
        "L at the front and left, two corners up at the back, and a pair of yellow corner stickers faces you. In OLL 41, its mirror, turned so its pair faces you, the L sits front and right.",
      algorithms: [{ id: "o42-1", moves: "R' U' R U' R' U2 R F R U R' U' F'" }],
    },
    {
      id: "oll-43",
      name: "OLL 43",
      group: "P",
      aliases: ["Anti-P"],
      recognition:
        "L at the back and right, two corners up on the right: a P with three yellow stickers along the left side. You may know it from 2-look as the left-hand L algorithm; OLL 44 is its mirror.",
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
      aliases: ["P"],
      recognition:
        "L at the back and left, two corners up on the left: a P with three yellow stickers along the right side. You may know it from 2-look as F U R U' R' F'; OLL 43 is its mirror.",
      algorithms: [
        { id: "o44-1", moves: "F U R U' R' F'" },
        { id: "o44-2", moves: "f R U R' U' f'" },
      ],
    },
    {
      id: "oll-45",
      name: "OLL 45",
      group: "T shapes",
      aliases: ["Suit Up"],
      recognition:
        "Line left to right, two corners up on the right: a T. The left-hand corners both show their yellow on the left; you know it already, as the 2-look line algorithm.",
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
      recognition:
        "Line front to back, two corners up on the left: a C. Three yellow stickers along the right side; eight moves, so learn it early.",
      algorithms: [{ id: "o46-1", moves: "R' U' R' F R F' U R" }],
    },
    {
      id: "oll-47",
      name: "OLL 47",
      group: "L",
      aliases: ["Anti-Breakneck"],
      recognition:
        "L at the back and right, no corner up, and a pair of yellow corner stickers on the right. OLL 48 is its mirror: turned so its pair is on the right, its L sits front and right.",
      algorithms: [
        { id: "o47-1", moves: "F' L' U' L U L' U' L U F" },
        { id: "o47-2", moves: "R' U' R' F R F' R' F R F' U R" },
      ],
    },
    {
      id: "oll-48",
      name: "OLL 48",
      group: "L",
      aliases: ["Breakneck"],
      recognition:
        "L at the back and left, no corner up, and a pair of yellow corner stickers on the left. Learn it early, as F, R U R' U' twice, F'; OLL 47 is its mirror.",
      algorithms: [{ id: "o48-1", moves: "F R U R' U' R U R' U' F'" }],
    },
    {
      id: "oll-49",
      name: "OLL 49",
      group: "L",
      aliases: ["Right Back Squeezy"],
      recognition:
        "L at the back and right, no corner up, with three yellow stickers along the left side and two on the front. In OLL 50, its mirror, the L sits front and right and the two are at the back.",
      algorithms: [
        { id: "o49-1", moves: "r U' r2 U r2 U r2 U' r" },
        { id: "o49-3", moves: "l U' l2 U l2 U l2 U' l" },
      ],
    },
    {
      id: "oll-50",
      name: "OLL 50",
      group: "L",
      aliases: ["Right Front Squeezy"],
      recognition:
        "L at the front and right, no corner up, with three yellow stickers along the left side and two at the back. In OLL 49, its mirror, the L sits back and right and the two are on the front.",
      algorithms: [
        { id: "o50-1", moves: "r' U r2 U' r2 U' r2 U r'" },
        { id: "o50-3", moves: "l' U l2 U' l2 U' l2 U l'" },
      ],
    },
    {
      id: "oll-51",
      name: "OLL 51",
      group: "I shapes",
      aliases: ["Bottlecap"],
      recognition:
        "Line left to right, no corner up, with a pair of yellow corner stickers on the left and no yellow on the right. Learn it early: it is OLL 48's algorithm with a wide f for F.",
      algorithms: [
        { id: "o51-1", moves: "f R U R' U' R U R' U' f'" },
        { id: "o51-3", moves: "F U R U' R' U R U' R' F'" },
      ],
    },
    {
      id: "oll-52",
      name: "OLL 52",
      group: "I shapes",
      aliases: ["Rice Cooker"],
      recognition:
        "Line front to back, no corner up, with three yellow stickers along the right side and only the middle one on the left. OLL 55 has three on both sides.",
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
      recognition:
        "L at the back and right, no corner up: three yellow stickers along the front and a pair at the back. OLL 54 is its mirror; held the same way, its L sits back and left.",
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
      recognition:
        "L at the back and left, no corner up: three yellow stickers along the front and a pair at the back. OLL 53 is its mirror; held the same way, its L sits back and right.",
      algorithms: [
        { id: "o54-1", moves: "r U2 R' U' R U R' U' R U' r'" },
        { id: "o54-2", moves: "l U2 L' U' L U L' U' L U' l'" },
      ],
    },
    {
      id: "oll-55",
      name: "OLL 55",
      group: "I shapes",
      aliases: ["Highway"],
      recognition:
        "Line front to back, no corner up, with three yellow stickers along both the left and the right. OLL 52 has three on one side only.",
      algorithms: [
        { id: "o55-1", moves: "R U2 R2 U' R U' R' U2 F R F'" },
        { id: "o55-3", moves: "R' F U R U' R2 F' R2 U R' U' R" },
      ],
    },
    {
      id: "oll-56",
      name: "OLL 56",
      group: "I shapes",
      aliases: ["Streetlights"],
      recognition:
        "Line left to right, no corner up, with a pair of yellow corner stickers on both the left and the right. OLL 51 has a pair on one side only.",
      algorithms: [
        { id: "o56-1", moves: "r U r' U R U' R' U R U' R' r U' r'" },
        { id: "o56-2", moves: "r' U' r U' R' U R U' R' U R r' U r" },
        { id: "o56-3", moves: "F R U R' U' R F' r U R' U' r'" },
      ],
    },
    {
      id: "oll-57",
      name: "OLL 57",
      group: "Corners oriented",
      aliases: ["Mummy"],
      recognition:
        "Line left to right, all four corners up: only the front and back edges show their yellow on the sides. Learn it first, with OLL 28 and the corner cases.",
      algorithms: [
        { id: "o57-1", moves: "R U R' U' M' U R U' r'" },
        { id: "o57-2", moves: "R U R' U' r R' U R U' r'" },
        { id: "o57-3", moves: "M' U M' U M' U2 M U M U M U2" },
      ],
    },
  ],
};
