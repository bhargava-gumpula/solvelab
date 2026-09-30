import type { AlgorithmSetDefinition } from "@/types/domain";
// Catalog metadata stays small. Case datasets will be lazy imports in V1.5+.
// In learning order: the 2-look sets, F2L as a reference for intuitive F2L,
// full PLL before full OLL, then the optional sets.
export const algorithmSets: AlgorithmSetDefinition[] = [
  {
    id: "fundamentals",
    name: "Fundamentals",
    description:
      "The short chunks every algorithm is made of: what each one does, how the hands do it, and how many in a row bring the cube back to solved.",
    difficulty: "beginner",
    category: "fundamentals",
    phase: "V1.5",
  },
  {
    id: "two-look-oll",
    name: "2-look OLL",
    description: "Orient the last layer in two manageable steps.",
    difficulty: "beginner",
    category: "oll",
    phase: "V1.5",
  },
  {
    id: "two-look-pll",
    name: "2-look PLL",
    description: "Place the last-layer pieces with a compact set.",
    difficulty: "beginner",
    category: "pll",
    phase: "V1.5",
  },
  {
    id: "f2l",
    name: "F2L",
    description:
      "A reference for after intuitive F2L. The same cases come up for every pair and every slot; each is shown at the front-right slot, led by the algorithm most solvers use. At the front-left, mirror it; for a back slot, turn the cube to bring the slot to the front, or learn a back-slot version later. SolveLab numbers the cases its own way, so each also shows its SpeedCubeDB number.",
    difficulty: "intermediate",
    category: "f2l",
    phase: "V1.75",
  },
  {
    id: "pll",
    name: "Full PLL",
    description: "Recognise and permute the last layer in one step.",
    difficulty: "intermediate",
    category: "pll",
    phase: "V1.5",
  },
  {
    id: "oll",
    name: "Full OLL",
    description: "Build confident recognition across last-layer orientations.",
    difficulty: "intermediate",
    category: "oll",
    phase: "V1.5",
  },
  {
    id: "coll",
    name: "COLL",
    description: "Solve last-layer corners while preserving edge orientation.",
    difficulty: "advanced",
    category: "advanced",
    phase: "V1.75",
  },
  {
    id: "winter-variation",
    name: "Winter Variation",
    description: "Orient last-layer corners as you insert the final pair.",
    difficulty: "advanced",
    category: "advanced",
    phase: "V1.75",
  },
  {
    id: "zbll",
    name: "ZBLL",
    description: "A deeper last-layer system, organised into focused subsets.",
    difficulty: "expert",
    category: "advanced",
    phase: "V1.75",
  },
];
