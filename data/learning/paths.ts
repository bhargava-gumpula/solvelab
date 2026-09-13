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
    description: "Connect cross, F2L, and the last layer into a smoother solve.",
    topics: ["Plan your cross", "Understand intuitive F2L", "Learn 2-look OLL", "Learn 2-look PLL"],
  },
  {
    id: "advanced",
    name: "Refine the details",
    level: "Advanced",
    description: "Work on transitions, lookahead, and efficient execution.",
    topics: [
      "Track your first pair",
      "Reduce F2L rotations",
      "Develop lookahead",
      "Explore advanced last-layer systems",
    ],
  },
] as const;
