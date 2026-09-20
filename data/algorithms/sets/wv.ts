import type { AlgorithmSetData } from "../types";

/**
 * Winter Variation: the last pair goes in and the last layer's corners come
 * up in the same algorithm, for when the edges are already facing up. What's
 * left is a PLL.
 *
 * The algorithms are the community's, collected by SpeedCubeDB, and every one
 * is checked against the cube engine by `tests/unit/algorithms.test.ts`.
 */
export const wv: AlgorithmSetData = {
  id: "winter-variation",
  name: "Winter Variation",
  kind: "wv",
  cases: [
    {
      id: "wv-1",
      name: "WV 1",
      group: "Insert and orient",
      algorithms: [{ id: "wv1-1", moves: "U L' U2 R U R' U2 L" }],
    },
    {
      id: "wv-2",
      name: "WV 2",
      group: "Insert and orient",
      algorithms: [{ id: "wv2-1", moves: "U R U' R'" }],
    },
    {
      id: "wv-3",
      name: "WV 3",
      group: "Insert and orient",
      algorithms: [{ id: "wv3-1", moves: "R' F R U R U' R' F'" }],
    },
    {
      id: "wv-4",
      name: "WV 4",
      group: "Insert and orient",
      algorithms: [{ id: "wv4-1", moves: "U R2 D R' U' R D' R2" }],
    },
    {
      id: "wv-5",
      name: "WV 5",
      group: "Insert and orient",
      algorithms: [{ id: "wv5-1", moves: "U R U' R' U R' U' R U' R' U2 R" }],
    },
    {
      id: "wv-6",
      name: "WV 6",
      group: "Insert and orient",
      algorithms: [{ id: "wv6-1", moves: "R U' R' U2 R U' R' U2 R U R'" }],
    },
    {
      id: "wv-7",
      name: "WV 7",
      group: "Insert and orient",
      algorithms: [{ id: "wv7-1", moves: "U R U R' U' R U' R'" }],
    },
    {
      id: "wv-8",
      name: "WV 8",
      group: "Insert and orient",
      algorithms: [{ id: "wv8-1", moves: "U2 R U' R' U R U2 R'" }],
    },
    {
      id: "wv-9",
      name: "WV 9",
      group: "Insert and orient",
      algorithms: [{ id: "wv9-1", moves: "U2 F' R U2 R' U2 R' F R" }],
    },
    {
      id: "wv-10",
      name: "WV 10",
      group: "Insert and orient",
      algorithms: [{ id: "wv10-1", moves: "U R U R2 U' R2 U' R2 U2 R" }],
    },
    {
      id: "wv-11",
      name: "WV 11",
      group: "Insert and orient",
      algorithms: [{ id: "wv11-1", moves: "U2 R' U' R2 U' R2 U2 R" }],
    },
    {
      id: "wv-12",
      name: "WV 12",
      group: "Insert and orient",
      algorithms: [{ id: "wv12-1", moves: "Lw' U2 Lw F2 U L' U L" }],
    },
    {
      id: "wv-13",
      name: "WV 13",
      group: "Insert and orient",
      algorithms: [{ id: "wv13-1", moves: "U2 R U2 R2 U' R U' R' U2 R" }],
    },
    {
      id: "wv-14",
      name: "WV 14",
      group: "Insert and orient",
      algorithms: [{ id: "wv14-1", moves: "U2 R2 D R' U2 R D' R2" }],
    },
    {
      id: "wv-15",
      name: "WV 15",
      group: "Insert and orient",
      algorithms: [{ id: "wv15-1", moves: "L' U R U' R' L" }],
    },
    {
      id: "wv-16",
      name: "WV 16",
      group: "Insert and orient",
      algorithms: [{ id: "wv16-1", moves: "U R' D' R U R' D R2 U2 R'" }],
    },
    {
      id: "wv-17",
      name: "WV 17",
      group: "Insert and orient",
      algorithms: [{ id: "wv17-1", moves: "R' F' R U2 R U2 R' F" }],
    },
    {
      id: "wv-18",
      name: "WV 18",
      group: "Insert and orient",
      algorithms: [{ id: "wv18-1", moves: "U2 R U2 R'" }],
    },
    {
      id: "wv-19",
      name: "WV 19",
      group: "Insert and orient",
      algorithms: [{ id: "wv19-1", moves: "R' F2 R2 U' R' U' R U R' F2" }],
    },
    {
      id: "wv-20",
      name: "WV 20",
      group: "Insert and orient",
      algorithms: [{ id: "wv20-1", moves: "U R U' R' U' R U R' U R U2 R'" }],
    },
    {
      id: "wv-21",
      name: "WV 21",
      group: "Insert and orient",
      algorithms: [{ id: "wv21-1", moves: "U R U' R2 U2 R U R' U R" }],
    },
    {
      id: "wv-22",
      name: "WV 22",
      group: "Insert and orient",
      algorithms: [{ id: "wv22-1", moves: "U R U R D R' U2 R D' R2" }],
    },
    {
      id: "wv-23",
      name: "WV 23",
      group: "Insert and orient",
      algorithms: [{ id: "wv23-1", moves: "R2 U R' U R' U' R U R U2 R2" }],
    },
    {
      id: "wv-24",
      name: "WV 24",
      group: "Insert and orient",
      algorithms: [{ id: "wv24-1", moves: "U2 R U' R' U R U' R' U R U2 R'" }],
    },
    {
      id: "wv-25",
      name: "WV 25",
      group: "Insert and orient",
      algorithms: [{ id: "wv25-1", moves: "U2 R U2 R2 U2 R U R' U R" }],
    },
    {
      id: "wv-26",
      name: "WV 26",
      group: "Insert and orient",
      algorithms: [{ id: "wv26-1", moves: "U R U' R2 U' R U' R' U2 R" }],
    },
    {
      id: "wv-27",
      name: "WV 27",
      group: "Insert and orient",
      algorithms: [{ id: "wv27-1", moves: "U R U R' U' R U R' U' R U' R'" }],
    },
  ],
};
