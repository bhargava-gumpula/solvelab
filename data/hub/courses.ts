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
        lessons: ["cold-no-daisy", "cold-seven-steps", "cold-notation", "cold-triggers"],
        drills: ["cold-ten-in-a-row", "cold-step-check", "cold-trigger-loops"],
      },
      { id: "set-up-your-cube", optional: true },
    ],
    hue: 200,
  },
  {
    id: "sub-60",
    title: "Sub-60",
    targetId: "sub60",
    rungs: ["sub120"],
    tagline: "Stop thinking between steps and start CFOP.",
    units: [
      { id: "method-cfop" },
      { id: "switch-to-f2l" },
      { id: "two-look-oll" },
      { id: "two-look-pll" },
      {
        id: "cross-efficiency",
        lessons: ["cross-bottom"],
        drills: [],
      },
      {
        id: "turning-technique",
        lessons: [
          "turning-what-a-fingertrick-is",
          "turning-regrips",
          "turning-calm",
          "turning-both-hands",
        ],
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
    hue: 170,
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
        lessons: ["f2l-what-a-pair-is", "f2l-move-count"],
        drills: ["f2l-case-audit"],
      },
      {
        id: "pair-recognition",
        lessons: ["pair-both-pieces", "pair-all-angles"],
        drills: ["pair-single-slot", "pair-name-it"],
      },
      { id: "choosing-the-next-pair" },
      { id: "stuck-pieces" },
      {
        id: "pll-algorithms",
        lessons: ["pll-why-first", "pll-order"],
        drills: ["pll-group-learn"],
        optional: true,
      },
    ],
    hue: 140,
  },
  {
    id: "sub-30",
    title: "Sub-30",
    targetId: "sub30",
    rungs: ["sub45"],
    tagline: "Fewer moves, fewer pauses, full PLL.",
    units: [
      { id: "pll-algorithms" },
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
      {
        id: "turning-technique",
        lessons: ["turning-full-sets"],
        drills: ["turning-two-gen", "turning-no-r-moves"],
      },
    ],
    hue: 95,
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
        drills: [],
        // The recognition drill deals all 41 cases; memorised F2L here is the five stuck ones.
        recognition: false,
      },
      { id: "oll-algorithms", lessons: ["oll-when", "oll-groups"], drills: [], optional: true },
      {
        id: "pll-execution",
        lessons: ["pll-target", "pll-algorithm-choice"],
        drills: ["pll-full-set", "ll-random-auf-log"],
      },
      { id: "auf-both-ends" },
      {
        id: "last-pair-into-oll",
        lessons: ["lastpair-free-attention"],
        drills: ["lastpair-call-it"],
      },
      {
        id: "practice-plan",
        lessons: ["practice-plateau"],
        drills: ["practice-one-focus", "practice-take-a-break"],
      },
      {
        id: "consistency",
        lessons: ["consistency-where-the-spread-is"],
        drills: ["consistency-ao12-only"],
      },
      { id: "xcross-properly", lessons: ["xc-payoff", "xc-shapes"], drills: [], optional: true },
    ],
    hue: 45,
  },
  {
    id: "sub-15",
    title: "Sub-15",
    targetId: "sub15",
    rungs: ["sub20"],
    tagline: "Where most people get stuck, and how to get out.",
    units: [
      { id: "stuck-at-fifteen" },
      { id: "oll-algorithms" },
      { id: "oll-execution", lessons: ["oll-by-shape"], drills: ["oll-four-angles"] },
      { id: "turning-technique", lessons: ["turning-full-sets"], drills: ["turning-two-gen"] },
      {
        id: "lookahead",
        lessons: ["lookahead-both-pieces"],
        drills: ["lookahead-follow-the-pair"],
      },
      {
        id: "inspection",
        lessons: ["inspection-cross-plus-one"],
        drills: ["inspection-cross-plus-one-blind", "inspection-unlimited"],
      },
      { id: "cross-into-f2l", lessons: ["join-first-pair"], drills: ["join-cross-plus-one"] },
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
        lessons: ["lastpair-partial-read", "lastpair-influence", "lastpair-edge-control"],
        drills: ["lastpair-ls-oll"],
      },
      { id: "good-and-bad-edges" },
      { id: "pair-recognition", lessons: ["pair-ergonomics"], drills: ["pair-four-slots"] },
      { id: "practice-plan", lessons: ["practice-measure"], drills: ["practice-worst-solves"] },
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
        drills: ["lookahead-blind-pair", "lookahead-two-pairs-blind", "lookahead-metronome"],
      },
      { id: "predict-pll" },
      { id: "oll-into-pll", lessons: ["pll-during-oll"], drills: ["pll-oll-pll-joined"] },
      { id: "xcross-properly" },
      { id: "speed-you-can-use" },
      { id: "pll-execution", lessons: ["pll-under-pressure"], drills: ["pll-worst-three"] },
      {
        id: "consistency",
        lessons: ["consistency-pressure"],
        drills: ["consistency-finish-calmly"],
      },
      {
        id: "reconstruct-your-solves",
        lessons: ["recon-two-numbers", "recon-how"],
        drills: ["recon-five"],
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
      { id: "practising-near-ten" },
      { id: "multislotting" },
      {
        id: "reconstruct-your-solves",
        lessons: ["recon-what-to-look-for", "recon-fast-solvers"],
        drills: ["recon-same-scramble"],
      },
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
