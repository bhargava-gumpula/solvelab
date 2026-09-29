export const learningPaths = [
  {
    id: "beginner",
    name: "Your first solve",
    level: "Beginner",
    description: "Start with the pieces, notation, and a repeatable method.",
    topics: [
      "Know your cube",
      "Read cube notation",
      "Build your first layer",
      "Complete your first solve",
    ],
  },
  {
    id: "cfop",
    name: "Build your CFOP foundation",
    level: "Intermediate",
    description:
      "The Sub-60 switch to CFOP: cross on the bottom, intuitive F2L, then 2-look OLL and 2-look PLL.",
    topics: ["Plan your cross", "Understand intuitive F2L", "Learn 2-look OLL", "Learn 2-look PLL"],
  },
  {
    id: "advanced",
    name: "Refine the details",
    level: "Advanced",
    description:
      "Reference notes to read alongside the courses, not the next step: first pair, rotations, lookahead and last-layer extras.",
    topics: [
      "Track your first pair",
      "Reduce F2L rotations",
      "Develop lookahead",
      "Explore advanced last-layer systems",
    ],
  },
] as const;
