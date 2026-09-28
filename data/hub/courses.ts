/**
 * The Learning Hub's courses. Each is named for the time it gets you under
 * and is taken by the people chasing it: someone averaging 50 seconds does
 * Sub-45. The steps are closer together at the fast end, where there is more
 * to learn per second.
 *
 * A course holds no content of its own. Its units are the training packs and
 * method lessons the level ladder already names for its rungs, so nothing is
 * written twice and every pack lives in at least one course.
 */

export interface CourseDefinition {
  id: string;
  title: string;
  /** The milestone the course gets you under; its threshold is the target time. */
  targetId: string;
  /** Where the people taking it stand: rungs of the level ladder. */
  rungs: readonly string[];
  /** One line for the course card. */
  tagline: string;
  /** Method lesson paths taught in this course, from `data/learning/paths.ts`. */
  methodPaths?: readonly ("beginner" | "cfop" | "advanced")[];
  /** A colour for the course's badge, as a CSS hue. */
  hue: number;
}

export const COURSES: readonly CourseDefinition[] = [
  {
    id: "learn-to-solve",
    title: "Learn to solve",
    targetId: "sub120",
    rungs: ["beginner"],
    tagline: "From your first solve to finishing it every time.",
    methodPaths: ["beginner"],
    hue: 200,
  },
  {
    id: "sub-60",
    title: "Sub-60",
    targetId: "sub60",
    rungs: ["sub120"],
    tagline: "Stop thinking between steps and start CFOP.",
    methodPaths: ["cfop"],
    hue: 170,
  },
  {
    id: "sub-45",
    title: "Sub-45",
    targetId: "sub45",
    rungs: ["sub60"],
    tagline: "Real F2L and the four-look last layer.",
    hue: 140,
  },
  {
    id: "sub-30",
    title: "Sub-30",
    targetId: "sub30",
    rungs: ["sub45"],
    tagline: "Fewer moves, fewer pauses, full PLL.",
    methodPaths: ["advanced"],
    hue: 95,
  },
  {
    id: "sub-20",
    title: "Sub-20",
    targetId: "sub20",
    rungs: ["sub30", "sub25"],
    tagline: "Lookahead, clean last layers, a time budget.",
    hue: 45,
  },
  {
    id: "sub-15",
    title: "Sub-15",
    targetId: "sub15",
    rungs: ["sub20"],
    tagline: "Where most people get stuck, and how to get out.",
    hue: 25,
  },
  {
    id: "sub-12",
    title: "Sub-12",
    targetId: "sub12",
    rungs: ["sub15"],
    tagline: "Planning further, turning less, never stopping.",
    hue: 330,
  },
  {
    id: "sub-10",
    title: "Sub-10",
    targetId: "sub10",
    rungs: ["sub12", "sub10"],
    tagline: "The details that separate the fastest solvers.",
    hue: 280,
  },
];

export function getCourse(id: string): CourseDefinition | undefined {
  return COURSES.find((course) => course.id === id);
}

/** The course for someone standing on this rung of the ladder. */
export function courseForRung(rungId: string | null | undefined): CourseDefinition | null {
  return COURSES.find((course) => rungId && course.rungs.includes(rungId)) ?? null;
}

/** The course after this one, if there is one. */
export function nextCourse(course: CourseDefinition): CourseDefinition | null {
  const index = COURSES.findIndex((item) => item.id === course.id);
  return COURSES[index + 1] ?? null;
}
