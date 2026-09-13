import type { AlgorithmSetDefinition } from "@/types/domain";
// Catalog metadata stays small. Case datasets will be lazy imports in V1.5+.
export const algorithmSets: AlgorithmSetDefinition[] = [
  { id: "fundamentals", name: "Fundamentals", description: "Triggers and the building blocks of smooth turning.", difficulty: "beginner", category: "fundamentals", phase: "V1.5" },
  { id: "two-look-oll", name: "2-look OLL", description: "Orient the last layer in two manageable steps.", difficulty: "beginner", category: "oll", phase: "V1.5" },
  { id: "two-look-pll", name: "2-look PLL", description: "Place the last-layer pieces with a compact set.", difficulty: "beginner", category: "pll", phase: "V1.5" },
  { id: "pll", name: "Full PLL", description: "Recognize and permute the last layer in one step.", difficulty: "intermediate", category: "pll", phase: "V1.5" },
  { id: "oll", name: "Full OLL", description: "Build confident recognition across last-layer orientations.", difficulty: "intermediate", category: "oll", phase: "V1.5" },
  { id: "f2l", name: "F2L", description: "Explore efficient solutions for your first two layers.", difficulty: "intermediate", category: "f2l", phase: "V1.75" },
  { id: "coll", name: "COLL", description: "Solve last-layer corners while preserving edge orientation.", difficulty: "advanced", category: "advanced", phase: "V1.75" },
  { id: "winter-variation", name: "Winter Variation", description: "Orient last-layer corners as you insert the final pair.", difficulty: "advanced", category: "advanced", phase: "V1.75" },
  { id: "zbll", name: "ZBLL", description: "A deeper last-layer system, organized into focused subsets.", difficulty: "expert", category: "advanced", phase: "V1.75" },
];
