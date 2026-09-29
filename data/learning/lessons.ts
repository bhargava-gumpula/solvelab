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
    summary: "Centres, edges, corners, what never moves, and how to hold the cube.",
    minutes: 5,
    steps: [
      {
        title: "Centre pieces define the colours",
        body: "Turning a face spins its centre but never moves it, so each centre shows the colour its whole face will be when solved. Each face centre stays opposite the same centre forever. White opposite yellow, red opposite orange, blue opposite green on a standard Western colour scheme.",
      },
      {
        title: "Edges and corners",
        body: "Edges have two colours; corners have three. You never swap a corner with an edge — every move preserves piece type.",
      },
      {
        title: "Hold the cube the solving way",
        body: `Apply every scramble with ${SCRAMBLE_HOLD}. Then turn the whole cube over sideways, as if turning the front face twice (written ${SOLVING_ROTATION}), so green stays in front. Solve with the ${SOLVING_HOLD}. White stays on the bottom and yellow on top for the whole solve (turning the cube around with white still down is fine) — every algorithm here assumes it.`,
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
        body: "R = right, L = left, U = up, D = down, F = front, B = back. A letter alone means a quarter turn clockwise, judged as if you were looking straight at that face. So R and L turn opposite ways as you see them from the front, and U and D turn opposite ways as seen from above.",
      },
      {
        title: "Primes and doubles",
        body: "R′ (or R') is anticlockwise. R2 is a half turn. Scrambles are just sequences of these moves.",
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
    practiceHint:
      "Do R U R′ U′ slowly six times: the cube comes back to where it started, which shows you are reading the moves right.",
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
        body: "Hold white on the bottom and yellow on top (z2 after the scramble) and build the cross there, matching each white edge's other colour to its centre. For your first solves, build a daisy first: the four white edges round the yellow centre on top, white side up. Before you turn a side, turn the top so the edge above that side isn't one you have already placed. A white edge in the middle layer: turn the side showing its other colour, the way that lifts it to the top, and white ends up facing up. On the bottom with white facing down: turn that side twice. White facing sideways anywhere else: turn that side once to move the edge into the middle layer, then lift it the same way. With all four in, turn the top until an edge's side colour sits above its matching centre, then turn that face twice to bring it down, and repeat for the other three. From then on, white stays on the bottom and yellow on top.",
      },
      {
        title: "Insert white corners",
        body: "A corner belongs in the slot between the two side centres that match its other two colours. Turn the top until a white corner sits directly above that slot (turn the whole cube, white still down, to bring the slot to the front). For the front-right slot, repeat R U R′ U′ until the corner drops in white side down: once if white points to the side, three times if it points up, five times if it points at you. For the front-left slot, use L′ U′ L U the same way. Each repeat leaves the cross as it was. R U R′ U′ is the most common short sequence in cubing, so it is worth getting smooth.",
      },
      {
        title: "Check the layer",
        body: "When the white face is solved and each side's bottom row matches its centre, move on. If a white corner is in the wrong slot or twisted, turn the cube (white still down) so it is at the front right and do R U R′ U′ once: it comes up to the top, and you place it as usual.",
      },
    ],
    examples: [
      {
        label: "Corner with white facing right",
        moves: "R U R' U'",
        note: "Above its slot at the front right, white facing to the right: one go.",
      },
      {
        label: "Corner with white facing up",
        moves: "R U R' U' R U R' U' R U R' U'",
        note: "White facing up: three goes of the same four moves.",
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
        body: "Find an edge on top with no yellow on it. Turn the top until its side colour matches the centre below it, then turn the whole cube (white still down) so that centre faces you. If the edge's top colour matches the right centre, do U R U′ R′ U′ F′ U F; if it matches the left centre, do U′ L′ U L U F U′ F′. Either one drops the edge into the middle layer and puts the white corner back. No edge on top without yellow, but a middle edge in the wrong slot or flipped? Hold that slot at the front right and do the right-hand insert once to lift the edge onto the top, then place it as usual.",
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
        body: "Look around the top layer for headlights: a side whose two top corners show the same colour. Headlights on one side: hold them on the left and do the T perm, R U R′ U′ R′ F R2 U′ R′ U′ R U R′ F′. No headlights: do the Y perm, F R U′ R′ U′ R U R′ F′ R U R′ U′ R′ F R F′, holding the cube any way. Either way you finish with headlights on all four sides, which means the corners are done. Turn the top until each corner matches the centres beside it.",
      },
      {
        title: "Edges into place",
        body: "Look for a finished side, where the whole top row matches the centre. Hold it at the back and look at the front edge. If its colour matches the right centre, do the Ua perm, R U′ R U R U R U′ R′ U′ R2; if it matches the left centre, do the Ub perm, R2 U R U R′ U′ R′ U′ R′ U R′. Mixed them up? The finished side stays at the back, so do the same one again. No finished side yet: do either one holding the cube any way, and you will have one. When every side matches, the cube is solved. Accuracy first.",
      },
    ],
    examples: [
      {
        label: "Middle edge, right-hand insert",
        moves: "U R U' R' U' F' U F",
        note: "The edge's side colour matches the front centre and its top colour the right one.",
      },
      {
        label: "Middle edge, left-hand insert",
        moves: "U' L' U L U F U' F'",
        note: "The same, with its top colour matching the left centre.",
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
      {
        label: "Edges into place: Ub perm",
        moves: "R2 U R U R' U' R' U' R' U R'",
        caseId: "pll-ub",
        note: "The finished side at the back; the front edge belongs on the left.",
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
        body: `${HOLD_RULE} Do the ${SOLVING_ROTATION} as inspection starts, then use the 15 seconds to find all four white edges and plan as much of the cross on the bottom as you can before your first turn: at least the first two edges. Planning the whole cross is the goal of the Sub-30 course, so don't worry yet if the last edges are still a search. Never solve the cross on top. Colour neutrality is an optional extra with its own unit in this course, not part of this lesson.`,
      },
      {
        title: "Efficient crosses",
        body: "Every cross can be solved in 8 moves or fewer. If yours often take 10+, practise the cross on its own, untimed: find a solution, look for a shorter one, then redo the same scramble with 15 seconds of inspection and see how much more of it you can plan before turning.",
      },
    ],
    practiceHint:
      "Scramble, do the z2 and give yourself fifteen seconds: find all four white edges and plan the first two, then solve those two without stopping. Do it five times.",
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
        body: "Intuitive F2L sounds like dozens of cases, but most of them come down to three ideas. If the corner or edge you need is stuck in a slot where it doesn't belong, take it out, usually with the same three-move trigger you insert with. Turn the top layer to bring the corner and edge together into a pair. Then drop the pair into its slot. The easiest case is a joined pair waiting in the top layer one turn from its slot: with the corner at the front left and its edge beside it at the front, R U' R' drops it in with three moves. Learn to spot pairs like that, then learn to make them by moving one piece out of the way, turning the top so the other lines up, and bringing the first back. Not every case fits that pattern exactly: some join as they go in, like the three-move case below, and in the Sub-30 course keyhole drops a single piece in through an empty slot without pairing it first. There are forty-one cases in all. Learn them by these moves, not by name.",
      },
      {
        title: "Front slots first",
        body: "Insert into the two front slots to begin with, turning the cube to bring a back slot round if you have to. Rotations hide the pieces you would otherwise see coming, so avoid a y2 and prefer a top turn when one will do; cutting them down properly comes later. Right now the point is understanding what the moves do to the pair. At the front left, use your left hand rather than turning the cube: L′ U′ L and L′ U L are the mirrors of R U R′ and R U′ R′.",
      },
      {
        title: "Slow is smooth",
        body: "Turning slower so you can look for the next pair while this one goes in beats frantic turning that forces pauses.",
      },
    ],
    examples: [
      {
        label: "A joined pair",
        moves: "R U' R'",
        caseId: "f2l-3",
        note: "Corner at the front left, its edge beside it at the front. R lifts the slot, U' swings the pair over it, R' drops it in.",
      },
      {
        label: "The three-move case",
        moves: "R U R'",
        caseId: "f2l-1",
        note: "The pair isn't joined yet, but one R U R' joins it and drops it in at once. Most F2L solutions are built from three-move pieces like these two.",
      },
    ],
    practiceHint:
      "Solve the cross, then put in the four pairs slowly, saying for each one: take out, pair, insert.",
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
        body: "Orienting the last layer takes two looks. In the first, look only at the four edges on top and whether their yellow faces up. Ignore the corners, and ignore where anything belongs: that is PLL's job. You will see a dot (none up), an L (two next to each other), a line (two opposite) or the cross already made. That is three algorithms, and the dot is just the line and the L done one after the other. Hold the line left to right and do F R U R′ U′ F′. Hold the L at the front right (its two edges at the front and on the right) and do f R U R′ U′ f′. For the dot, do the line algorithm holding the cube any way: it leaves an L at the front right, ready for the L algorithm straight away. Get to where you name the shape the moment you look.",
      },
      {
        title: "Seven corner cases",
        body: "With the yellow cross made, count how many corners show yellow on top. None up means H or Pi: H shows a pair of yellow stickers on two opposite sides, Pi on one side only. One up means Sune or Antisune: put that corner at the front left and look at the front-right corner's side sticker. Yellow facing you is a Sune, ready to go; yellow facing right is an Antisune, whose algorithm starts with the up corner at the back right, so turn the top twice first. Two up means Headlights (U), T (Chameleon) or Bowtie (L): if the two up corners sit side by side, look at the other two. Yellow on the same side is Headlights; yellow pointing opposite ways is T. If the up corners are diagonal, it's the Bowtie. None of them is rare: six of the seven come up equally often and H only half as often, so each is worth learning. Drill recognition before speed.",
      },
      {
        title: "Sune and Antisune first",
        body: "Learn these two before the other five. Each is only seven moves, they mirror each other (each is also the other one run backwards), and both use only R and U turns, the same turns as your right-hand F2L inserts: the Sune opens with R U R′ and the Antisune with R U2 R′. Until you know the rest, the Sune hold rule from your first solve (one corner up: hold it at the front left; none up: the front-left corner's yellow facing left; two up: the front-left corner's yellow facing you) still finishes any of them in at most three Sunes. That is slower than the real algorithm, so replace it one case at a time.",
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
        body: "Look for headlights: two matching corner colours on one side. Headlights on one side: hold them on the left and do the T perm, which swaps the two right-hand corners. No headlights: do the Y perm, which swaps two corners diagonally across the top and works from any angle. Headlights on every side: the corners are done, so go straight to the edges. Some guides use an A perm instead (a three-corner cycle, for headlights on one side: Aa with the headlights on the left, Ab with them at the back) plus the E perm (no headlights, corners swapped in two pairs), which works from any angle. That is also two algorithms, but the E perm is harder to spot and to turn quickly than the Y, which is why most guides start with T and Y. Spotting headlights is the most useful recognition skill in the last layer: full PLL is read the same way, just with more cases.",
      },
      {
        title: "Edge permutation",
        body: "With the corners done, look for a solved bar: a side whose whole top row matches. One bar: hold it at the back and look at the front edge. If it belongs on the right, do the Ua perm; if it belongs on the left, the Ub perm. No bar: the edges swap in pairs, H if each belongs on the opposite side and Z if each belongs on a neighbouring one. The 2-look PLL unit in this course has the details and drills.",
      },
      {
        title: "AUF habit",
        body: "AUF means adjusting the top: a U, U′ or U2 before an algorithm to set the case up, or after it to line the layer up. Recognise the case first, then turn the top once to the angle the algorithm starts from. Don't turn it while you are still looking, and turn the top, not the whole cube. As the algorithm ends, already know which last turn lines the layer up.",
      },
    ],
    practiceHint:
      "Do the T perm on a solved cube, turn the top once, then solve it from there. Do the same with the Y perm.",
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
    summary:
      "A y rotation hides the pieces you are tracking; back-slot inserts and top turns avoid most of them.",
    minutes: 8,
    steps: [
      {
        title: "Count your rotations",
        body: "Film a few solves or consciously count y/y′. Aim for one or two in the whole F2L, never a y2, and don't rotate while you are tracking a piece. Rotations matter more once you are near sub-20; before that, lookahead comes first.",
      },
      {
        title: "Back slots without rotating",
        body: "Solving the back slots without turning the cube keeps the pieces you are tracking in view. The inserts are the front ones mirrored, with each turn reversed. Back right: R′ U R for a pair joined at the back, and R′ U′ R when the corner sits above the slot with its edge at the front. Back left: L U′ L′ and L U L′ in the same way. Where you would rotate and then turn the top, a d or d′ (the bottom two layers turned together) does both in one move: d is a y′ and a U, d′ a y and a U′. It feels slow at first, so practise slowly until solving from the front beats rotating.",
      },
    ],
    examples: [
      {
        label: "Back-right insert",
        moves: "R' U R",
        slot: "BR",
        note: "A pair joined at the back, its corner at the back left: the back-slot mirror of R U' R'.",
      },
      {
        label: "Back-left insert",
        moves: "L U' L'",
        slot: "BL",
        note: "The same on the left: the pair joined at the back, its corner at the back right.",
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
