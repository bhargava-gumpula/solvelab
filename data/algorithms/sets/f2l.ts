import type { AlgorithmSetData } from "../types";

/**
 * The 41 ways the last pair can sit before it goes in.
 *
 * The cases were worked out from the cube itself rather than copied: every
 * position where the front-right slot is the only thing missing, counted once
 * per way the pair can sit, since turning the top layer first is the solver's
 * own move. The algorithms are the shortest there are in R, U and F turns, so
 * they stay on the right-hand side and keep the rest of the first two layers.
 */
export const f2l: AlgorithmSetData = {
  id: "f2l",
  name: "F2L",
  kind: "f2l",
  cases: [
    {
      id: "f2l-1",
      name: "F2L 1",
      group: "Both on top",
      recognition:
        "Corner above the slot, at the front right, its bottom colour facing you. Edge at the back, its front colour pointing up.",
      algorithms: [{ id: "f1-1", moves: "R U R'" }],
    },
    {
      id: "f2l-2",
      name: "F2L 2",
      group: "Both on top",
      recognition:
        "Corner at the back right, its bottom colour facing right. Edge on the right, its front colour facing out.",
      algorithms: [{ id: "f2-1", moves: "F' U F" }],
    },
    {
      id: "f2l-3",
      name: "F2L 3",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour facing you. Edge at the front, its front colour pointing up.",
      algorithms: [{ id: "f3-1", moves: "R U' R'" }],
    },
    {
      id: "f2l-4",
      name: "F2L 4",
      group: "Both on top",
      recognition:
        "Corner above the slot, at the front right, its bottom colour facing right. Edge on the left, its front colour facing out.",
      algorithms: [{ id: "f4-1", moves: "F' U' F" }],
    },
    {
      id: "f2l-5",
      name: "F2L 5",
      group: "Both on top",
      recognition:
        "Corner at the back left, its bottom colour pointing up. Edge on the right, its front colour pointing up.",
      algorithms: [
        { id: "f5-1", moves: "R U R2 F R F'" },
        { id: "f5-2", moves: "F' U' F R U R'" },
      ],
    },
    {
      id: "f2l-6",
      name: "F2L 6",
      group: "Both on top",
      recognition:
        "Corner at the back right, its bottom colour pointing up. Edge at the front, its front colour facing out.",
      algorithms: [{ id: "f6-1", moves: "F' U2 F2 R' F' R" }],
    },
    {
      id: "f2l-7",
      name: "F2L 7",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour pointing up. Edge on the right, its front colour pointing up.",
      algorithms: [{ id: "f7-1", moves: "R U2 R2 F R F'" }],
    },
    {
      id: "f2l-8",
      name: "F2L 8",
      group: "Both on top",
      recognition:
        "Corner above the slot, at the front right, its bottom colour pointing up. Edge on the right, its front colour pointing up.",
      algorithms: [{ id: "f8-1", moves: "R U2 R' U' R U R'" }],
    },
    {
      id: "f2l-9",
      name: "F2L 9",
      group: "Both on top",
      recognition:
        "Corner at the back left, its bottom colour pointing up. Edge on the left, its front colour facing out.",
      algorithms: [{ id: "f9-1", moves: "F2 U2 F U F' U F2" }],
    },
    {
      id: "f2l-10",
      name: "F2L 10",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour pointing up. Edge on the right, its front colour facing out.",
      algorithms: [
        { id: "f10-1", moves: "U R U R' F' U' F" },
        { id: "f10-2", moves: "U F' U' F2 R' F' R" },
      ],
    },
    {
      id: "f2l-11",
      name: "F2L 11",
      group: "Both on top",
      recognition:
        "Corner above the slot, at the front right, its bottom colour pointing up. Edge at the front, its front colour facing out.",
      algorithms: [{ id: "f11-1", moves: "F' U2 F U F' U' F" }],
    },
    {
      id: "f2l-12",
      name: "F2L 12",
      group: "Both on top",
      recognition:
        "Corner at the back right, its bottom colour facing right. Edge at the back, its front colour pointing up.",
      algorithms: [{ id: "f12-1", moves: "R U' R' U R U R'" }],
    },
    {
      id: "f2l-13",
      name: "F2L 13",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour facing left. Edge at the back, its front colour pointing up.",
      algorithms: [{ id: "f13-1", moves: "F' U F U' R U R'" }],
    },
    {
      id: "f2l-14",
      name: "F2L 14",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour facing left. Edge on the right, its front colour facing out.",
      algorithms: [
        { id: "f14-1", moves: "F' U2 F U F' U2 F" },
        { id: "f14-2", moves: "F' U2 F U2 F' U F" },
      ],
    },
    {
      id: "f2l-15",
      name: "F2L 15",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour facing left. Edge on the left, its front colour pointing up.",
      algorithms: [{ id: "f15-1", moves: "F' U2 F U' R U R'" }],
    },
    {
      id: "f2l-16",
      name: "F2L 16",
      group: "Both on top",
      recognition:
        "Corner above the slot, at the front right, its bottom colour facing right. Edge on the right, its front colour facing out.",
      algorithms: [{ id: "f16-1", moves: "F U2 F2 U' F2 U' F'" }],
    },
    {
      id: "f2l-17",
      name: "F2L 17",
      group: "Both on top",
      recognition:
        "Corner at the back right, its bottom colour facing back. Edge at the front, its front colour pointing up.",
      algorithms: [
        { id: "f17-1", moves: "R U2 R' U' R U2 R'" },
        { id: "f17-2", moves: "R U2 R' U2 R U' R'" },
      ],
    },
    {
      id: "f2l-18",
      name: "F2L 18",
      group: "Both on top",
      recognition:
        "Corner at the back right, its bottom colour facing back. Edge on the left, its front colour pointing up.",
      algorithms: [
        { id: "f18-1", moves: "R U R' U' R U2 R'" },
        { id: "f18-2", moves: "R U R' U2 R U' R'" },
      ],
    },
    {
      id: "f2l-19",
      name: "F2L 19",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour facing you. Edge on the right, its front colour facing out.",
      algorithms: [
        { id: "f19-1", moves: "R U R' U2 F' U' F" },
        { id: "f19-2", moves: "F' U' F U' F' U' F" },
      ],
    },
    {
      id: "f2l-20",
      name: "F2L 20",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour facing you. Edge on the left, its front colour facing out.",
      algorithms: [{ id: "f20-1", moves: "F' U F U' F' U' F" }],
    },
    {
      id: "f2l-21",
      name: "F2L 21",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour pointing up. Edge on the left, its front colour pointing up.",
      algorithms: [
        { id: "f21-1", moves: "U R2 U2 R' U' R U' R2" },
        { id: "f21-2", moves: "F R' F' R U R U R'" },
      ],
    },
    {
      id: "f2l-22",
      name: "F2L 22",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour facing left. Edge at the front, its front colour facing out.",
      algorithms: [
        { id: "f22-1", moves: "R F R U R' U' F' R'" },
        { id: "f22-2", moves: "U' R U' R' U2 F' U' F" },
      ],
    },
    {
      id: "f2l-23",
      name: "F2L 23",
      group: "Both on top",
      recognition:
        "Corner at the back left, its bottom colour facing back. Edge on the right, its front colour facing out.",
      algorithms: [
        { id: "f23-1", moves: "R' F' U' F U R2 U' R'" },
        { id: "f23-2", moves: "U F2 U2 R' F R U2 F2" },
        { id: "f23-3", moves: "U' F' U' F U F' U2 F" },
        { id: "f23-4", moves: "U' F' U' F U2 F' U F" },
      ],
    },
    {
      id: "f2l-24",
      name: "F2L 24",
      group: "Both on top",
      recognition:
        "Corner at the front left, its bottom colour facing you. Edge on the left, its front colour pointing up.",
      algorithms: [
        { id: "f24-1", moves: "R' F R F' U R U R'" },
        { id: "f24-2", moves: "U' F' U F U2 R U R'" },
      ],
    },
    {
      id: "f2l-25",
      name: "F2L 25",
      group: "Corner in the slot, edge on top",
      recognition:
        "Corner already in the slot, its bottom colour facing you. Edge on the right, its front colour pointing up.",
      algorithms: [
        { id: "f25-1", moves: "R U' R2 F R F'" },
        { id: "f25-2", moves: "F' U2 F R U2 R'" },
      ],
    },
    {
      id: "f2l-26",
      name: "F2L 26",
      group: "Corner in the slot, edge on top",
      recognition:
        "Corner already in the slot, its bottom colour facing right. Edge at the front, its front colour facing out.",
      algorithms: [
        { id: "f26-1", moves: "R U2 R' F' U2 F" },
        { id: "f26-2", moves: "F' U F2 R' F' R" },
      ],
    },
    {
      id: "f2l-27",
      name: "F2L 27",
      group: "Corner in the slot, edge on top",
      recognition:
        "Corner already in the slot, the right way round. Edge at the back, its front colour pointing up.",
      algorithms: [
        { id: "f27-1", moves: "R' F R F' R U R'" },
        { id: "f27-2", moves: "F' U F R' F R F'" },
        { id: "f27-3", moves: "F' U F U R U' R'" },
        { id: "f27-4", moves: "F' U F U2 R U2 R'" },
      ],
    },
    {
      id: "f2l-28",
      name: "F2L 28",
      group: "Corner in the slot, edge on top",
      recognition:
        "Corner already in the slot, its bottom colour facing you. Edge at the front, its front colour facing out.",
      algorithms: [
        { id: "f28-1", moves: "U R' F R F2 U' F" },
        { id: "f28-2", moves: "U2 R U' R' F' U' F" },
        { id: "f28-3", moves: "F' U' F U F' U' F" },
      ],
    },
    {
      id: "f2l-29",
      name: "F2L 29",
      group: "Corner in the slot, edge on top",
      recognition:
        "Corner already in the slot, its bottom colour facing right. Edge on the right, its front colour pointing up.",
      algorithms: [
        { id: "f29-1", moves: "R U R' U' R U R'" },
        { id: "f29-2", moves: "U' F R' F' R2 U R'" },
        { id: "f29-3", moves: "U2 F' U F R U R'" },
      ],
    },
    {
      id: "f2l-30",
      name: "F2L 30",
      group: "Corner in the slot, edge on top",
      recognition:
        "Corner already in the slot, the right way round. Edge at the front, its front colour facing out.",
      algorithms: [
        { id: "f30-1", moves: "R' U' R F' R' U R F" },
        { id: "f30-2", moves: "U R U R' U' F' U' F" },
        { id: "f30-3", moves: "U R U' R' U' F' U F" },
        { id: "f30-4", moves: "U R U' R' U2 F' U2 F" },
      ],
    },
    {
      id: "f2l-31",
      name: "F2L 31",
      group: "Edge in the slot, corner on top",
      recognition:
        "Corner above the slot, at the front right, its bottom colour pointing up. Edge already in the slot, flipped.",
      algorithms: [
        { id: "f31-1", moves: "R U' R' F' U2 F" },
        { id: "f31-2", moves: "F' U F R U2 R'" },
      ],
    },
    {
      id: "f2l-32",
      name: "F2L 32",
      group: "Edge in the slot, corner on top",
      recognition:
        "Corner at the back right, its bottom colour facing right. Edge already in the slot, the right way round.",
      algorithms: [{ id: "f32-1", moves: "R U2 R' U R U R'" }],
    },
    {
      id: "f2l-33",
      name: "F2L 33",
      group: "Edge in the slot, corner on top",
      recognition:
        "Corner at the back left, its bottom colour facing back. Edge already in the slot, flipped.",
      algorithms: [
        { id: "f33-1", moves: "F' U F U R U R'" },
        { id: "f33-2", moves: "F' U' F R' F R F'" },
        { id: "f33-3", moves: "F' U' F U R U' R'" },
        { id: "f33-4", moves: "F' U' F U2 R U2 R'" },
      ],
    },
    {
      id: "f2l-34",
      name: "F2L 34",
      group: "Edge in the slot, corner on top",
      recognition:
        "Corner at the back right, its bottom colour facing back. Edge already in the slot, the right way round.",
      algorithms: [
        { id: "f34-1", moves: "R U' R' U' R U2 R'" },
        { id: "f34-2", moves: "R U' R' U2 R U' R'" },
        { id: "f34-3", moves: "F' U' F U2 F' U' F" },
      ],
    },
    {
      id: "f2l-35",
      name: "F2L 35",
      group: "Edge in the slot, corner on top",
      recognition:
        "Corner at the back left, its bottom colour facing left. Edge already in the slot, flipped.",
      algorithms: [
        { id: "f35-1", moves: "R U R' U' F' U F" },
        { id: "f35-2", moves: "R U R' U2 F' U2 F" },
        { id: "f35-3", moves: "R U R' F R' F' R" },
        { id: "f35-4", moves: "R U' R' U' F' U' F" },
      ],
    },
    {
      id: "f2l-36",
      name: "F2L 36",
      group: "Edge in the slot, corner on top",
      recognition:
        "Corner at the back right, its bottom colour pointing up. Edge already in the slot, the right way round.",
      algorithms: [
        { id: "f36-1", moves: "U R2 U R2 U R2 U2 R2" },
        { id: "f36-2", moves: "U F2 U' F2 U' F2 U2 F2" },
        { id: "f36-3", moves: "U' R2 U2 R2 U' R2 U' R2" },
        { id: "f36-4", moves: "U' F2 U2 F2 U F2 U F2" },
      ],
    },
    {
      id: "f2l-37",
      name: "F2L 37",
      group: "Both stuck in the slot",
      recognition:
        "Corner already in the slot, the right way round. Edge already in the slot, flipped.",
      algorithms: [
        { id: "f37-1", moves: "R U' R U2 F R2 F' U2 R2" },
        { id: "f37-2", moves: "R2 U2 F R2 F' U2 R' U R'" },
        { id: "f37-3", moves: "F' U F' U2 R' F2 R U2 F2" },
        { id: "f37-4", moves: "F2 U2 R' F2 R U2 F U' F" },
      ],
    },
    {
      id: "f2l-38",
      name: "F2L 38",
      group: "Both stuck in the slot",
      recognition:
        "Corner already in the slot, its bottom colour facing you. Edge already in the slot, the right way round.",
      algorithms: [
        { id: "f38-1", moves: "R U2 R U2 F R F' U2 R2" },
        { id: "f38-2", moves: "R2 U2 R' U' R U' R' U2 R'" },
        { id: "f38-3", moves: "F' U2 F' U' F U' F' U2 F2" },
        { id: "f38-4", moves: "F2 U2 R' F R U2 F U2 F" },
      ],
    },
    {
      id: "f2l-39",
      name: "F2L 39",
      group: "Both stuck in the slot",
      recognition:
        "Corner already in the slot, its bottom colour facing you. Edge already in the slot, flipped.",
      algorithms: [
        { id: "f39-1", moves: "R F U R U' R' F' U' R'" },
        { id: "f39-2", moves: "F' U' R' F' U' F U R F" },
      ],
    },
    {
      id: "f2l-40",
      name: "F2L 40",
      group: "Both stuck in the slot",
      recognition:
        "Corner already in the slot, its bottom colour facing right. Edge already in the slot, the right way round.",
      algorithms: [
        { id: "f40-1", moves: "R U2 R U R' U R U2 R2" },
        { id: "f40-2", moves: "R2 U2 F R' F' U2 R' U2 R'" },
        { id: "f40-3", moves: "F' U2 F' U2 R' F' R U2 F2" },
        { id: "f40-4", moves: "F2 U2 F U F' U F U2 F" },
      ],
    },
    {
      id: "f2l-41",
      name: "F2L 41",
      group: "Both stuck in the slot",
      recognition:
        "Corner already in the slot, its bottom colour facing right. Edge already in the slot, flipped.",
      algorithms: [
        { id: "f41-1", moves: "R U F R U R' U' F' R'" },
        { id: "f41-2", moves: "F' R' U' F' U F R U F" },
      ],
    },
  ],
};
