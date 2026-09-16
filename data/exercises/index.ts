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
    instructions: ["Inspect the scrambled cube.", "Start timing, solve only the cross, and stop."],
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
    instructions: [
      "Plan your cross and look for the first pair.",
      "Solve the cross and one F2L pair, then stop.",
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
    instructions: [
      "The scramble starts with a solved cross.",
      "Start the timer and finish all four F2L pairs, then stop before OLL.",
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
    instructions: [
      "The scramble starts from an OLL-ready state.",
      "Start, solve OLL, and stop before PLL.",
    ],
    skillsMeasured: ["oll_recognition", "oll_execution"],
    skillsTrained: ["oll_execution"],
    recommendedSampleCount: 10,
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
    instructions: [
      "The scramble starts from a PLL-ready last layer.",
      "Start, execute PLL (and AUF), then stop.",
    ],
    skillsMeasured: ["pll_recognition", "pll_execution"],
    skillsTrained: ["pll_execution"],
    recommendedSampleCount: 10,
    applicableMilestones: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12", "sub10"],
    measurementType: "time",
    scrambleEvent: "333pll",
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
    instructions: [
      "The scramble starts from an OLL-ready last layer.",
      "Start, solve OLL then PLL (and AUF), and stop when the cube is solved.",
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

export function topicForExercise(exerciseId: string): PracticeTopic | undefined {
  return PRACTICE_TOPICS.find(
    (topic) => topic.diagnosticId === exerciseId || topic.trainingId === exerciseId,
  );
}

export function practiceHref(exerciseId: string, mode: PracticeMode): string {
  return mode === "training" ? `/train/${exerciseId}/` : `/coach/diagnostic/${exerciseId}/`;
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
