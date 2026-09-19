import type { CubeEvent, ExerciseDefinition } from "@/types/domain";

/** Definitions only; coach engine scores times against the baseline. */
export const exercises: ExerciseDefinition[] = [
  {
    id: "normal_solves",
    name: "Normal solves",
    type: "diagnostic",
    category: "full_solve",
    description: "Establish a baseline from your everyday solving.",
    instructions: ["Use a fresh 3×3 scramble.", "Solve the entire cube at your normal pace."],
    skillsMeasured: ["consistency"],
    skillsTrained: [],
    recommendedSampleCount: 12,
    applicableMilestones: [],
    measurementType: "time",
    scrambleEvent: "333",
  },
  {
    id: "cross_only",
    name: "Cross",
    type: "diagnostic",
    category: "cross",
    description: "Solve only the cross.",
    testName: "cross",
    whatItShows: "How fast your cross is after normal 15-second inspection.",
    inspection: "wca",
    instructions: [
      "Scramble your cube with the scramble shown.",
      "Press Space to start inspection and plan your cross (up to 15 seconds).",
      "Hold and release Space to start, solve only the cross, then stop the timer.",
    ],
    skillsMeasured: ["cross_planning", "cross_execution"],
    skillsTrained: ["cross_execution"],
    recommendedSampleCount: 10,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333",
  },
  {
    id: "cross_first_pair",
    name: "Cross + first pair",
    type: "diagnostic",
    category: "cross",
    description: "Solve the cross and your first F2L pair.",
    testName: "cross + first pair",
    whatItShows: "How quickly you get from a scramble through the cross into your first pair.",
    inspection: "wca",
    instructions: [
      "Scramble your cube with the scramble shown.",
      "In inspection, plan your cross and look for your first pair.",
      "Solve the cross and one F2L pair, then stop the timer.",
    ],
    skillsMeasured: ["cross_to_f2l", "first_pair_prediction"],
    skillsTrained: ["cross_to_f2l"],
    recommendedSampleCount: 10,
    applicableMilestones: ["sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333",
  },
  {
    id: "f2l_only",
    name: "F2L",
    type: "diagnostic",
    category: "f2l",
    description: "Finish four pairs after a solved cross.",
    testName: "F2L",
    whatItShows: "How fast your F2L is on its own, starting from a solved cross.",
    inspection: "none",
    instructions: [
      "Scramble your cube with the scramble shown. It leaves the cross solved.",
      "Start the timer, solve all four F2L pairs, and stop before OLL.",
    ],
    skillsMeasured: ["f2l_recognition", "f2l_efficiency", "f2l_lookahead"],
    skillsTrained: ["f2l_efficiency"],
    recommendedSampleCount: 10,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333f2l",
  },
  {
    id: "oll_only",
    name: "OLL",
    type: "diagnostic",
    category: "oll",
    description: "Orient the last layer.",
    testName: "OLL",
    whatItShows: "Your OLL speed, and whether some cases take much longer than others.",
    inspection: "none",
    instructions: [
      "Scramble your cube with the scramble shown. It leaves F2L solved.",
      "Start the timer, solve OLL, and stop before PLL.",
    ],
    skillsMeasured: ["oll_recognition", "oll_execution"],
    skillsTrained: ["oll_execution"],
    recommendedSampleCount: 12,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333oll",
  },
  {
    id: "pll_only",
    name: "PLL",
    type: "diagnostic",
    category: "pll",
    description: "Permute the last layer.",
    testName: "PLL",
    whatItShows: "Your PLL speed, and whether some cases take much longer than others.",
    inspection: "none",
    instructions: [
      "Scramble your cube with the scramble shown. It leaves the top face solved.",
      "Start the timer, solve PLL including the final turn (AUF), and stop.",
    ],
    skillsMeasured: ["pll_recognition", "pll_execution"],
    skillsTrained: ["pll_execution"],
    recommendedSampleCount: 12,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333pll",
  },
  {
    id: "cross_unlimited",
    name: "Unlimited-inspection cross",
    type: "diagnostic",
    category: "cross",
    description: "Solve the cross after planning it for as long as you like.",
    testName: "unlimited-inspection cross",
    whatItShows:
      "Your cross when you have all the time you want to plan it. The difference from your normal cross test is the time the 15-second limit costs you.",
    inspection: "none",
    instructions: [
      "Scramble your cube with the scramble shown.",
      "Plan the whole cross before starting the timer, taking as long as you need. Don't start until you know every move.",
      "Start the timer, solve only the cross, then stop.",
    ],
    skillsMeasured: ["cross_planning"],
    skillsTrained: [],
    recommendedSampleCount: 10,
    applicableMilestones: [],
    measurementType: "time",
    scrambleEvent: "333",
  },
  {
    id: "cross_f2l",
    name: "Cross + F2L",
    type: "diagnostic",
    category: "f2l",
    description: "Solve the cross and all of F2L from a normal scramble.",
    testName: "cross + F2L",
    whatItShows:
      "Compared with the cross and F2L tests, how much time you lose between the cross and F2L.",
    inspection: "wca",
    instructions: [
      "Scramble your cube with the scramble shown.",
      "Press Space to start inspection and plan your cross (up to 15 seconds).",
      "Solve the cross and all four F2L pairs, then stop before OLL.",
    ],
    skillsMeasured: ["cross_to_f2l", "first_pair_prediction"],
    skillsTrained: [],
    recommendedSampleCount: 10,
    applicableMilestones: [],
    measurementType: "time",
    scrambleEvent: "333",
  },
  {
    id: "last_slot",
    name: "Single pair",
    type: "diagnostic",
    category: "f2l",
    description: "Solve one F2L pair on its own.",
    testName: "single pair",
    whatItShows: "How fast you find and insert one F2L pair on its own.",
    inspection: "none",
    instructions: [
      "Scramble your cube with the scramble shown. It leaves the cross and three pairs solved.",
      "Start the timer, solve the last F2L pair, and stop.",
    ],
    skillsMeasured: ["f2l_recognition", "f2l_efficiency"],
    skillsTrained: [],
    recommendedSampleCount: 12,
    applicableMilestones: [],
    measurementType: "time",
    scrambleEvent: "333ls",
  },
  {
    id: "slow_turning_f2l",
    name: "Slow-turning F2L",
    type: "diagnostic",
    category: "f2l",
    description: "Solve F2L turning slowly without ever stopping.",
    testName: "slow F2L",
    whatItShows:
      "If steady slow turning is barely slower than your normal F2L, pauses are what cost you time.",
    inspection: "none",
    instructions: [
      "Scramble your cube with the scramble shown. It leaves the cross solved.",
      "Solve all four pairs turning slowly and steadily. Try never to stop turning.",
      "Stop the timer when F2L is done.",
    ],
    skillsMeasured: ["f2l_lookahead"],
    skillsTrained: [],
    recommendedSampleCount: 5,
    applicableMilestones: [],
    measurementType: "time",
    scrambleEvent: "333f2l",
  },
  {
    id: "ls_oll",
    name: "Last pair + OLL",
    type: "diagnostic",
    category: "oll",
    description: "Solve the last F2L pair and then OLL.",
    testName: "last pair + OLL",
    whatItShows:
      "Compared with the single pair and OLL tests, how much time you lose between F2L and OLL.",
    inspection: "none",
    instructions: [
      "Scramble your cube with the scramble shown. It leaves the cross and three pairs solved.",
      "Start the timer, solve the last pair and then OLL, and stop before PLL.",
    ],
    skillsMeasured: ["oll_recognition"],
    skillsTrained: [],
    recommendedSampleCount: 10,
    applicableMilestones: [],
    measurementType: "time",
    scrambleEvent: "333ls",
  },
  {
    id: "tps_test",
    name: "Turning speed",
    type: "diagnostic",
    category: "technique",
    description: "Turn a short algorithm as fast as you can.",
    testName: "turning speed",
    whatItShows: "How fast your hands turn, in turns per second.",
    inspection: "none",
    algorithm: { moves: "R U R' U'", repetitions: 6 },
    instructions: [
      "Hold your cube in any state. It ends where it started.",
      "Start the timer, turn R U R' U' six times as fast as you cleanly can, then stop.",
    ],
    skillsMeasured: ["turning"],
    skillsTrained: [],
    recommendedSampleCount: 5,
    applicableMilestones: [],
    measurementType: "execution",
  },
  {
    id: "cross_pair_drills",
    name: "Cross + first pair",
    type: "training",
    category: "cross",
    description: "Practice the cross plus your first F2L pair.",
    instructions: [
      "In inspection, plan the cross and locate one pair.",
      "Solve the cross and that pair, then stop.",
    ],
    skillsMeasured: [],
    skillsTrained: ["cross_to_f2l", "first_pair_prediction"],
    recommendedSampleCount: 12,
    applicableMilestones: ["sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333",
  },
  {
    id: "slow_f2l",
    name: "F2L",
    type: "training",
    category: "f2l",
    description: "Practice four pairs after a solved cross.",
    instructions: [
      "Turn at a comfortable, deliberately slower pace.",
      "Look for the next pair as you finish the current one.",
    ],
    skillsMeasured: [],
    skillsTrained: ["f2l_lookahead"],
    recommendedSampleCount: 8,
    applicableMilestones: ["sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "mixed",
    scrambleEvent: "333f2l",
  },
  {
    id: "cross_drills",
    name: "Cross",
    type: "training",
    category: "cross",
    description: "Practice solving only the cross.",
    instructions: [
      "Use full inspection to plan the entire cross.",
      "Execute without pauses; stop when the cross is done.",
    ],
    skillsMeasured: [],
    skillsTrained: ["cross_planning", "cross_execution"],
    recommendedSampleCount: 12,
    applicableMilestones: ["sub60", "sub45", "sub30", "sub25", "sub20"],
    measurementType: "time",
    scrambleEvent: "333",
  },
  {
    id: "oll_drills",
    name: "OLL",
    type: "training",
    category: "oll",
    description: "Practice orienting the last layer.",
    instructions: [
      "The scramble starts from an OLL-ready state.",
      "Recognize quickly, execute cleanly, stop before PLL.",
    ],
    skillsMeasured: [],
    skillsTrained: ["oll_recognition", "oll_execution"],
    recommendedSampleCount: 12,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "execution",
    scrambleEvent: "333oll",
  },
  {
    id: "pll_execution_drills",
    name: "PLL",
    type: "training",
    category: "pll",
    description: "Practice permuting the last layer.",
    instructions: [
      "The scramble starts from a PLL-ready last layer.",
      "Start, execute the algorithm cleanly, and stop after AUF.",
    ],
    skillsMeasured: [],
    skillsTrained: ["pll_execution", "pll_recognition"],
    recommendedSampleCount: 10,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "execution",
    scrambleEvent: "333pll",
  },
  {
    id: "oll_pll_only",
    name: "OLL + PLL",
    type: "diagnostic",
    category: "oll",
    description: "Finish the last layer from an OLL-ready scramble.",
    testName: "OLL + PLL",
    whatItShows: "Compared with the OLL and PLL tests, how much time you lose between OLL and PLL.",
    inspection: "none",
    instructions: [
      "Scramble your cube with the scramble shown. It leaves F2L solved.",
      "Start the timer, solve OLL and then PLL, and stop when the cube is solved.",
    ],
    skillsMeasured: ["oll_recognition", "oll_execution", "pll_recognition", "pll_execution"],
    skillsTrained: ["oll_execution", "pll_execution"],
    recommendedSampleCount: 10,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333oll",
  },
  {
    id: "oll_pll_drills",
    name: "OLL + PLL",
    type: "training",
    category: "oll",
    description: "Practice OLL into PLL as one last-layer solve.",
    instructions: [
      "The scramble starts from an OLL-ready last layer.",
      "Recognize OLL, execute, go straight into PLL, and stop after AUF.",
    ],
    skillsMeasured: [],
    skillsTrained: ["oll_recognition", "oll_execution", "pll_recognition", "pll_execution"],
    recommendedSampleCount: 12,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333oll",
  },
];

export type PracticeMode = "diagnostic" | "training";

export interface PracticeTopic {
  id: string;
  label: string;
  description: string;
  diagnosticId: string;
  trainingId: string;
}

/** One card per stage on Train — diagnostic and training share the same box. */
export const PRACTICE_TOPICS: PracticeTopic[] = [
  {
    id: "cross",
    label: "Cross",
    description: "Solve only the cross.",
    diagnosticId: "cross_only",
    trainingId: "cross_drills",
  },
  {
    id: "cross_first_pair",
    label: "Cross + first pair",
    description: "Cross plus your first F2L pair.",
    diagnosticId: "cross_first_pair",
    trainingId: "cross_pair_drills",
  },
  {
    id: "f2l",
    label: "F2L",
    description: "Four pairs after a solved cross.",
    diagnosticId: "f2l_only",
    trainingId: "slow_f2l",
  },
  {
    id: "oll",
    label: "OLL",
    description: "Orient the last layer.",
    diagnosticId: "oll_only",
    trainingId: "oll_drills",
  },
  {
    id: "pll",
    label: "PLL",
    description: "Permute the last layer.",
    diagnosticId: "pll_only",
    trainingId: "pll_execution_drills",
  },
  {
    id: "oll_pll",
    label: "OLL + PLL",
    description: "Last layer from OLL through PLL.",
    diagnosticId: "oll_pll_only",
    trainingId: "oll_pll_drills",
  },
];

export function getExercise(id: string): ExerciseDefinition | undefined {
  return exercises.find((e) => e.id === id);
}

export function exerciseScrambleEvent(exerciseId: string): CubeEvent {
  return getExercise(exerciseId)?.scrambleEvent ?? "333";
}

/** Tests the solve profile needs, in the order they are suggested. */
export const CORE_TESTS = [
  "cross_only",
  "f2l_only",
  "oll_only",
  "pll_only",
  "cross_f2l",
  "last_slot",
  "ls_oll",
  "oll_pll_only",
  "cross_unlimited",
  "tps_test",
] as const;

/** Tests that add detail but aren't needed to finish the profile. */
export const EXTRA_TESTS = ["slow_turning_f2l", "cross_first_pair"] as const;

/** Every test a person can take. */
export const TEST_ORDER = [...CORE_TESTS, ...EXTRA_TESTS] as const;

export type TestId = (typeof TEST_ORDER)[number];

export function isCoreTest(id: string): boolean {
  return (CORE_TESTS as readonly string[]).includes(id);
}

export function isTestId(id: string): id is TestId {
  return (TEST_ORDER as readonly string[]).includes(id);
}

/** "Start cross + F2L test" and friends. */
export function testButtonLabel(testId: string, verb = "Start"): string {
  const exercise = getExercise(testId);
  return `${verb} ${exercise?.testName ?? exercise?.name ?? "this"} test`;
}

/** Where a test is taken. */
export function testHref(testId: string): string {
  return `/coach/tests/${testId}/`;
}

/** Page title: "Cross + F2L test". */
export function testTitle(testId: string): string {
  const name = getExercise(testId)?.name ?? "Practice";
  return `${name} test`;
}

export function topicForExercise(exerciseId: string): PracticeTopic | undefined {
  return PRACTICE_TOPICS.find(
    (topic) => topic.diagnosticId === exerciseId || topic.trainingId === exerciseId,
  );
}

export function practiceHref(exerciseId: string, mode: PracticeMode): string {
  return mode === "training" ? `/train/${exerciseId}/` : testHref(exerciseId);
}

/** Focused diagnostics (not everyday timer solves). */
export function isSandboxDiagnostic(exerciseId: string): boolean {
  const exercise = getExercise(exerciseId);
  return !!exercise && exercise.type === "diagnostic" && exercise.id !== "normal_solves";
}

export function isPracticeExercise(exerciseId: string): boolean {
  const exercise = getExercise(exerciseId);
  return !!exercise && exercise.id !== "normal_solves" && exercise.type !== "algorithm";
}
