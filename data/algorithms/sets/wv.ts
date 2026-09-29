import type { AlgorithmSetData } from "../types";

/**
 * Winter Variation: the last pair goes in and the last layer's corners come
 * up in the same algorithm, so a PLL is all that's left.
 *
 * It only applies when two things are already true: the last pair is joined
 * in the top layer, its corner right above the slot, ready for a U R U' R'
 * insert; and the last layer's edges already face up. Otherwise insert the
 * pair as usual and do OLL.
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
      group: "All three corners up",
      recognition: "All three yellow corners on top already face up.",
      algorithms: [{ id: "wv1-1", moves: "U L' U2 R U R' U2 L" }],
    },
    {
      id: "wv-2",
      name: "WV 2",
      group: "Two corners up",
      recognition:
        "Two yellow corners face up, at the front left and back left. The back-right corner's yellow faces right.",
      algorithms: [{ id: "wv2-1", moves: "U R U' R'" }],
    },
    {
      id: "wv-3",
      name: "WV 3",
      group: "Two corners up",
      recognition:
        "Two yellow corners face up, at the front left and back left. The back-right corner's yellow faces the back.",
      algorithms: [{ id: "wv3-1", moves: "R' F R U R U' R' F'" }],
    },
    {
      id: "wv-4",
      name: "WV 4",
      group: "Two corners up",
      recognition:
        "Two yellow corners face up, at the front left and back right. The back-left corner's yellow faces the back.",
      algorithms: [{ id: "wv4-1", moves: "U R2 D R' U' R D' R2" }],
    },
    {
      id: "wv-5",
      name: "WV 5",
      group: "Two corners up",
      recognition:
        "Two yellow corners face up, at the front left and back right. The back-left corner's yellow faces left.",
      algorithms: [{ id: "wv5-1", moves: "U R U' R' U R' U' R U' R' U2 R" }],
    },
    {
      id: "wv-6",
      name: "WV 6",
      group: "Two corners up",
      recognition:
        "Two yellow corners face up, at the back left and back right. The front-left corner's yellow faces left.",
      algorithms: [{ id: "wv6-1", moves: "R U' R' U2 R U' R' U2 R U R'" }],
    },
    {
      id: "wv-7",
      name: "WV 7",
      group: "Two corners up",
      recognition:
        "Two yellow corners face up, at the back left and back right. The front-left corner's yellow faces you.",
      algorithms: [{ id: "wv7-1", moves: "U R U R' U' R U' R'" }],
    },
    {
      id: "wv-8",
      name: "WV 8",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the back right. The front-left corner's yellow faces left and the back-left corner's faces the back.",
      algorithms: [{ id: "wv8-1", moves: "U2 R U' R' U R U2 R'" }],
    },
    {
      id: "wv-9",
      name: "WV 9",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the back right. The front-left corner's yellow faces you and the back-left corner's faces the back.",
      algorithms: [{ id: "wv9-1", moves: "U2 F' R U2 R' U2 R' F R" }],
    },
    {
      id: "wv-10",
      name: "WV 10",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the back right. The front-left and back-left corners both show their yellow on the left.",
      algorithms: [{ id: "wv10-1", moves: "U R U R2 U' R2 U' R2 U2 R" }],
    },
    {
      id: "wv-11",
      name: "WV 11",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the back right. The front-left corner's yellow faces you and the back-left corner's faces left.",
      algorithms: [{ id: "wv11-1", moves: "U2 R' U' R2 U' R2 U2 R" }],
    },
    {
      id: "wv-12",
      name: "WV 12",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the back left. The front-left corner's yellow faces left and the back-right corner's faces right.",
      algorithms: [{ id: "wv12-1", moves: "l' U2 l F2 U L' U L" }],
    },
    {
      id: "wv-13",
      name: "WV 13",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the back left. The front-left corner's yellow faces you and the back-right corner's faces right.",
      algorithms: [{ id: "wv13-1", moves: "U2 R U2 R2 U' R U' R' U2 R" }],
    },
    {
      id: "wv-14",
      name: "WV 14",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the back left. The front-left corner's yellow faces left and the back-right corner's faces the back.",
      algorithms: [{ id: "wv14-1", moves: "U2 R2 D R' U2 R D' R2" }],
    },
    {
      id: "wv-15",
      name: "WV 15",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the back left. The front-left corner's yellow faces you and the back-right corner's faces the back.",
      algorithms: [{ id: "wv15-1", moves: "L' U R U' R' L" }],
    },
    {
      id: "wv-16",
      name: "WV 16",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the front left. The back-left corner's yellow faces the back and the back-right corner's faces right.",
      algorithms: [{ id: "wv16-1", moves: "U R' D' R U R' D R2 U2 R'" }],
    },
    {
      id: "wv-17",
      name: "WV 17",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the front left. The back-left corner's yellow faces left and the back-right corner's faces right.",
      algorithms: [{ id: "wv17-1", moves: "R' F' R U2 R U2 R' F" }],
    },
    {
      id: "wv-18",
      name: "WV 18",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the front left. The back-left and back-right corners both show their yellow on the back.",
      algorithms: [{ id: "wv18-1", moves: "U2 R U2 R'" }],
    },
    {
      id: "wv-19",
      name: "WV 19",
      group: "One corner up",
      recognition:
        "One yellow corner faces up, at the front left. The back-left corner's yellow faces left and the back-right corner's faces the back.",
      algorithms: [{ id: "wv19-1", moves: "R' F2 R2 U' R' U' R U R' F2" }],
    },
    {
      id: "wv-20",
      name: "WV 20",
      group: "No corner up",
      recognition:
        "No yellow corner faces up. The front-left corner's yellow faces left, the back-left corner's faces the back and the back-right corner's faces right.",
      algorithms: [{ id: "wv20-1", moves: "U R U' R' U' R U R' U R U2 R'" }],
    },
    {
      id: "wv-21",
      name: "WV 21",
      group: "No corner up",
      recognition:
        "No yellow corner faces up. The back-left and back-right corners both show their yellow on the back, and the front-left corner's faces left.",
      algorithms: [{ id: "wv21-1", moves: "U R U' R2 U2 R U R' U R" }],
    },
    {
      id: "wv-22",
      name: "WV 22",
      group: "No corner up",
      recognition:
        "No yellow corner faces up. The front-left corner's yellow faces you, the back-left corner's faces the back and the back-right corner's faces right.",
      algorithms: [{ id: "wv22-1", moves: "U R U R D R' U2 R D' R2" }],
    },
    {
      id: "wv-23",
      name: "WV 23",
      group: "No corner up",
      recognition:
        "No yellow corner faces up. The back-left and back-right corners both show their yellow on the back, and the front-left corner's faces you.",
      algorithms: [{ id: "wv23-1", moves: "R2 U R' U R' U' R U R U2 R2" }],
    },
    {
      id: "wv-24",
      name: "WV 24",
      group: "No corner up",
      recognition:
        "No yellow corner faces up. The front-left and back-left corners both show their yellow on the left, and the back-right corner's faces right.",
      algorithms: [{ id: "wv24-1", moves: "U2 R U' R' U R U' R' U R U2 R'" }],
    },
    {
      id: "wv-25",
      name: "WV 25",
      group: "No corner up",
      recognition:
        "No yellow corner faces up. The front-left and back-left corners both show their yellow on the left, and the back-right corner's faces the back.",
      algorithms: [{ id: "wv25-1", moves: "U2 R U2 R2 U2 R U R' U R" }],
    },
    {
      id: "wv-26",
      name: "WV 26",
      group: "No corner up",
      recognition:
        "No yellow corner faces up. The front-left corner's yellow faces you, the back-left corner's faces left and the back-right corner's faces right.",
      algorithms: [{ id: "wv26-1", moves: "U R U' R2 U' R U' R' U2 R" }],
    },
    {
      id: "wv-27",
      name: "WV 27",
      group: "No corner up",
      recognition:
        "No yellow corner faces up. The front-left corner's yellow faces you, the back-left corner's faces left and the back-right corner's faces the back.",
      algorithms: [{ id: "wv27-1", moves: "U R U R' U' R U R' U' R U' R'" }],
    },
  ],
};
