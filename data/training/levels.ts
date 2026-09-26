/**
 * The road from about two minutes to sub-10, one rung at a time.
 *
 * Each level answers the same three questions: where the time actually is,
 * what to do about it, and what to leave alone for now. The last one matters
 * as much as the first — most wasted practice is real advice applied at the
 * wrong level.
 *
 * Split goals aren't repeated here: they come from `aspectTargetsFor`, so the
 * ladder and the solve profile can't drift apart.
 */

import { milestones } from "@/data/milestones";
import { aspectTargetsFor } from "@/data/milestones/aspect-targets";

export interface LevelGuide {
  /** Matches a milestone id, so a person's goal picks the rung. */
  id: string;
  label: string;
  /** The stretch this rung covers, in words. */
  range: string;
  /** The milestone this rung is working towards. */
  goalId: string | null;
  /** The single sentence that describes this level. */
  headline: string;
  /** Where the time is, honestly. */
  bottleneck: string;
  /** What to do, roughly in order. */
  doNow: string[];
  /** What feels productive at this level but isn't, yet. */
  notYet: string[];
  /** Packs worth opening now, most useful first. */
  packs: string[];
  /** Lessons from Learn, while the method itself is still new. */
  lessons?: string[];
}

export const LEVELS: LevelGuide[] = [
  {
    id: "beginner",
    label: "Still learning",
    range: "Your first solves, up to about 2 minutes",
    goalId: "sub120",
    headline: "Nothing here is about speed yet. It is about finishing, every time.",
    bottleneck:
      "You are still recalling what to do next, so almost all of the time is thinking rather than turning. Trying to turn faster now just produces mistakes you have to undo.",
    doNow: [
      "Solve it start to finish without looking anything up. Do that ten times before worrying about a single second.",
      "Learn to read notation properly. R, U, F, primes and doubles are the language everything else is written in, and guessing at them will cost you later.",
      "Hold the cube the same way every solve. White on the bottom, one colour in front. Consistency is what lets recognition become automatic.",
      "Solve the cross on the bottom, not the top. Solving it on top means turning the whole cube over before you can go on, and the habit is much harder to drop later than to skip now.",
      "Get a modern magnetic speedcube if you are still on a hardware-store cube. Below about a minute this genuinely is the equipment, not you.",
    ],
    notYet: [
      "Algorithms beyond the beginner set. You cannot use what you cannot recognise yet.",
      "Timing every solve. Time it occasionally so you can see movement, but chasing the number now teaches rushing.",
      "Colour neutrality. It is worth doing later and it is easier later than it sounds.",
    ],
    packs: ["beginner-method-cold", "set-up-your-cube", "turning-technique", "practice-plan"],
    lessons: [
      "beginner-know-cube",
      "beginner-notation",
      "beginner-first-layer",
      "beginner-first-solve",
    ],
  },
  {
    id: "sub120",
    label: "Around 2 minutes",
    range: "About 2:00 down to 1:00",
    goalId: "sub60",
    headline: "Your hands are the bottleneck, and they are the cheapest thing to fix.",
    bottleneck:
      "You know what to do but each turn takes a whole hand movement, and you regrip between almost every one. A solve at this pace is mostly hands, not thinking.",
    doNow: [
      "Learn proper finger tricks for U, U', R, R' and F. Push the U layer with the index finger rather than picking the cube up and rotating your wrist. This alone is usually worth thirty seconds.",
      "Drill your beginner algorithms until you can run them without reading them. Smooth beats fast: an algorithm you execute calmly at three turns a second beats one you fumble at five.",
      "Stop turning the whole cube to see a face. Every rotation is dead time. Learn to solve the second layer on both the left and the right so you do not have to turn it round.",
      "Start planning the cross during inspection instead of hunting for edges once the timer is running.",
      "Solve regularly rather than in long rare sessions. Twenty or thirty solves most days moves you faster than two hundred once a week.",
    ],
    notYet: [
      "Full OLL and PLL. Two-look is enough for a long time yet and full sets will not stick.",
      "Lookahead drills. There is no point looking ahead when the hands cannot keep up with what the eyes already found.",
    ],
    packs: [
      "beginner-method-cold",
      "set-up-your-cube",
      "turning-technique",
      "practice-plan",
      "cross-efficiency",
    ],
    lessons: ["cfop-cross", "cfop-f2l"],
  },
  {
    id: "sub60",
    label: "Around a minute",
    range: "About 1:00 down to 45 seconds",
    goalId: "sub45",
    headline: "This is where you leave the beginner method behind.",
    bottleneck:
      "Solving the first layer and then the second layer separately costs you roughly twenty moves you do not need. F2L pairs both pieces at once, and it is the single biggest move-count saving in CFOP.",
    doNow: [
      "Learn F2L intuitively, not as a list. Understand that a pair is joined in the top layer and then dropped into its slot, and work the cases out from that. Learning it as 41 algorithms is slower to learn and worse to use.",
      "Expect to get slower for a week or two. Everyone does. Intuitive F2L is worse than your beginner method until it is better, and it is better by a long way.",
      "Learn 2-look OLL (ten cases) and 2-look PLL (six cases). Sixteen algorithms replaces the whole beginner last layer.",
      "Keep the cross on the bottom and keep planning it during inspection. Aim to at least know where all four edges are before you start.",
      "Practise solving pairs into the back slots so you stop rotating the cube for every pair.",
    ],
    notYet: [
      "Full PLL. Get 2-look solid first; the recognition habits carry straight over.",
      "Counting your TPS. The number is meaningless while your move count is still high.",
      "X-crosses. They only pay off when the plain cross is already automatic.",
    ],
    packs: [
      "switch-to-f2l",
      "two-look-oll",
      "two-look-pll",
      "f2l-efficiency",
      "pair-recognition",
      "cross-efficiency",
    ],
    lessons: ["cfop-f2l", "cfop-2look-oll", "cfop-2look-pll"],
  },
  {
    id: "sub45",
    label: "Around 45 seconds",
    range: "About 45 seconds down to 30",
    goalId: "sub30",
    headline: "F2L is now more than half your solve, and most of it is looking, not turning.",
    bottleneck:
      "You stop after every pair to hunt for the next one. Those pauses are usually longer than the pairs themselves, and no amount of turning faster removes them.",
    doNow: [
      "Do slow solves. Turn at about half your normal speed with one rule: the cube never stops moving during F2L. If you have to pause, you were going too fast.",
      "Learn to track one piece. While you insert the current pair, keep your eyes on the corner of the next one. Add the edge once the corner is easy.",
      "Cut your rotations. Count them in a solve; if it is more than two you are paying for it. Learn the back-slot insertions.",
      "Finish planning the whole cross in inspection, every solve. Close your eyes and solve it from memory as a check.",
      "Learn full PLL before full OLL. It is smaller (21 against 57) and it is used twice as often per case.",
    ],
    notYet: [
      "Full OLL. It saves about a second, and you have five to find elsewhere first.",
      "COLL, Winter Variation and the rest. They are real techniques for a much later level.",
    ],
    packs: [
      "choosing-the-next-pair",
      "stuck-pieces",
      "lookahead",
      "f2l-efficiency",
      "inspection",
      "pll-algorithms",
    ],
  },
  {
    id: "sub30",
    label: "Around 30 seconds",
    range: "About 30 seconds down to 25",
    goalId: "sub25",
    headline: "Efficiency beats speed here. Fewer moves, not faster ones.",
    bottleneck:
      "Your pairs work but they are long. Solutions that take ten or twelve moves where seven would do, plus a rotation to set them up, add up across four pairs.",
    doNow: [
      "Learn the good solution for every F2L case, not just a solution. Most cases are seven or eight moves; if yours is eleven, it is costing you a second every time it appears.",
      "Learn the cases from all four angles, so a pair in the back-left slot is the same case to you as one at the front-right.",
      "Use your empty slots. A pair that fights you from the front will often go in cleanly using the slot you have not filled yet, with no rotation at all.",
      "Keep slow solves in your practice week. They are still the fastest route to lookahead at this level.",
      "Finish full PLL. Two-look PLL costs you an extra algorithm on most solves.",
    ],
    notYet: [
      "Chasing a higher TPS. At 30 seconds, ten wasted moves cost more than a slow hand.",
      "Full colour neutrality if you have not started. Dual (white and yellow) is a cheaper first step.",
    ],
    packs: ["sub-20-budget", "auf-both-ends", "f2l-efficiency", "lookahead", "pll-algorithms"],
  },
  {
    id: "sub25",
    label: "Around 25 seconds",
    range: "About 25 seconds down to 20",
    goalId: "sub20",
    headline: "The joins between stages start to show.",
    bottleneck:
      "Each stage is reasonable on its own, but there is a gap at every seam: after the cross, before OLL, before PLL. Four small pauses is two or three seconds.",
    doNow: [
      "Find your first pair during inspection, after the cross. Even knowing which pair you will do removes the pause at the start of F2L.",
      "Read the OLL case while you finish your last pair, not after it. The top face is visible for the whole insertion.",
      "Read the PLL case from two sides as the OLL algorithm finishes, rather than stopping to look at the top.",
      "Finish full PLL if it is not done, and start full OLL in groups you can recognise together.",
      "Measure the seams rather than guessing: the cross + F2L and last-slot + OLL tests exist to show exactly which join is leaking.",
    ],
    notYet: [
      "OLLCP, ZBLL and the large subsets. They are a sub-12 concern and a large investment.",
      "New hardware. A modern cube is a modern cube; the difference between good cubes at this level is preference.",
    ],
    packs: [
      "auf-both-ends",
      "sub-20-budget",
      "cross-into-f2l",
      "last-pair-into-oll",
      "oll-into-pll",
      "oll-algorithms",
    ],
  },
  {
    id: "sub20",
    label: "Around 20 seconds",
    range: "About 20 seconds down to 15",
    goalId: "sub15",
    headline: "Pause-free F2L is worth more than everything else combined.",
    bottleneck:
      "The stages are all fine. What is left is the half-second of hesitation between pairs, four times a solve, plus the occasional algorithm you still have to think about.",
    doNow: [
      "Get F2L to about ten or eleven seconds with no stops. That is the sub-20 shape: roughly two seconds of cross, ten or eleven of F2L, six of last layer.",
      "Plan the whole cross in eight moves or fewer during inspection, every time, and start your first pair with no hesitation.",
      "Learn full OLL if you have not. From here it is worth about a second, and 2-look starts to be the thing holding the last layer back.",
      "Find the algorithms you are slow on and treat them as separate work: the profile's OLL and PLL algorithm measurements exist to find them for you.",
      "Watch a recording of your own solve at quarter speed. You will see pauses you did not know you were making.",
    ],
    notYet: [
      "Turning as fast as you physically can. At this level control is what keeps the pauses out.",
      "Big algorithm sets beyond full OLL and PLL.",
    ],
    packs: [
      "colour-neutral-plan",
      "filler-moves",
      "competing",
      "lookahead",
      "oll-algorithms",
      "pll-execution",
      "inspection",
    ],
  },
  {
    id: "sub15",
    label: "Around 15 seconds",
    range: "About 15 seconds down to 12",
    goalId: "sub12",
    headline: "You stop reacting to the cube and start knowing what it will do.",
    bottleneck:
      "Tracking pieces works, but you are still tracking. The next step is predicting: knowing where a piece will end up before you turn, because you already know what the moves do.",
    doNow: [
      "Move from tracking to knowing. Plan a pair, close your eyes, execute it, and predict where the next pair's pieces have landed. Open your eyes and check.",
      "Get most of your OLLs and PLLs under a second. Not all of them — most of them. The slow handful are where the seconds are.",
      "Plan the cross and your first pair together in inspection. Not a full x-cross yet, just knowing both.",
      "Cut filler moves. U then U2, or a rotation you undo, means the solution you picked was not the one you wanted.",
      "Become colour neutral, or at least dual, if you are not. At this level it is worth roughly a second of cross and a better first pair.",
    ],
    notYet: [
      "Chasing personal bests. The average is the thing that moves; a lucky single tells you nothing.",
      "Practising only full solves. Half your practice should still be deliberate work on one thing.",
    ],
    packs: ["xcross-properly", "multislotting", "lookahead", "oll-execution", "pll-execution"],
  },
  {
    id: "sub12",
    label: "Around 12 seconds",
    range: "About 12 seconds down to 10",
    goalId: "sub10",
    headline: "Efficiency and execution both have to be good. Neither carries the other any more.",
    bottleneck:
      "A 55-move solve at 6 turns per second and a 45-move solve at 5 both take about nine seconds. At this level you need the low move count and the clean execution, and most people have one.",
    doNow: [
      "Solve every F2L case in two or three triggers, with essentially no rotations and no regrips you did not choose.",
      "Learn x-crosses properly: spot when a pair is nearly made during the cross and take it. It removes the hardest pair and makes the rest of F2L easier to read.",
      "Add the first useful subsets: COLL for the OLLs you get most, and Winter Variation if your last slot is often an easy corner case.",
      "Reconstruct your own solves. Write out the moves you actually made and count them. Anything over about 55 moves has a reason worth finding.",
      "Practise with a metronome at a fixed turn rate so pauses become audible rather than invisible.",
    ],
    notYet: [
      "Learning ZBLL as a whole. It is 493 cases; take the useful subsets first and see whether you want the rest.",
      "Changing method. CFOP goes well past sub-10; a method change now costs months.",
    ],
    packs: ["multislotting", "xcross-properly", "f2l-efficiency", "consistency"],
  },
  {
    id: "sub10",
    label: "Sub 10",
    range: "Sub-10 and beyond",
    goalId: null,
    headline: "The work is narrower now: find the specific thing costing you, and fix that.",
    bottleneck:
      "There is no single bottleneck left. What remains is a small set of personal weaknesses — three PLLs you are slow on, one slot you avoid, a pause you make when the cross is on green.",
    doNow: [
      "Work from evidence, not feel. Split your solves, find the specific cases and situations that are slow, and drill exactly those.",
      "Push efficiency below 55 moves. At this level move count is the thing that still has room in it.",
      "Widen recognition: know every last-layer case from every angle, so you never turn the cube to check.",
      "Take breaks seriously. Long plateaus are normal here, and time away often produces the jump that more solving does not.",
      "Practise under pressure if you compete. Solving alone and solving with a judge watching are different skills.",
    ],
    notYet: [
      "Expecting steady progress. Improvement at this level arrives in steps with long flat stretches between them.",
    ],
    packs: ["reconstruct-your-solves", "alg-sets-worth-it", "consistency", "practice-plan"],
  },
];

export function levelFor(levelId: string | null | undefined): LevelGuide | null {
  return LEVELS.find((level) => level.id === levelId) ?? null;
}

/**
 * The rung a person is standing on, from their timer average: the band their
 * average falls inside, so someone at 18 seconds is on the rung that runs from
 * 20 down to 15.
 */
export function levelForAverage(averageMs: number | null): LevelGuide | null {
  if (averageMs === null) return null;
  // Each rung is named after the milestone it has reached, so its threshold
  // comes from the milestone rather than being written out again here.
  const byThreshold = LEVELS.flatMap((level) => {
    const threshold = milestones.find((milestone) => milestone.id === level.id)?.thresholdMs;
    return threshold ? [{ level, threshold }] : [];
  }).sort((a, b) => a.threshold - b.threshold);
  return byThreshold.find(({ threshold }) => averageMs < threshold)?.level ?? levelFor("beginner");
}

/** The rung whose next step is this goal — where someone aiming at it stands. */
export function levelForGoal(goalId: string | null | undefined): LevelGuide | null {
  // The last rung has no goal above it, so "no goal" must not match it.
  if (!goalId) return null;
  return LEVELS.find((level) => level.goalId === goalId) ?? null;
}

/**
 * The rung someone is standing on, and why: their timer average when there is
 * one, otherwise the rung below their goal.
 */
export function currentLevel(
  averageMs: number | null,
  goalId: string | null | undefined,
): { level: LevelGuide; source: "average" | "goal" } | null {
  const fromAverage = levelForAverage(averageMs);
  if (fromAverage) return { level: fromAverage, source: "average" };
  const fromGoal = levelForGoal(goalId);
  return fromGoal ? { level: fromGoal, source: "goal" } : null;
}

export interface LevelSplits {
  crossMs: number;
  f2lMs: number;
  lastLayerMs: number;
}

/**
 * How a solve at this rung's goal divides up. The profile's goals for each
 * isolated test leave out the pause in front of it, so those pauses are added
 * back to the stage they lead into; the three parts then add up to the goal.
 */
export function levelSplits(level: LevelGuide): LevelSplits | null {
  const targets = level.goalId ? aspectTargetsFor(level.goalId) : null;
  if (!targets) return null;
  return {
    crossMs: targets.crossMs,
    f2lMs: targets.f2lMs + targets.crossToF2lMs,
    lastLayerMs: targets.ollMs + targets.f2lToOllMs + targets.pllMs + targets.ollToPllMs,
  };
}
