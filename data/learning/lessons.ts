import type { PackExample } from "@/data/training/types";
import { HOLD_RULE, SCRAMBLE_HOLD, SOLVING_HOLD, SOLVING_ROTATION } from "@/lib/config/cube";

export type LessonId = string;

export interface LessonStep {
  title: string;
  body: string;
}

export interface Lesson {
  id: LessonId;
  pathId: "beginner" | "cfop" | "advanced";
  title: string;
  summary: string;
  minutes: number;
  steps: LessonStep[];
  /** Worked examples the lesson player shows on the 3D cube, after the reading. */
  examples?: PackExample[];
  practiceHint?: string;
}

export const lessons: Lesson[] = [
  {
    id: "beginner-know-cube",
    pathId: "beginner",
    title: "Know your cube",
    summary: "Centers, edges, corners, what never moves, and how to hold the cube.",
    minutes: 5,
    steps: [
      {
        title: "Center pieces define the colors",
        body: "Each face center stays opposite the same center forever. White opposite yellow, red opposite orange, blue opposite green on a standard Western color scheme.",
      },
      {
        title: "Edges and corners",
        body: "Edges have two colors; corners have three. You never swap a corner with an edge — every move preserves piece type.",
      },
      {
        title: "Hold the cube the solving way",
        body: `Apply every scramble with ${SCRAMBLE_HOLD}. Then turn the whole cube over sideways, as if turning the front face twice (written ${SOLVING_ROTATION}), so green stays in front. Solve with the ${SOLVING_HOLD}. White stays on the bottom and yellow on top for the whole solve (turning the cube around with white still down is fine) — every algorithm and inspection plan here assumes it. An x2 also gets white to the bottom, but it brings blue to the front.`,
      },
    ],
    practiceHint: "Scramble lightly and name five pieces out loud before solving.",
  },
  {
    id: "beginner-notation",
    pathId: "beginner",
    title: "Read cube notation",
    summary: "Face turns, primes, rotations and slices — the language of every scramble.",
    minutes: 10,
    steps: [
      {
        title: "Faces",
        body: "R = right, L = left, U = up, D = down, F = front, B = back. A letter alone means a 90° clockwise turn of that face.",
      },
      {
        title: "Primes and doubles",
        body: "R′ (or R') is counter-clockwise. R2 is a 180° turn. Scrambles are just sequences of these moves.",
      },
      {
        title: "Relative to how you hold it",
        body: "Notation is always relative to the current orientation. If you rotate the whole cube, “R” changes which physical face moves.",
      },
      {
        title: "Whole-cube rotations",
        body: "x, y and z turn the whole cube instead of one face: x turns it the way R turns, y the way U turns, and z the way F turns. Primes and 2s work just as they do for faces. You will do one every solve: after scrambling with white on top and green in front, z2 puts white on the bottom and yellow on top, keeps green in front, and moves red from the right side to the left — so orange is now on the right, and R turns the orange side.",
      },
      {
        title: "Wide moves and slices",
        body: "A lowercase letter turns a face together with the middle layer next to it: r is R plus the middle layer beside it, and f is F plus the middle layer behind it. You will also see these written Rw and Fw. Slice moves turn only a middle layer: M (between L and R) turns the same way as L, E (between U and D) turns like D, and S (between F and B) turns like F.",
      },
    ],
    practiceHint: "Execute R U R′ U′ slowly three times and watch the cycle.",
  },
  {
    id: "beginner-first-layer",
    pathId: "beginner",
    title: "Build your first layer",
    summary: "White cross on the bottom, then white corners — a repeatable beginner path.",
    minutes: 12,
    steps: [
      {
        title: "White cross on the bottom",
        body: "Hold white on the bottom and yellow on top (z2 after the scramble) and build the cross there, matching each white edge's other color to its center. A daisy is fine as a bridge while learning: gather the four white edges white side up around the yellow center, turn the top until an edge's side color sits above its matching center, then turn that face twice to bring it down. From then on, white stays on the bottom and yellow on top.",
      },
      {
        title: "Insert white corners",
        body: "Turn the top until a white corner sits directly above the slot it belongs in (turn the whole cube, white still down, to bring that slot to the front). For the front-right slot, repeat R U R′ U′ until the corner drops in white side down: once if white points to the side, three times if it points up, five times if it points at you. For the front-left slot, use L′ U′ L U the same way. Each repeat leaves the cross as it was, and this is the same trigger F2L uses later.",
      },
      {
        title: "Check the layer",
        body: "When the white face is solved and the first-layer side colors match their centers, move on.",
      },
    ],
    practiceHint: "Solve only the white layer ten times; ignore the rest of the cube.",
  },
  {
    id: "beginner-first-solve",
    pathId: "beginner",
    title: "Complete your first solve",
    summary:
      "Second layer, then the last layer in four steps: yellow cross, yellow corners, corners, edges.",
    minutes: 25,
    steps: [
      {
        title: "Second-layer edges",
        body: "Find an edge on top with no yellow on it. Turn the top until its side color matches the center below it, then turn the whole cube (white still down) so that center faces you. If the edge's top color matches the right center, do U R U′ R′ U′ F′ U F; if it matches the left center, do U′ L′ U L U F U′ F′. Either one drops the edge into the middle layer and puts the white corner back. No edge on top without yellow, but a middle edge in the wrong slot or flipped? Hold that slot at the front right and do the right-hand insert once to lift the edge onto the top, then place it as usual.",
      },
      {
        title: "Yellow cross",
        body: "Look only at the yellow edges on top and ignore the corners. Hold the shape the right way before every go. A line: hold it left to right and do F R U R′ U′ F′, and the cross is done. An L: hold it at the back left (yellow edges at the back and on the left) and do F R U R′ U′ F′ to turn it into a line, then do the line step; or do F U R U′ R′ F′ from the same hold to go straight to the cross. If you use f R U R′ U′ f′ instead, hold the L at the front right. A dot: do F R U R′ U′ F′ holding the cube any way, and you get an L. Repeating the algorithm without holding the shape first can go round in circles.",
      },
      {
        title: "Yellow corners",
        body: "Count the corners with yellow on top and hold the cube by that count. One: put it at the front left. None: turn the cube until the front-left corner's yellow faces left. Two: turn it until the front-left corner's yellow faces you. Then do the Sune, R U R′ U R U2 R′, and count again, holding by the same rule before each go. At most three Sunes finish the yellow face, and the cross stays in place.",
      },
      {
        title: "Corners into place",
        body: "Look around the top layer for headlights: a side whose two top corners show the same color. Headlights on one side: hold them on the left and do the T perm, R U R′ U′ R′ F R2 U′ R′ U′ R U R′ F′. No headlights: do the Y perm, F R U′ R′ U′ R U R′ F′ R U R′ U′ R′ F R F′, holding the cube any way. Either way you finish with headlights on all four sides, which means the corners are done. Turn the top until each corner matches the centers beside it.",
      },
      {
        title: "Edges into place",
        body: "Look for a finished side, where the whole top row matches the center. Hold it at the back and look at the front edge. If its color matches the right center, do the Ua perm, R U′ R U R U R U′ R′ U′ R2; if it matches the left center, do the Ub perm, R2 U R U R′ U′ R′ U′ R′ U R′. Mixed them up? The finished side stays at the back, so do the same one again. No finished side yet: do either one holding the cube any way, and you will have one. When every side matches, the cube is solved. Accuracy first.",
      },
    ],
    examples: [
      {
        label: "Middle edge, right-hand insert",
        moves: "U R U' R' U' F' U F",
        note: "The edge's side color matches the front center and its top color the right one.",
      },
      {
        label: "Middle edge, left-hand insert",
        moves: "U' L' U L U F U' F'",
        note: "The same, with its top color matching the left center.",
      },
      {
        label: "Yellow cross from a line",
        moves: "F R U R' U' F'",
        caseId: "2oll-line",
        note: "The line held left to right.",
      },
      {
        label: "Yellow corners: the Sune",
        moves: "R U R' U R U2 R'",
        caseId: "2oll-sune",
        note: "One corner up, held at the front left.",
      },
      {
        label: "Corners into place: T perm",
        moves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        caseId: "pll-t",
        note: "Headlights held on the left.",
      },
      {
        label: "Corners into place: Y perm",
        moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        caseId: "pll-y",
        note: "No headlights on any side.",
      },
      {
        label: "Edges into place: Ua perm",
        moves: "R U' R U R U R U' R' U' R2",
        caseId: "pll-ua",
        note: "The finished side at the back; the front edge belongs on the right.",
      },
    ],
    practiceHint: "Aim for a clean solve under five minutes before caring about averages.",
  },
  {
    id: "cfop-cross",
    pathId: "cfop",
    title: "Plan your cross",
    summary:
      "Use inspection to find all four white edges and plan as much of the cross as you can before the first turn.",
    minutes: 10,
    steps: [
      {
        title: "Inspection goal",
        body: `${HOLD_RULE} Do the ${SOLVING_ROTATION} as inspection starts, then use the 15 seconds to find all four white edges and plan as much of the cross on the bottom as you can before your first turn: at least the first two edges. Planning the whole cross is the goal of the Sub-30 course, so don't worry yet if the last edges are still a search. Never solve the cross on top; color neutrality is an optional extra for later, not part of this lesson.`,
      },
      {
        title: "Efficient crosses",
        body: "Every cross can be solved in 8 moves or fewer. If yours often take 10+, practice the cross on its own, untimed: find a solution, look for a shorter one, then redo the same scramble with 15 seconds of inspection and see how much more of it you can plan before turning.",
      },
    ],
    practiceHint:
      "Start a Cross diagnostic on Train and see how it compares to the rest of your solve.",
  },
  {
    id: "cfop-f2l",
    pathId: "cfop",
    title: "Understand intuitive F2L",
    summary: "Pair an edge and corner, then insert — without rote cases at first.",
    minutes: 12,
    steps: [
      {
        title: "Pair then insert",
        body: "Intuitive F2L sounds like dozens of cases and is really three ideas. If the corner or edge you need is stuck in a slot where it doesn't belong, take it out, usually with the same three-move trigger you insert with. Turn the top layer to bring the corner and edge together into a pair. Then drop the pair into its slot. The easiest case is a joined pair waiting in the top layer one turn from its slot: with the corner at the front left and its edge beside it at the front, R U' R' drops it in with three moves. Learn to spot pairs like that, then learn to make them by moving one piece out of the way, turning the top so the other lines up, and bringing the first back. Learn the motion, not forty-one names.",
      },
      {
        title: "Front slots first",
        body: "Insert into the two front slots to begin with, turning the cube to bring a back slot round if you have to. Rotations hide the pieces you would otherwise see coming, so avoid a y2 and prefer a top turn when one will do; cutting them down properly comes later. Right now the point is understanding what the moves do to the pair.",
      },
      {
        title: "Slow is smooth",
        body: "Turning slower so you can look for the next pair while this one goes in beats frantic turning that forces pauses.",
      },
    ],
    examples: [
      {
        label: "The three-move case",
        moves: "R U R'",
        caseId: "f2l-1",
        note: "The pair isn't joined yet, but one R U R' joins it and drops it in at once. Most F2L solutions are built from this and its mirror.",
      },
    ],
    practiceHint: "Start F2L training on Train — turn a bit slower and look for the next pair.",
  },
  {
    id: "cfop-2look-oll",
    pathId: "cfop",
    title: "Learn 2-look OLL",
    summary: "Edge orientation, then seven corner cases, starting with Sune and Antisune.",
    minutes: 14,
    steps: [
      {
        title: "Edges first",
        body: "Orienting the last layer takes two looks. In the first, look only at the four edges on top and whether their yellow faces up. Ignore the corners, and ignore where anything belongs: that is PLL's job. You will see a dot (none up), an L (two next to each other), a line (two opposite) or the cross already made. That is three algorithms, and the dot is just the line and the L done one after the other. Get to where you name the shape the moment you look.",
      },
      {
        title: "Seven corner cases",
        body: "With the yellow cross made, count how many corners show yellow on top. None up means H or Pi: H shows a pair of yellow stickers on two opposite sides, Pi on one side only. One up means Sune or Antisune: put that corner at the front left and look at the front-right corner's side sticker. Yellow facing you is a Sune, ready to go; yellow facing right is an Antisune, whose algorithm starts with the up corner at the back right, so turn the top twice first. Two up means Headlights (U), T (Chameleon) or Bowtie (L): if the two up corners sit side by side, look at the other two. Yellow on the same side is Headlights; yellow pointing opposite ways is T. If the up corners are diagonal, it's the Bowtie. None of them is rare: six of the seven come up equally often and H only half as often, so each is worth learning. Drill recognition before speed.",
      },
      {
        title: "Sune and Antisune first",
        body: "Learn these two before the other five. Each is only seven moves, they mirror each other (each is also the other one run backwards), and both use only R and U turns, the same turns as your right-hand F2L inserts: the Sune opens with R U R′ and the Antisune with R U2 R′. Until you know the rest, the Sune hold rule from your first solve still finishes any of them in at most three Sunes. That is slower than the real algorithm, so replace it one case at a time.",
      },
      {
        title: "Stay on 2-look OLL for now",
        body: "Keep 2-look OLL while you learn full PLL, which comes first: start it in the Sub-45 course if you like and finish it in Sub-30. Full OLL comes around sub-20, as an option in the Sub-20 course and expected by Sub-15, learned in groups starting from the seven corner cases you already know.",
      },
    ],
    examples: [
      {
        label: "Line, held horizontally",
        moves: "F R U R' U' F'",
        caseId: "2oll-line",
        note: "Turns a line of two edges into the cross.",
      },
      {
        label: "L shape, held at the front right",
        moves: "f R U R' U' f'",
        caseId: "2oll-l",
        note: "The same idea with a wide front turn.",
      },
      {
        label: "Sune",
        moves: "R U R' U R U2 R'",
        caseId: "2oll-sune",
        note: "One corner up, at the front left.",
      },
      {
        label: "Antisune",
        moves: "R U2 R' U' R U' R'",
        caseId: "2oll-antisune",
        note: "The Sune run backwards: its up corner starts at the back right.",
      },
    ],
  },
  {
    id: "cfop-2look-pll",
    pathId: "cfop",
    title: "Learn 2-look PLL",
    summary: "Permute corners, then edges — twenty-one cases can wait.",
    minutes: 14,
    steps: [
      {
        title: "Corner permutation",
        body: "Look for headlights: two matching corner colors on one side. Headlights on one side: hold them on the left and do the T perm, which swaps the two right-hand corners. No headlights: do the Y perm, which swaps two corners diagonally across the top and works from any angle. Headlights on every side: the corners are done, so go straight to the edges. Some guides use an A perm instead (a three-corner cycle, for headlights on one side: Aa with the headlights on the left, Ab with them at the back) plus the E perm (no headlights, corners swapped in two pairs), which works from any angle. That is also two algorithms, but the E perm is harder to spot and to turn quickly than the Y, which is why most guides start with T and Y. Spotting headlights is the most useful recognition skill in the last layer: full PLL is read the same way, just with more cases.",
      },
      {
        title: "Edge permutation",
        body: "U-perms, H, and Z cover edge permutation after corners are done.",
      },
      {
        title: "AUF habit",
        body: "Finish with an intentional U adjustment. Guessing AUF mid-alg creates lockups.",
      },
    ],
    practiceHint: "Start PLL training once you can set up cases reliably.",
  },
  {
    id: "advanced-first-pair",
    pathId: "advanced",
    title: "Track your first pair",
    summary: "Inspection should leave you knowing the first F2L pair.",
    minutes: 10,
    steps: [
      {
        title: "During inspection",
        body: "After the cross plan, find the corner+edge you will solve first. That removes the post-cross pause.",
      },
      {
        title: "Measure the transition",
        body: "Cross + first pair diagnostics show whether the leak is cross execution or the transition.",
      },
    ],
    practiceHint: "Complete a Cross + first pair set and check Coach for the updated weakness.",
  },
  {
    id: "advanced-rotations",
    pathId: "advanced",
    title: "Reduce F2L rotations",
    summary: "Y rotations are expensive — empty slots and U moves scale better.",
    minutes: 8,
    steps: [
      {
        title: "Count your rotations",
        body: "Film a few solves or consciously count y/y′. Aim for one or two in the whole F2L, never a y2, and don't rotate while you are tracking a piece. Rotations matter more once you are near sub-20; before that, lookahead comes first.",
      },
      {
        title: "Slot choice",
        body: "Solving into back slots without rotating keeps front pairs visible for lookahead.",
      },
    ],
  },
  {
    id: "advanced-lookahead",
    pathId: "advanced",
    title: "Develop lookahead",
    summary: "See the next pair before the current insert finishes.",
    minutes: 10,
    steps: [
      {
        title: "Lower TPS on purpose",
        body: "Lookahead is a seeing skill. Slower F2L turning forces your eyes ahead of your hands.",
      },
      {
        title: "Track one piece early",
        body: "During an insert, keep peripheral attention on one unsolved corner or edge.",
      },
    ],
    practiceHint: "Eight F2L training solves focusing only on never pausing between pairs.",
  },
  {
    id: "advanced-last-layer",
    pathId: "advanced",
    title: "Explore advanced last-layer systems",
    summary:
      "After full OLL and PLL: predict the PLL, control edges, and use COLL or ZBLL only where they fit.",
    minutes: 10,
    steps: [
      {
        title: "Earn full OLL/PLL",
        body: "Full PLL first: start it in the Sub-45 course if you like and finish it in Sub-30. Full OLL follows around sub-20, optional there and expected by Sub-15, learned in groups starting from the 2-look cases. Take a couple of new cases a day; clean recognition matters more than how many you know.",
      },
      {
        title: "Predict the PLL",
        body: "With both sets solid, the next gain is the join between them. Watch the sides as OLL finishes: a bar, block or headlights narrows down which PLL is coming, and a bar on one side leaves only five (F, Ja, Jb, Ua and Ub). The more of the case you know before the top stops moving, the sooner you can pick the turn before PLL (the pre-AUF) instead of turning it to look.",
      },
      {
        title: "Edge control, then a few WV cases",
        body: "When two inserts would both solve the last pair, pick the one that leaves more of the yellow edges up. Dodging a dot OLL, one of the longest groups, is most of the gain. Then add a few short Winter Variation (WV) cases: when the yellow edges already face up and the last pair is built and waiting above its slot, a WV algorithm inserts the pair and brings the corners up in one go, so PLL is next.",
      },
      {
        title: "COLL and ZBLL only where they apply",
        body: "COLL and ZBLL start from a last layer whose edges already face up after F2L, which happens on about 1 solve in 8 without edge control. On the other solves they can't be used, so keep them as optional extras for the fast end, after F2L is smooth. Coach will keep pointing at F2L while that is still the leak.",
      },
    ],
  },
];

export function lessonsForPath(pathId: Lesson["pathId"]): Lesson[] {
  return lessons.filter((l) => l.pathId === pathId);
}

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}
