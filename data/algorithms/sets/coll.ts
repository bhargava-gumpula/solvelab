import type { AlgorithmSetData } from "../types";

/**
 * COLL: the last layer's corners solved in one look, while the edges stay
 * oriented. Used after the edges are already facing up, so only a PLL of the
 * edges is left.
 *
 * The algorithms are the community's, collected by SpeedCubeDB, and every one
 * is checked against the cube engine by `tests/unit/algorithms.test.ts`: it
 * must solve the case it is listed under, allowing a U turn either side. Any
 * that didn't were dropped rather than published.
 */
export const coll: AlgorithmSetData = {
  id: "coll",
  name: "COLL",
  kind: "coll",
  cases: [
    {
      id: "coll-as1",
      name: "AS 1",
      group: "Antisune",
      algorithms: [
        { id: "coll-as1-1", moves: "y R U2 R' U' R U' R'" },
        { id: "coll-as1-2", moves: "R' U' R U' R' U2 R" },
        { id: "coll-as1-3", moves: "y2 L' U' L U' L' U2 L" },
        { id: "coll-as1-4", moves: "y' L U2 L' U' L U' L'" },
      ],
    },
    {
      id: "coll-as2",
      name: "AS 2",
      group: "Antisune",
      algorithms: [
        { id: "coll-as2-1", moves: "y2 R2 D R' U R D' R' U R' U' R U' R'" },
        { id: "coll-as2-2", moves: "y R' U' R U' R' U R' D' R U R' D R2" },
        { id: "coll-as2-3", moves: "U2 R2 D R' U R D' R' U R' U' R U' R'" },
        { id: "coll-as2-4", moves: "R U R' f' U' R U2 R' U' R U' R' f R U' R'" },
      ],
    },
    {
      id: "coll-as3",
      name: "AS 3",
      group: "Antisune",
      algorithms: [
        { id: "coll-as3-1", moves: "y2 R2 D R' U2 R D' R2 U' R U' R'" },
        { id: "coll-as3-2", moves: "R' U' F' R U R' U' R' F R2 U' R' U R" },
        { id: "coll-as3-3", moves: "y2 M F' r U R' U2 r' F2 r" },
        { id: "coll-as3-4", moves: "U2 f' L F L' U2 L' U2 L U2 S" },
      ],
    },
    {
      id: "coll-as4",
      name: "AS 4",
      group: "Antisune",
      algorithms: [
        { id: "coll-as4-1", moves: "y2 R' U' R U' R2 D' R U2 R' D R2" },
        { id: "coll-as4-2", moves: "y2 R U2 R' U2 r' F R F' M'" },
        { id: "coll-as4-3", moves: "R' U' R U R' F R U R' U' R' F' R2" },
        { id: "coll-as4-4", moves: "y2 R U2 R' U2 L' U R U' R' L" },
      ],
    },
    {
      id: "coll-as5",
      name: "AS 5",
      group: "Antisune",
      algorithms: [
        { id: "coll-as5-1", moves: "y2 r' F R F' r U R'" },
        { id: "coll-as5-2", moves: "R' U L U' R U L'" },
        { id: "coll-as5-3", moves: "y2 L' U R U' L U R'" },
        { id: "coll-as5-4", moves: "U2 R' F R F' r U R' U' M" },
      ],
    },
    {
      id: "coll-as6",
      name: "AS 6",
      group: "Antisune",
      algorithms: [
        { id: "coll-as6-1", moves: "R U' R' U2 R U' R' U2 R' D' R U R' D R" },
        { id: "coll-as6-2", moves: "R U2 r' F R' F' r U' R U' R'" },
        { id: "coll-as6-3", moves: "R U R' F' R U2 R' U' R U' R' F R U' R'" },
        { id: "coll-as6-4", moves: "y2 L U2 R' U L' U' R U' L U' L'" },
      ],
    },
    {
      id: "coll-s1",
      name: "S 1",
      group: "Sune",
      algorithms: [
        { id: "coll-s1-1", moves: "R U R' U R U2 R'" },
        { id: "coll-s1-2", moves: "y' R' U2 R U R' U R" },
        { id: "coll-s1-3", moves: "y L' U2 L U L' U L" },
        { id: "coll-s1-4", moves: "y2 L U L' U L U2 L'" },
      ],
    },
    {
      id: "coll-s2",
      name: "S 2",
      group: "Sune",
      algorithms: [
        { id: "coll-s2-1", moves: "y2 R U R' U R2 D R' U2 R D' R2" },
        { id: "coll-s2-2", moves: "r' F2 r U2 R U' r' F M'" },
        { id: "coll-s2-3", moves: "L' U2 L U2 R U' L' U L R'" },
        { id: "coll-s2-4", moves: "L' U2 L U2 l F' L' F M'" },
      ],
    },
    {
      id: "coll-s3",
      name: "S 3",
      group: "Sune",
      algorithms: [
        { id: "coll-s3-1", moves: "L' R U R' U' L U2 R U2 R'" },
        { id: "coll-s3-2", moves: "M F R' F' r U2 R U2 R'" },
        { id: "coll-s3-3", moves: "y2 R2 D' R U2 R' D R2 U R' U R" },
        { id: "coll-s3-4", moves: "f R' F' R U2 R U2 R' U2 S'" },
      ],
    },
    {
      id: "coll-s4",
      name: "S 4",
      group: "Sune",
      algorithms: [
        { id: "coll-s4-1", moves: "y' R U R' U R U' R D R' U' R D' R2" },
        { id: "coll-s4-2", moves: "R U R' U' R' F R F' r U R' U R U2 r'" },
        { id: "coll-s4-3", moves: "y' F R' U2 R F' R' F U2 F' R" },
        { id: "coll-s4-4", moves: "L F' U2 F L' F' L U2 L' F" },
      ],
    },
    {
      id: "coll-s5",
      name: "S 5",
      group: "Sune",
      algorithms: [
        { id: "coll-s5-1", moves: "R U' L' U R' U' L" },
        { id: "coll-s5-2", moves: "R U' r' F R' F' r" },
        { id: "coll-s5-3", moves: "l F' L' F l' U' L" },
        { id: "coll-s5-4", moves: "r U' r' F R' F' r U M" },
      ],
    },
    {
      id: "coll-s6",
      name: "S 6",
      group: "Sune",
      algorithms: [
        { id: "coll-s6-1", moves: "y2 R U R' F' R U R' U R U2 R' F R U' R'" },
        { id: "coll-s6-2", moves: "y2 R U R' U r' F R F' r U2 R'" },
        { id: "coll-s6-3", moves: "y2 R U R' U L' U R U' L U2 R'" },
        { id: "coll-s6-4", moves: "F' R U2 R' U2 R' F2 R U R U' R' F'" },
      ],
    },
    {
      id: "coll-l1",
      name: "L 1",
      group: "L",
      algorithms: [
        { id: "coll-l1-1", moves: "y' R U R' U R U' R' U R U' R' U R U2 R'" },
        { id: "coll-l1-2", moves: "y' R U2 R' U' R U R' U' R U R' U' R U' R'" },
        { id: "coll-l1-3", moves: "y2 R' U2 R U R' U' R U R' U' R U R' U R" },
        { id: "coll-l1-4", moves: "R' U' R U' R' U2 R U' R U R' U R U2 R'" },
      ],
    },
    {
      id: "coll-l2",
      name: "L 2",
      group: "L",
      algorithms: [
        { id: "coll-l2-1", moves: "R' U2 R' D' R U2 R' D R2" },
        { id: "coll-l2-2", moves: "y2 L' U2 L' D' L U2 L' D L2" },
        { id: "coll-l2-3", moves: "y' R' U2 R U R2 D' R U R' D R2" },
      ],
    },
    {
      id: "coll-l3",
      name: "L 3",
      group: "L",
      algorithms: [
        { id: "coll-l3-1", moves: "y R U2 R D R' U2 R D' R2" },
        { id: "coll-l3-2", moves: "U2 R U2 R2 D' R U' R' D R2 U' R'" },
        { id: "coll-l3-3", moves: "R' F' R U R' U' R' F R2 U' R' U2 R" },
        { id: "coll-l3-4", moves: "y R' U' R U2 L' U R' U' L U' R" },
      ],
    },
    {
      id: "coll-l4",
      name: "L 4",
      group: "L",
      algorithms: [
        { id: "coll-l4-1", moves: "y F R' F' r U R U' r'" },
        { id: "coll-l4-2", moves: "y2 R2 D R' U R D' R' U' R'" },
        { id: "coll-l4-3", moves: "R U R' U' R' F R U R U' R' F'" },
        { id: "coll-l4-4", moves: "y F l' U' L U R U' r'" },
      ],
    },
    {
      id: "coll-l5",
      name: "L 5",
      group: "L",
      algorithms: [
        { id: "coll-l5-1", moves: "y2 F' r U R' U' r' F R" },
        { id: "coll-l5-2", moves: "y x R' U R D' R' U' R D x'" },
        { id: "coll-l5-3", moves: "r U R U' r' F R' F'" },
        { id: "coll-l5-4", moves: "y' R2 D' R U' R' D R U R" },
      ],
    },
    {
      id: "coll-l6",
      name: "L 6",
      group: "L",
      algorithms: [
        { id: "coll-l6-1", moves: "y r U2 R2 F R F' R U2 r'" },
        { id: "coll-l6-2", moves: "y' R' U' R U R' F' R U R' U' R' F R2" },
        { id: "coll-l6-3", moves: "U' R' U' R U R' F' R U R' U' R' F R2" },
        { id: "coll-l6-4", moves: "y F R U R2 F R F' R U' R' F'" },
      ],
    },
    {
      id: "coll-u1",
      name: "U 1",
      group: "U",
      algorithms: [
        { id: "coll-u1-1", moves: "R' U' R U' R' U2 R2 U R' U R U2 R'" },
        { id: "coll-u1-2", moves: "y2 R U R' U R U2 R2 U' R U' R' U2 R" },
        { id: "coll-u1-3", moves: "y R U2 R' U' R U' R' U' R U R' U R U2 R'" },
        { id: "coll-u1-4", moves: "y' R U R' U' R U' R' U2 R U' R' U2 R U R'" },
      ],
    },
    {
      id: "coll-u2",
      name: "U 2",
      group: "U",
      algorithms: [
        { id: "coll-u2-1", moves: "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R" },
        { id: "coll-u2-2", moves: "y' r U R' U' r' F R2 U' R' U' R U2 R' U' F'" },
        { id: "coll-u2-3", moves: "y' R' U' R F R2 D' R U R' D R2 U' F'" },
        { id: "coll-u2-4", moves: "y F U R U2 R' U R U R2 F' r U R U' r'" },
      ],
    },
    {
      id: "coll-u3",
      name: "U 3",
      group: "U",
      algorithms: [
        { id: "coll-u3-1", moves: "y2 R2 D R' U2 R D' R' U2 R'" },
        { id: "coll-u3-2", moves: "L2 D L' U2 L D' L' U2 L'" },
        { id: "coll-u3-3", moves: "R U' R' U' R U2 R' U' R' D' R U2 R' D R" },
        { id: "coll-u3-4", moves: "R' U R U R' F' R U R' U' R' F R2 U' R' U' R" },
      ],
    },
    {
      id: "coll-u4",
      name: "U 4",
      group: "U",
      algorithms: [
        { id: "coll-u4-1", moves: "F R U' R' U R U R' U R U' R' F'" },
        { id: "coll-u4-2", moves: "y2 R' F2 R U2 R U2 R' F2 R U2 R'" },
        { id: "coll-u4-3", moves: "y' F U2 R' D' R U2 R' D R F'" },
        { id: "coll-u4-4", moves: "y2 R U2 R' U2 L' U2 R U2 R' U2 L" },
      ],
    },
    {
      id: "coll-u5",
      name: "U 5",
      group: "U",
      algorithms: [
        { id: "coll-u5-1", moves: "R2 D' R U2 R' D R U2 R" },
        { id: "coll-u5-2", moves: "y2 L2 D' L U2 L' D L U2 L" },
        { id: "coll-u5-3", moves: "L U' R U' L' U R' U2 L U' L'" },
      ],
    },
    {
      id: "coll-u6",
      name: "U 6",
      group: "U",
      algorithms: [
        { id: "coll-u6-1", moves: "R2 D' R U R' D R U R U' R' U' R" },
        { id: "coll-u6-2", moves: "R' U2 R F U' R' U' R U F'" },
        { id: "coll-u6-3", moves: "R U' R' U' R U R D R' U R D' R2" },
        { id: "coll-u6-4", moves: "R' U2 R U2 R' F' R U R' U' R' F R2" },
      ],
    },
    {
      id: "coll-t1",
      name: "T 1",
      group: "T",
      algorithms: [
        { id: "coll-t1-1", moves: "R U2 R' U' R U' R2 U2 R U R' U R" },
        { id: "coll-t1-2", moves: "y' R U R2 U' R2 U' R2 U2 R U' R U' R'" },
        { id: "coll-t1-3", moves: "R U2 R' r' F2 r U' R U' R' U' r' F r" },
        { id: "coll-t1-4", moves: "y' R U R' U R U2 R' L' U' L U' L' U2 L" },
      ],
    },
    {
      id: "coll-t2",
      name: "T 2",
      group: "T",
      algorithms: [
        { id: "coll-t2-1", moves: "R' U R U2 R' L' U R U' L" },
        { id: "coll-t2-2", moves: "R' U R U2 r' R' F R F' r" },
        { id: "coll-t2-3", moves: "y2 R' F R U R' U' R' F' R2 U' R' U2 R" },
        { id: "coll-t2-4", moves: "y2 R U' R' U2 L R U' R' U L'" },
      ],
    },
    {
      id: "coll-t3",
      name: "T 3",
      group: "T",
      algorithms: [
        { id: "coll-t3-1", moves: "y R' F' r U R U' r' F" },
        { id: "coll-t3-2", moves: "y l' U' L U R U' r' F" },
        { id: "coll-t3-3", moves: "y2 R' U' R' D' R U R' D R2" },
        { id: "coll-t3-4", moves: "y l' U' L U l F' L' F" },
      ],
    },
    {
      id: "coll-t4",
      name: "T 4",
      group: "T",
      algorithms: [
        { id: "coll-t4-1", moves: "y2 F R U R' U' R U' R' U' R U R' F'" },
        { id: "coll-t4-2", moves: "y2 F R' D' R U2 R' D R U2 F'" },
        { id: "coll-t4-3", moves: "y2 R F R' U R U2 R' U R U F' R'" },
        { id: "coll-t4-4", moves: "y R U2 R' F2 R U2 R' U2 R' F2 R" },
      ],
    },
    {
      id: "coll-t5",
      name: "T 5",
      group: "T",
      algorithms: [
        { id: "coll-t5-1", moves: "y' r U R' U' r' F R F'" },
        { id: "coll-t5-2", moves: "R U R D R' U' R D' R2" },
        { id: "coll-t5-3", moves: "y2 x' D R U' R' D' R U R' x" },
        { id: "coll-t5-4", moves: "R U R' U R' D' R U' R' D R2 U' R'" },
      ],
    },
    {
      id: "coll-t6",
      name: "T 6",
      group: "T",
      algorithms: [
        { id: "coll-t6-1", moves: "R' U R2 D r' U2 r D' R2 U' R" },
        { id: "coll-t6-2", moves: "y2 R U' R2 D' r U2 r' D R2 U R'" },
        { id: "coll-t6-3", moves: "y R' U' R U R2 D' R U2 R' D R2 U' R' U R" },
        { id: "coll-t6-4", moves: "y R U R' U' R2 D R' U2 R D' R2 U R U' R'" },
      ],
    },
    {
      id: "coll-pi1",
      name: "Pi 1",
      group: "Pi",
      algorithms: [
        { id: "coll-pi1-1", moves: "R U2 R2 U' R2 U' R2 U2 R" },
        { id: "coll-pi1-2", moves: "R' U2 R2 U R2 U R2 U2 R'" },
        { id: "coll-pi1-3", moves: "y2 L' U2 L2 U L2 U L2 U2 L'" },
        { id: "coll-pi1-4", moves: "R U R' U R U2 R' U' R U R' U R U2 R'" },
      ],
    },
    {
      id: "coll-pi2",
      name: "Pi 2",
      group: "Pi",
      algorithms: [
        { id: "coll-pi2-1", moves: "y F U R U' R' U R U' R2 F' R U R U' R'" },
        { id: "coll-pi2-2", moves: "R' F2 R U2 R U2 R' F2 U' R U' R'" },
        { id: "coll-pi2-3", moves: "y2 L' U' L U L F' L2 U' L U L' U' L U F" },
        { id: "coll-pi2-4", moves: "R U R' U R' F R2 U' R' U' R U R' F' U R U' R'" },
      ],
    },
    {
      id: "coll-pi3",
      name: "Pi 3",
      group: "Pi",
      algorithms: [
        { id: "coll-pi3-1", moves: "R' U' F' R U R' U' R' F R2 U2 R' U2 R" },
        { id: "coll-pi3-2", moves: "y F U R U' R' U R U2 R' U' R U R' F'" },
        { id: "coll-pi3-3", moves: "y F R2 U' R2 U R2 U S R2 f'" },
        { id: "coll-pi3-4", moves: "y' R U R' U R U2 R2 F' r U R U' r' F" },
      ],
    },
    {
      id: "coll-pi4",
      name: "Pi 4",
      group: "Pi",
      algorithms: [
        { id: "coll-pi4-1", moves: "R U R' U' R' F R2 U R' U' R U R' U' F'" },
        { id: "coll-pi4-2", moves: "R U2 R' U' R U R' U2 r' F R F' M'" },
        { id: "coll-pi4-3", moves: "y' R' U2 R U R' U R2 U' L' U R' U' L" },
      ],
    },
    {
      id: "coll-pi5",
      name: "Pi 5",
      group: "Pi",
      algorithms: [
        { id: "coll-pi5-1", moves: "R U' L' U R' U L U L' U L" },
        { id: "coll-pi5-2", moves: "y' R U2 R' U R' D' R U2 R' D R2 U' R'" },
        { id: "coll-pi5-3", moves: "y' R U R' U F' R U2 R' U2 R' F R" },
        { id: "coll-pi5-4", moves: "y2 L' U R U' L U' R' U' R U' R'" },
      ],
    },
    {
      id: "coll-pi6",
      name: "Pi 6",
      group: "Pi",
      algorithms: [
        { id: "coll-pi6-1", moves: "R' F' U' F U' R U S' R' U R S" },
        { id: "coll-pi6-2", moves: "y' r U R' U R' F R F' R U' R' U R U2 r'" },
        { id: "coll-pi6-3", moves: "R U D' R U R' D R2 U' R' U' R2 U2 R" },
        { id: "coll-pi6-4", moves: "R2 D' R U R' D R U R U' R' U R U R' U R" },
      ],
    },
    {
      id: "coll-h1",
      name: "H 1",
      group: "H",
      algorithms: [
        { id: "coll-h1-1", moves: "R U R' U R U' R' U R U2 R'" },
        { id: "coll-h1-2", moves: "y' R U2 R' U' R U R' U' R U' R'" },
        { id: "coll-h1-3", moves: "y' R' U2 R U R' U' R U R' U R" },
      ],
    },
    {
      id: "coll-h2",
      name: "H 2",
      group: "H",
      algorithms: [
        { id: "coll-h2-1", moves: "F R U' R' U R U2 R' U' R U R' U' F'" },
        { id: "coll-h2-2", moves: "f R2 S' U' R2 U' R2 U R2 F'" },
        { id: "coll-h2-3", moves: "y2 f R U R' U' R F' R U R' U' R' S'" },
        { id: "coll-h2-4", moves: "f R U R' U' f' R U R' U' R' F R F'" },
      ],
    },
    {
      id: "coll-h3",
      name: "H 3",
      group: "H",
      algorithms: [
        { id: "coll-h3-1", moves: "R U R' U R U L' U R' U' L" },
        { id: "coll-h3-2", moves: "R U R' U R U r' F R' F' r" },
        { id: "coll-h3-3", moves: "R' F' R U2 R U2 R' F U' R U' R'" },
        { id: "coll-h3-4", moves: "R U R2 D' R U2 R' D R U' R U2 R'" },
      ],
    },
    {
      id: "coll-h4",
      name: "H 4",
      group: "H",
      algorithms: [
        { id: "coll-h4-1", moves: "y F R U R' U' R U R' U' R U R' U' F'" },
        { id: "coll-h4-2", moves: "y F U R U' R' U R U' R' U R U' R' F'" },
        { id: "coll-h4-3", moves: "U F R U R' U' R U R' U' R U R' U' F'" },
        { id: "coll-h4-4", moves: "y' F R U R' U' R U R' U' R U R' U' F'" },
      ],
    },
  ],
};
