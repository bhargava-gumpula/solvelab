import type { AlgorithmSetData } from "../types";

/**
 * The 41 ways a corner and its edge can sit before the pair goes in. The same
 * cases come up for every pair in every slot, not only the last one.
 *
 * The cases were worked out from the cube itself rather than copied: every
 * position where the front-right slot is the only thing missing, counted once
 * per way the pair can sit, since turning the top layer first is the solver's
 * own move.
 *
 * So SolveLab's numbers are its own, not the numbering SpeedCubeDB and most
 * algorithm sheets share. Each case carries its SpeedCubeDB number as an alias
 * ("SpeedCubeDB 39" on F2L 40), found by matching every case's pair on the
 * engine (`tests/unit/phase4-alg-sets.test.ts`), so a case can be looked up in
 * either place. Case ids stay as they are, because saved progress points at them.
 *
 * Every case is drawn and solved at the front-right slot, but the same case
 * turns up at every slot. At the front-left, mirror the moves left to right:
 * R becomes L', R' becomes L, and every U and F turn goes the other way (wide
 * r and d turns mirror the same way as R and U; M stays as it is). At a
 * back slot, turn the cube to bring the slot to the front first; solving it at
 * the back without turning is an extra for later. The list is a reference for
 * after intuitive F2L makes sense, when a few cases keep coming out slow; it
 * is not the way to learn F2L.
 *
 * The first algorithm of each case is the default, chosen for how it turns
 * rather than how few moves it has: the one most solvers use, taken from
 * SpeedCubeDB's front-right votes and the research notes (section 4.5),
 * which mostly means R and U triggers. Two cases differ: F2L 24 leads with
 * an M-slice version, the top vote by a hair over its R and U one, and F2L 2
 * keeps the plain F' U F insert, which from its angle is shorter than the top
 * vote (comments at each case). Each default starts from the
 * angle the case has always been drawn at, so a published algorithm's set-up
 * turn is folded into its first U turn. None starts with a cube rotation:
 * where the popular version begins with y', the default is either the same
 * moves with F turns in place of the rotation (F2L 11 and 20) or the
 * best-voted one without a rotation (F2L 6). The shortest algorithms in R, U and F
 * that the cases were first solved with (`ml/build-f2l.ts`) follow as
 * alternatives, under their original ids, because saved picks point at them.
 * The file is now edited by hand: `npm run ml:f2l` writes only the shortest
 * algorithms, so point its OUT somewhere else rather than at this file.
 *
 * There is no written recognition here: what each case looks like is read off
 * the cube as it is drawn (`recognitionText`, lib/cube/describe.ts), so the
 * words always match the picture.
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
      aliases: ["SpeedCubeDB 4"],
      algorithms: [{ id: "f1-1", moves: "R U R'" }],
    },
    {
      id: "f2l-2",
      name: "F2L 2",
      group: "Both on top",
      aliases: ["SpeedCubeDB 2"],
      // SpeedCubeDB's top vote is F R' F' R (f2-2), but from this angle it needs a
      // set-up turn and a fourth move; the plain F' U F insert is shorter and is
      // what intuitive F2L already teaches.
      algorithms: [
        { id: "f2-1", moves: "F' U F" },
        { id: "f2-2", moves: "U F R' F' R" },
      ],
    },
    {
      id: "f2l-3",
      name: "F2L 3",
      group: "Both on top",
      aliases: ["SpeedCubeDB 1"],
      algorithms: [{ id: "f3-1", moves: "R U' R'" }],
    },
    {
      id: "f2l-4",
      name: "F2L 4",
      group: "Both on top",
      aliases: ["SpeedCubeDB 3"],
      algorithms: [{ id: "f4-1", moves: "F' U' F" }],
    },
    {
      id: "f2l-5",
      name: "F2L 5",
      group: "Both on top",
      aliases: ["SpeedCubeDB 21"],
      algorithms: [
        { id: "f5-3", moves: "R U R' U R U' R'" },
        { id: "f5-1", moves: "R U R2 F R F'" },
        { id: "f5-2", moves: "F' U' F R U R'" },
        { id: "f5-4", moves: "U2 R U' R' U2 R U R'" },
      ],
    },
    {
      id: "f2l-6",
      name: "F2L 6",
      group: "Both on top",
      aliases: ["SpeedCubeDB 20"],
      algorithms: [
        { id: "f6-2", moves: "R U' R2 F R F' R U' R'" },
        { id: "f6-1", moves: "F' U2 F2 R' F' R" },
      ],
    },
    {
      id: "f2l-7",
      name: "F2L 7",
      group: "Both on top",
      aliases: ["SpeedCubeDB 19"],
      algorithms: [
        { id: "f7-2", moves: "R U2 R' U R U' R'" },
        { id: "f7-1", moves: "R U2 R2 F R F'" },
      ],
    },
    {
      id: "f2l-8",
      name: "F2L 8",
      group: "Both on top",
      aliases: ["SpeedCubeDB 17"],
      algorithms: [{ id: "f8-1", moves: "R U2 R' U' R U R'" }],
    },
    {
      id: "f2l-9",
      name: "F2L 9",
      group: "Both on top",
      aliases: ["SpeedCubeDB 24"],
      algorithms: [
        { id: "f9-2", moves: "U2 F U R U' R' F' R U' R'" },
        { id: "f9-1", moves: "F2 U2 F U F' U F2" },
      ],
    },
    {
      id: "f2l-10",
      name: "F2L 10",
      group: "Both on top",
      aliases: ["SpeedCubeDB 22"],
      algorithms: [
        { id: "f10-3", moves: "U' r U' r' U2 r U r'" },
        { id: "f10-1", moves: "U R U R' F' U' F" },
        { id: "f10-2", moves: "U F' U' F2 R' F' R" },
      ],
    },
    {
      id: "f2l-11",
      name: "F2L 11",
      group: "Both on top",
      aliases: ["SpeedCubeDB 18"],
      // The popular version is y' R' U2 R U R' U' R; this is the same thing with F
      // turns instead of the rotation, so it keeps its four F turns.
      algorithms: [{ id: "f11-1", moves: "F' U2 F U F' U' F" }],
    },
    {
      id: "f2l-12",
      name: "F2L 12",
      group: "Both on top",
      aliases: ["SpeedCubeDB 14"],
      algorithms: [{ id: "f12-1", moves: "R U' R' U R U R'" }],
    },
    {
      id: "f2l-13",
      name: "F2L 13",
      group: "Both on top",
      aliases: ["SpeedCubeDB 10"],
      algorithms: [
        { id: "f13-2", moves: "U2 R U R' U R U R'" },
        { id: "f13-1", moves: "F' U F U' R U R'" },
      ],
    },
    {
      id: "f2l-14",
      name: "F2L 14",
      group: "Both on top",
      aliases: ["SpeedCubeDB 8"],
      algorithms: [
        { id: "f14-3", moves: "U' r' U2 R2 U R2 U r" },
        { id: "f14-1", moves: "F' U2 F U F' U2 F" },
        { id: "f14-2", moves: "F' U2 F U2 F' U F" },
      ],
    },
    {
      id: "f2l-15",
      name: "F2L 15",
      group: "Both on top",
      aliases: ["SpeedCubeDB 12"],
      algorithms: [
        { id: "f15-2", moves: "U' R U' R' U R U' R' U2 R U' R'" },
        { id: "f15-1", moves: "F' U2 F U' R U R'" },
        { id: "f15-3", moves: "U' R' U2 R2 U R2 U R" },
      ],
    },
    {
      id: "f2l-16",
      name: "F2L 16",
      group: "Both on top",
      aliases: ["SpeedCubeDB 11"],
      algorithms: [
        { id: "f16-2", moves: "U' R U2 R' U F' U' F" },
        { id: "f16-1", moves: "F U2 F2 U' F2 U' F'" },
        { id: "f16-3", moves: "U' R U2 R' d R' U' R" },
      ],
    },
    {
      id: "f2l-17",
      name: "F2L 17",
      group: "Both on top",
      aliases: ["SpeedCubeDB 7"],
      algorithms: [
        { id: "f17-1", moves: "R U2 R' U' R U2 R'" },
        { id: "f17-2", moves: "R U2 R' U2 R U' R'" },
      ],
    },
    {
      id: "f2l-18",
      name: "F2L 18",
      group: "Both on top",
      aliases: ["SpeedCubeDB 5"],
      algorithms: [
        { id: "f18-2", moves: "R U R' U2 R U' R'" },
        { id: "f18-1", moves: "R U R' U' R U2 R'" },
      ],
    },
    {
      id: "f2l-19",
      name: "F2L 19",
      group: "Both on top",
      aliases: ["SpeedCubeDB 9"],
      algorithms: [
        { id: "f19-3", moves: "U2 R U' R' U F' U' F" },
        { id: "f19-1", moves: "R U R' U2 F' U' F" },
        { id: "f19-2", moves: "F' U' F U' F' U' F" },
        { id: "f19-4", moves: "U2 R U' R' d R' U' R" },
      ],
    },
    {
      id: "f2l-20",
      name: "F2L 20",
      group: "Both on top",
      aliases: ["SpeedCubeDB 13"],
      // The popular version is y' U R' U R U' R' U' R; from this angle that is
      // y' R' U R U' R' U' R, and this is it with F turns instead of the rotation.
      algorithms: [{ id: "f20-1", moves: "F' U F U' F' U' F" }],
    },
    {
      id: "f2l-21",
      name: "F2L 21",
      group: "Both on top",
      aliases: ["SpeedCubeDB 23"],
      algorithms: [
        { id: "f21-3", moves: "R U' R' U' R U' R' U R U' R'" },
        { id: "f21-1", moves: "U R2 U2 R' U' R U' R2" },
        { id: "f21-2", moves: "F R' F' R U R U R'" },
      ],
    },
    {
      id: "f2l-22",
      name: "F2L 22",
      group: "Both on top",
      aliases: ["SpeedCubeDB 16"],
      algorithms: [
        { id: "f22-2", moves: "U' R U' R' U2 F' U' F" },
        { id: "f22-1", moves: "R F R U R' U' F' R'" },
      ],
    },
    {
      id: "f2l-23",
      name: "F2L 23",
      group: "Both on top",
      aliases: ["SpeedCubeDB 6"],
      algorithms: [
        { id: "f23-5", moves: "U r U' R' U R U r'" },
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
      aliases: ["SpeedCubeDB 15"],
      // SpeedCubeDB's top vote, the notes' pick and what the fast-end pack teaches;
      // the R and U version (f24-3) is nearly as popular and follows it.
      algorithms: [
        { id: "f24-4", moves: "U' M U r U' r' U' M'" },
        { id: "f24-3", moves: "U' R U R' U2 R U' R' U R U' R'" },
        { id: "f24-1", moves: "R' F R F' U R U R'" },
        { id: "f24-2", moves: "U' F' U F U2 R U R'" },
      ],
    },
    {
      id: "f2l-25",
      name: "F2L 25",
      group: "Corner in the slot, edge on top",
      aliases: ["SpeedCubeDB 27"],
      algorithms: [
        { id: "f25-3", moves: "R U' R' U R U' R'" },
        { id: "f25-1", moves: "R U' R2 F R F'" },
        { id: "f25-2", moves: "F' U2 F R U2 R'" },
      ],
    },
    {
      id: "f2l-26",
      name: "F2L 26",
      group: "Corner in the slot, edge on top",
      aliases: ["SpeedCubeDB 28"],
      algorithms: [
        { id: "f26-3", moves: "R U R' U' F R' F' R" },
        { id: "f26-1", moves: "R U2 R' F' U2 F" },
        { id: "f26-2", moves: "F' U F2 R' F' R" },
      ],
    },
    {
      id: "f2l-27",
      name: "F2L 27",
      group: "Corner in the slot, edge on top",
      aliases: ["SpeedCubeDB 25"],
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
      aliases: ["SpeedCubeDB 29"],
      algorithms: [
        { id: "f28-4", moves: "R' F R F' U R U' R'" },
        { id: "f28-1", moves: "U R' F R F2 U' F" },
        { id: "f28-2", moves: "U2 R U' R' F' U' F" },
        { id: "f28-3", moves: "F' U' F U F' U' F" },
      ],
    },
    {
      id: "f2l-29",
      name: "F2L 29",
      group: "Corner in the slot, edge on top",
      aliases: ["SpeedCubeDB 30"],
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
      aliases: ["SpeedCubeDB 26"],
      algorithms: [
        { id: "f30-5", moves: "U R U' R' F R' F' R" },
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
      aliases: ["SpeedCubeDB 31"],
      algorithms: [
        { id: "f31-3", moves: "U' R' F R F' R U' R'" },
        { id: "f31-1", moves: "R U' R' F' U2 F" },
        { id: "f31-2", moves: "F' U F R U2 R'" },
      ],
    },
    {
      id: "f2l-32",
      name: "F2L 32",
      group: "Edge in the slot, corner on top",
      aliases: ["SpeedCubeDB 34"],
      algorithms: [
        { id: "f32-2", moves: "U2 R U R' U2 R U R'" },
        { id: "f32-1", moves: "R U2 R' U R U R'" },
      ],
    },
    {
      id: "f2l-33",
      name: "F2L 33",
      group: "Edge in the slot, corner on top",
      aliases: ["SpeedCubeDB 36"],
      algorithms: [
        { id: "f33-5", moves: "U' F' U' F U' R U R'" },
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
      aliases: ["SpeedCubeDB 33"],
      algorithms: [
        { id: "f34-2", moves: "R U' R' U2 R U' R'" },
        { id: "f34-1", moves: "R U' R' U' R U2 R'" },
        { id: "f34-3", moves: "F' U' F U2 F' U' F" },
      ],
    },
    {
      id: "f2l-35",
      name: "F2L 35",
      group: "Edge in the slot, corner on top",
      aliases: ["SpeedCubeDB 35"],
      algorithms: [
        { id: "f35-5", moves: "U R U R' U F' U' F" },
        { id: "f35-1", moves: "R U R' U' F' U F" },
        { id: "f35-2", moves: "R U R' U2 F' U2 F" },
        { id: "f35-3", moves: "R U R' F R' F' R" },
        { id: "f35-4", moves: "R U' R' U' F' U' F" },
        { id: "f35-6", moves: "U R U R' d R' U' R" },
      ],
    },
    {
      id: "f2l-36",
      name: "F2L 36",
      group: "Edge in the slot, corner on top",
      aliases: ["SpeedCubeDB 32"],
      // Twelve moves, but SpeedCubeDB's top vote, the notes' pick and what the
      // fast-end pack teaches: U R U' R' three times turns faster than the R2 one.
      algorithms: [
        { id: "f36-5", moves: "U2 R U' R' U R U' R' U R U' R'" },
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
      aliases: ["SpeedCubeDB 37"],
      algorithms: [
        { id: "f37-2", moves: "R2 U2 F R2 F' U2 R' U R'" },
        { id: "f37-1", moves: "R U' R U2 F R2 F' U2 R2" },
        { id: "f37-3", moves: "F' U F' U2 R' F2 R U2 F2" },
        { id: "f37-4", moves: "F2 U2 R' F2 R U2 F U' F" },
      ],
    },
    {
      id: "f2l-38",
      name: "F2L 38",
      group: "Both stuck in the slot",
      aliases: ["SpeedCubeDB 38"],
      algorithms: [
        { id: "f38-5", moves: "R U' R' U' R U R' U2 R U' R'" },
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
      aliases: ["SpeedCubeDB 40"],
      algorithms: [
        { id: "f39-3", moves: "r U' r' U2 r U r' R U R'" },
        { id: "f39-1", moves: "R F U R U' R' F' U' R'" },
        { id: "f39-2", moves: "F' U' R' F' U' F U R F" },
      ],
    },
    {
      id: "f2l-40",
      name: "F2L 40",
      group: "Both stuck in the slot",
      aliases: ["SpeedCubeDB 39"],
      algorithms: [
        { id: "f40-5", moves: "R U' R' U R U2 R' U R U' R'" },
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
      aliases: ["SpeedCubeDB 41"],
      algorithms: [
        { id: "f41-3", moves: "R U' R' r U' r' U2 r U r'" },
        { id: "f41-1", moves: "R U F R U R' U' F' R'" },
        { id: "f41-2", moves: "F' R' U' F' U F R U F" },
      ],
    },
  ],
};
