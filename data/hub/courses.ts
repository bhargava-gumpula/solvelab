/**
 * The Learning Hub's courses. Each is named for the time it gets you under
 * and is taken by the people chasing it: someone averaging 50 seconds does
 * Sub-45. The steps are closer together at the fast end, where there is more
 * to learn per second.
 *
 * A course holds no content of its own: it lists, in teaching order, the
 * training packs and method lessons it uses, and for a pack that matters at
 * several levels it names the lessons and drills that belong at this one. The
 * map follows the research curriculum (docs: content audit, section 2): CFOP
 * starts in Sub-60 and only there; full PLL is begun in Sub-45 and finished in
 * Sub-30; full OLL is optional in Sub-20 and expected in Sub-15; lookahead goes
 * spotting (Sub-30), tracking (Sub-20, kept going in Sub-15), knowing (Sub-12); COLL
 * and Winter Variation are optional from Sub-15, ZBLL only in Sub-10; colour
 * neutrality is an optional track.
 */

/** One unit of a course: a pack or method path, optionally cut down to this level's part. */
export interface CourseUnitRef {
  /** A pack id, or "method-<path>" for a method lesson path. */
  id: string;
  /** The lessons this course shows, in order; all of them when absent. */
  lessons?: readonly string[];
  /** The drills this course shows; all of them when absent. */
  drills?: readonly string[];
  /** Worth doing, but off the course's main line (colour neutrality, COLL, ZBLL…). */
  optional?: boolean;
  /** False to leave out the pack's on-screen recognition drill at this level. */
  recognition?: false;
}

export interface CourseDefinition {
  id: string;
  title: string;
  /** The milestone the course gets you under; its threshold is the target time. */
  targetId: string;
  /** Where the people taking it stand: rungs of the level ladder. */
  rungs: readonly string[];
  /** One line for the course card. */
  tagline: string;
  /** What the course teaches, in order. */
  units: readonly CourseUnitRef[];
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
    units: [
      { id: "method-beginner" },
      {
        id: "beginner-method-cold",
        lessons: ["cold-seven-steps", "cold-triggers", "cold-no-daisy"],
        drills: ["cold-ten-in-a-row", "cold-step-check", "cold-trigger-loops"],
      },
      { id: "set-up-your-cube", optional: true },
    ],
    hue: 213,
  },
  {
    id: "sub-60",
    title: "Sub-60",
    targetId: "sub60",
    rungs: ["sub120"],
    tagline: "Stop thinking between steps and start CFOP.",
    units: [
      { id: "method-cfop" },
      {
        id: "cross-efficiency",
        lessons: ["cross-bottom"],
        drills: [],
      },
      { id: "switch-to-f2l" },
      { id: "two-look-oll" },
      { id: "two-look-pll" },
      {
        id: "turning-technique",
        lessons: ["turning-what-a-fingertrick-is", "turning-regrips", "turning-calm"],
        drills: ["turning-trigger-reps", "turning-film-yourself"],
      },
      { id: "first-lookahead" },
      {
        id: "practice-plan",
        lessons: ["practice-two-kinds", "practice-session-shape"],
        drills: [],
      },
      { id: "set-up-your-cube", optional: true },
      { id: "colour-neutral-plan", optional: true },
      { id: "competing", optional: true },
    ],
    hue: 184,
  },
  {
    id: "sub-45",
    title: "Sub-45",
    targetId: "sub45",
    rungs: ["sub60"],
    tagline: "Efficient F2L, case by case, and your first full PLLs.",
    units: [
      {
        id: "f2l-efficiency",
        lessons: ["f2l-what-a-pair-is", "f2l-families", "f2l-move-count"],
        drills: ["f2l-case-audit"],
      },
      {
        id: "pair-recognition",
        lessons: ["pair-both-pieces", "pair-all-angles"],
        drills: ["pair-single-slot", "pair-name-it", "pair-read-four-slots"],
      },
      { id: "choosing-the-next-pair" },
      { id: "stuck-pieces" },
      { id: "inspection", lessons: ["inspection-ladder"], drills: [] },
      {
        id: "pll-algorithms",
        lessons: ["pll-why-first", "pll-order"],
        drills: ["pll-group-learn"],
        optional: true,
        // The drill deals all 21 cases; here the start is the A and J perms.
        recognition: false,
      },
    ],
    hue: 190,
  },
  {
    id: "sub-30",
    title: "Sub-30",
    targetId: "sub30",
    rungs: ["sub45"],
    tagline: "Fewer moves, fewer pauses, full PLL.",
    units: [
      {
        id: "pll-algorithms",
        // The on-screen drill reads each case from two sides alone, the Sub-15 skill.
        recognition: false,
      },
      {
        id: "turning-technique",
        lessons: ["turning-full-sets", "turning-both-hands"],
        drills: ["turning-two-gen", "turning-no-r-moves"],
      },
      {
        id: "cross-efficiency",
        lessons: ["cross-move-count", "cross-pairing-edges"],
        drills: ["cross-eight-move-hunt", "cross-replay"],
      },
      {
        id: "inspection",
        lessons: ["inspection-what-it-is", "inspection-ladder", "inspection-tracking"],
        drills: ["inspection-track-a-piece", "inspection-blind-cross"],
      },
      {
        id: "lookahead",
        lessons: ["lookahead-slow-solves"],
        drills: ["lookahead-slow-solve", "lookahead-metronome"],
      },
      { id: "f2l-efficiency", lessons: ["f2l-empty-slots"], drills: ["f2l-keyhole-hunt"] },
      {
        id: "oll-execution",
        lessons: ["oll-angle", "oll-lockups"],
        drills: ["oll-isolated", "oll-slow-clean"],
      },
    ],
    hue: 47,
  },
  {
    id: "sub-20",
    title: "Sub-20",
    targetId: "sub20",
    rungs: ["sub30", "sub25"],
    tagline: "Lookahead, clean last layers, a time budget.",
    units: [
      {
        id: "lookahead",
        lessons: ["lookahead-three-stages", "lookahead-what-to-look-at"],
        drills: ["lookahead-follow-the-corner"],
      },
      { id: "sub-20-budget" },
      {
        id: "cross-into-f2l",
        lessons: ["join-why-it-exists", "join-xcross"],
        drills: ["join-last-moves-elsewhere", "join-xcross-spotting"],
      },
      {
        id: "inspection",
        lessons: ["inspection-next-pair"],
        drills: ["inspection-follow-one-corner"],
      },
      { id: "f2l-efficiency", lessons: ["f2l-rotations"], drills: ["f2l-no-rotations"] },
      {
        id: "advanced-f2l-cases",
        lessons: ["adv-why-algorithms", "adv-stuck-in-slot"],
        drills: ["adv-case-trainer"],
        // The recognition drill deals all 41 cases; memorised F2L here is the five stuck ones.
        recognition: false,
      },
      {
        id: "oll-algorithms",
        lessons: ["oll-when", "oll-groups"],
        drills: ["oll-group-of-four"],
        optional: true,
      },
      {
        id: "pll-execution",
        lessons: ["pll-target", "pll-algorithm-choice"],
        drills: ["pll-full-set", "ll-random-auf-log"],
      },
      { id: "auf-both-ends" },
      {
        id: "last-pair-into-oll",
        lessons: ["lastpair-free-attention", "lastpair-partial-read"],
        drills: ["lastpair-call-it"],
      },
      {
        id: "practice-plan",
        lessons: ["practice-plateau", "practice-measure"],
        drills: ["practice-one-focus", "practice-take-a-break", "practice-worst-solves"],
      },
      {
        id: "consistency",
        lessons: ["consistency-where-the-spread-is"],
        drills: ["consistency-ao12-only"],
      },
      { id: "xcross-properly", lessons: ["xc-ladder"], drills: [], optional: true },
    ],
    hue: 53,
  },
  {
    id: "sub-15",
    title: "Sub-15",
    targetId: "sub15",
    rungs: ["sub20"],
    tagline: "Where most people get stuck, and how to get out.",
    units: [
      { id: "stuck-at-fifteen" },
      { id: "oll-execution", lessons: ["oll-by-shape"], drills: ["oll-four-angles"] },
      { id: "oll-algorithms" },
      { id: "turning-technique", lessons: ["turning-full-sets"], drills: [] },
      {
        id: "lookahead",
        lessons: ["lookahead-both-pieces"],
        drills: ["lookahead-follow-the-pair"],
      },
      { id: "cross-into-f2l", lessons: ["join-first-pair"], drills: ["join-cross-plus-one"] },
      {
        id: "inspection",
        lessons: ["inspection-cross-plus-one"],
        drills: ["inspection-cross-plus-one-blind", "inspection-unlimited"],
      },
      { id: "good-and-bad-edges" },
      { id: "f2l-from-the-front" },
      { id: "filler-moves" },
      {
        id: "advanced-f2l-cases",
        lessons: ["adv-edge-in-slot", "adv-corner-in-slot", "adv-white-up", "adv-back-slots"],
        drills: ["adv-case-trainer", "adv-back-slot-solves"],
      },
      { id: "oll-into-pll", lessons: ["pll-two-sided"], drills: ["pll-two-face"] },
      {
        id: "last-pair-into-oll",
        lessons: ["lastpair-influence", "lastpair-edge-control"],
        drills: ["lastpair-ls-oll"],
      },
      { id: "pair-recognition", lessons: ["pair-ergonomics"], drills: ["pair-four-slots"] },
      {
        id: "consistency",
        lessons: ["consistency-recovery"],
        drills: ["consistency-log-the-bad-ones"],
      },
      {
        id: "alg-sets-worth-it",
        lessons: ["sets-principle", "sets-small"],
        drills: ["sets-group-of-five"],
        optional: true,
      },
      { id: "colour-neutral-plan", optional: true },
      { id: "competing", optional: true },
    ],
    hue: 25,
  },
  {
    id: "sub-12",
    title: "Sub-12",
    targetId: "sub12",
    rungs: ["sub15"],
    tagline: "Planning further, turning less, never stopping.",
    units: [
      { id: "cross-for-f2l" },
      {
        id: "lookahead",
        lessons: ["lookahead-knowing"],
        drills: ["lookahead-blind-pair", "lookahead-two-pairs-blind"],
      },
      { id: "oll-into-pll", lessons: ["pll-during-oll"], drills: ["pll-oll-pll-joined"] },
      { id: "predict-pll" },
      { id: "xcross-properly" },
      {
        id: "reconstruct-your-solves",
        lessons: ["recon-two-numbers", "recon-how"],
        drills: ["recon-five"],
      },
      { id: "speed-you-can-use" },
      {
        id: "pll-execution",
        lessons: ["pll-under-pressure"],
        drills: ["pll-full-set", "pll-worst-three"],
      },
      {
        id: "consistency",
        lessons: ["consistency-pressure"],
        drills: ["consistency-finish-calmly"],
      },
      { id: "last-layer-at-the-top", optional: true },
    ],
    hue: 330,
  },
  {
    id: "sub-10",
    title: "Sub-10",
    targetId: "sub10",
    rungs: ["sub12", "sub10"],
    tagline: "The details that separate the fastest solvers.",
    units: [
      { id: "past-the-first-pair" },
      {
        id: "reconstruct-your-solves",
        lessons: ["recon-what-to-look-for", "recon-fast-solvers"],
        drills: ["recon-same-scramble"],
      },
      { id: "practising-near-ten" },
      { id: "multislotting" },
      { id: "pll-execution", lessons: ["pll-target"], drills: ["pll-worst-three"] },
      {
        id: "alg-sets-worth-it",
        lessons: ["sets-large"],
        drills: ["sets-frequency"],
        optional: true,
      },
    ],
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
