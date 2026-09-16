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
  practiceHint?: string;
}

export const lessons: Lesson[] = [
  {
    id: "beginner-know-cube",
    pathId: "beginner",
    title: "Know your cube",
    summary: "Centers, edges, corners, and what never moves.",
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
        title: "Hold the cube consistently",
        body: "Pick a white-on-top / green-in-front habit early. Consistency makes algorithms and inspection easier later.",
      },
    ],
    practiceHint: "Scramble lightly and name five pieces out loud before solving.",
  },
  {
    id: "beginner-notation",
    pathId: "beginner",
    title: "Read cube notation",
    summary: "R, U, F and primes — the language of every scramble.",
    minutes: 8,
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
    ],
    practiceHint: "Execute R U R′ U′ slowly three times and watch the cycle.",
  },
  {
    id: "beginner-first-layer",
    pathId: "beginner",
    title: "Build your first layer",
    summary: "White cross, then white corners — a repeatable beginner path.",
    minutes: 12,
    steps: [
      {
        title: "White cross on bottom or top",
        body: "Match each white edge to its center color before placing it. Daisy → cross is fine while learning.",
      },
      {
        title: "Insert white corners",
        body: "Bring a white corner above its slot and use R′ D′ R D (or the mirror) until it sits correctly. Do not break the cross permanently.",
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
    summary: "Second layer, yellow cross, and corner orientation without speed.",
    minutes: 15,
    steps: [
      {
        title: "Second-layer edges",
        body: "Use the beginner F2L-edge insert (U R U′ R′ U′ F′ U F / mirror). Keep white on bottom.",
      },
      {
        title: "Yellow cross",
        body: "From a yellow dot or line/L-shape, use F R U R′ U′ F′ until you have a yellow cross.",
      },
      {
        title: "Finish the last layer",
        body: "Orient corners (R U R′ U R U2 R′), then permute corners and edges with the beginner algorithms you trust. Accuracy first.",
      },
    ],
    practiceHint: "Aim for a clean solve under five minutes before caring about averages.",
  },
  {
    id: "cfop-cross",
    pathId: "cfop",
    title: "Plan your cross",
    summary: "Use inspection to finish the cross in eight moves or fewer.",
    minutes: 10,
    steps: [
      {
        title: "Inspection goal",
        body: "In 15 seconds, plan the full cross — preferably white or yellow on bottom — and track at least the first F2L pair.",
      },
      {
        title: "Efficient crosses",
        body: "Most good crosses are ≤8 moves. If you often need 10+, pause after inspection and rewrite the plan before starting.",
      },
      {
        title: "X-cross when ready",
        body: "Once standard crosses are automatic, look for a free first pair during inspection (x-cross).",
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
        body: "Every F2L case is: bring the corner and edge together into a pair, then insert into the slot. Learn the motion, not thirty names.",
      },
      {
        title: "Avoid unnecessary rotations",
        body: "Cube rotations hide lookahead. Prefer U moves and empty slots facing you when you can.",
      },
      {
        title: "Slow is smooth",
        body: "Turning slower while tracking the next pair beats frantic turning that forces pauses.",
      },
    ],
    practiceHint: "Start F2L training on Train — turn a bit slower and look for the next pair.",
  },
  {
    id: "cfop-2look-oll",
    pathId: "cfop",
    title: "Learn 2-look OLL",
    summary: "Edge orientation, then a small set of corner algorithms.",
    minutes: 14,
    steps: [
      {
        title: "Edges first",
        body: "Make a yellow cross with the same beginner-friendly algs, then learn to recognize dot / line / L / cross quickly.",
      },
      {
        title: "Seven corner cases",
        body: "2-look OLL finishes with a short list of corner-orientation algorithms. Drill recognition before speed.",
      },
      {
        title: "Toward full OLL",
        body: "When 2-look is automatic, add high-frequency full OLL cases one at a time.",
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
        body: "Recognize headlights / no headlights and apply the corner PLL you know (e.g. A-perms / E / beginner corner cycle).",
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
        body: "Film a few solves or consciously count y/y′. More than one per F2L pair is usually avoidable.",
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
    summary: "Full OLL/PLL, then COLL / ZBLL only when the rest is ready.",
    minutes: 8,
    steps: [
      {
        title: "Earn full OLL/PLL",
        body: "Add cases by frequency. Recognition quality matters more than alg count.",
      },
      {
        title: "COLL and beyond",
        body: "Advanced sets help only when F2L is already smooth. Coach will keep pointing at F2L if that is still the leak.",
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
