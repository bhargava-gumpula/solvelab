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
import { SCRAMBLE_HOLD, SOLVING_HOLD, SOLVING_ROTATION } from "@/lib/config/cube";

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
      `Hold the cube the same way every solve: ${SOLVING_HOLD}. Scrambles are applied with ${SCRAMBLE_HOLD}, so turn the cube over with ${SOLVING_ROTATION} before you start. Consistency is what lets recognition become automatic.`,
      "Solve the cross on the bottom, not the top. Solving it on top means turning the whole cube over before you can go on, and the habit is much harder to drop later than to skip now.",
      "Get a modern magnetic speedcube if you are still on a hardware-store cube. Below about a minute this genuinely is the equipment, not you.",
    ],
    notYet: [
      "Algorithms beyond the beginner set. You cannot use what you cannot recognise yet.",
      "Timing every solve. Time it occasionally so you can see movement, but chasing the number now teaches rushing.",
      "Colour neutrality, until you can finish every solve. It is optional and this course keeps the white cross on the bottom. If you do want it, start soon after that: switching is easiest while you are new and gets harder the faster you are.",
    ],
    packs: ["beginner-method-cold", "set-up-your-cube"],
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
    headline: "This is where you leave the beginner method behind and switch to CFOP.",
    bottleneck:
      "The beginner method is long. Every first-layer corner and every middle edge goes in on its own, and the last layer takes a string of algorithms, some of them repeated. Faster hands cannot rescue a method that needs this many moves, especially when nearly every one of them still comes with a regrip.",
    doNow: [
      "Switch to CFOP now, in one go: the cross on the bottom as before, then the first two layers as F2L pairs, then 2-look OLL and 2-look PLL. Expect to be slower for a week or two; F2L is worse than your beginner layers until it is better, and then it is better by a long way.",
      "Learn F2L intuitively, not as a list. A pair is a corner and its edge joined in the top layer and then dropped into their slot together; work each case out from that. Learning it as 41 algorithms is slower to learn and worse to use.",
      "Learn 2-look OLL (ten algorithms) and 2-look PLL (six): for the corners, a T perm when one side shows headlights (hold them on the left) and a Y perm when no side does; for the edges, Ua, Ub, H and Z. Sixteen algorithms replace the whole beginner last layer.",
      "Learn finger tricks for U, U', R, R' and F while these algorithms are new, so they set with the right grip: push the U layer with your index finger instead of turning your wrist. Smooth beats fast: an algorithm you run calmly at three turns a second beats one you fumble at five.",
      "Plan the cross during inspection: find all four white edges and work out at least the first two before you turn. Planning the whole cross is the Sub-30 step.",
      "Solve regularly rather than in long rare sessions. Twenty or thirty solves most days moves you faster than two hundred once a week.",
      "Colour neutrality is optional, and this course keeps the white cross on the bottom. If you want it, this is the cheapest time to start, while every habit is new; dual (white or yellow) is the gentler version.",
    ],
    notYet: [
      "Full OLL and PLL. Learn the 2-look versions here; the first full PLLs come in Sub-45, and the full sets after that.",
      "F2L algorithms and x-crosses. Work the pairs out for yourself first; memorised cases only pay off once intuitive F2L is fluent.",
      "Tracking pieces through your moves. For now, just use the moment while your hands run a trigger you know to find the next piece.",
    ],
    packs: [
      "switch-to-f2l",
      "two-look-oll",
      "two-look-pll",
      "cross-efficiency",
      "turning-technique",
      "first-lookahead",
      "practice-plan",
      "colour-neutral-plan",
      "competing",
    ],
    lessons: ["cfop-cross", "cfop-f2l", "cfop-2look-oll", "cfop-2look-pll"],
  },
  {
    id: "sub60",
    label: "Around a minute",
    range: "About 1:00 down to 45 seconds",
    goalId: "sub45",
    headline: "Your F2L works. Now make every pair short.",
    bottleneck:
      "F2L is now the biggest part of the solve, often around half of it. The pairs go in, but by long routes: the corner placed first and the edge chased round after it, or a piece pulled out of a slot and put back. Every extra move is also one more moment spent looking.",
    doNow: [
      "Learn a short solution for every basic F2L case, family by family: the plain inserts, the cases where the edge has to be moved out of the way first, and the ones where the corner needs turning. Understand why a family works and its mirror comes free.",
      "Build each pair before it goes in, even on the days that seems to cost you time. Joining the corner and edge in the top layer and inserting them together is the whole point of F2L; placing one and then the other is the beginner method in disguise.",
      "Read both pieces before you turn. Find the corner and its edge and know the case from any angle, so the first move of every pair is already decided.",
      "Deal with stuck pieces on purpose: when a corner or edge sits in the wrong slot, take it out with a move that also sets up its pair, rather than pulling it out blind and starting again.",
      "Keep the cross on the bottom and stretch the plan you make in inspection: find all four edges and work out as much of the cross as you can before the first turn. Planning the whole cross every solve is the Sub-30 step.",
      "Optional: start full PLL with the A perms, which move only corners, and then the J perms, at no more than about two new algorithms a day. The rest of the set comes in Sub-30.",
    ],
    notYet: [
      "Full OLL. Stay on 2-look OLL; full PLL comes first, and full OLL can wait until Sub-20.",
      "Counting your TPS. The number is meaningless while your move count is still high.",
      "X-crosses. They only pay off when the plain cross is already automatic.",
    ],
    packs: [
      "f2l-efficiency",
      "pair-recognition",
      "choosing-the-next-pair",
      "stuck-pieces",
      "pll-algorithms",
    ],
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
      "Keep each search short. As a pair goes in, glance round for the next corner and edge, so you already have a rough idea where they are when the insert ends. Following them as they move is the Sub-20 step; here the job is spotting quickly and never stopping.",
      "Plan the whole cross in inspection, every solve. No cross needs more than eight moves, so it always fits in one plan; close your eyes and solve it from memory as a check.",
      "Finish full PLL. It is the one new algorithm set in this course, 21 cases against full OLL's 57, and it comes before full OLL in any sensible order. Keep to about two new cases a day, and learn to recognise each one without walking round the cube to check.",
      "Learn keyhole: when one piece of a pair is already home and another slot is still empty (next to it or diagonally opposite), turn D to line that slot up, drop the other piece in on its own and turn D back, with no pairing at all. It turns several awkward cases into short ones.",
      "Don't rotate before every pair: when a top turn will do, use it instead of a y2. One or two rotations a solve are fine for now.",
    ],
    notYet: [
      "Full OLL. Stay on 2-look OLL while you finish PLL; full OLL can start in Sub-20 and is expected by Sub-15.",
      "Tracking the next pair, rotationless F2L and x-crosses. They belong to Sub-20 and Sub-15.",
      "COLL, Winter Variation and ZBLL. COLL and the short Winter Variation cases are optional from about Sub-15; ZBLL is for sub-10 solvers who want it.",
    ],
    packs: [
      "pll-algorithms",
      "cross-efficiency",
      "inspection",
      "lookahead",
      "f2l-efficiency",
      "oll-execution",
      "turning-technique",
    ],
  },
  {
    id: "sub30",
    label: "Around 30 seconds",
    range: "About 30 seconds down to 25",
    goalId: "sub25",
    headline: "This is the lookahead wall: your eyes, not your hands, now set the pace.",
    bottleneck:
      "Slow solves taught you not to stop, but at full speed you still finish a pair and then go looking for the next one. Long solutions and a rotation before a pair make it worse, because every extra move is one more thing to see past.",
    doNow: [
      "Move from spotting to tracking. While you insert a pair, keep your eyes on the next pair's corner and follow it as the moves carry it round, so you know where it lands before the insert ends. Add the edge once the corner is easy.",
      "Keep rotations light: avoid a y2, and aim for one or two rotations in an F2L at most. Taking them out altogether is the Sub-15 step.",
      "Learn your first memorised F2L cases: a corner and its edge stuck in a slot together. Worked out by feel, these usually mean pulling pieces out blind; a known short solution saves several moves every time one comes up.",
      "Now and then a pair is nearly made next to your cross: plan the cross and that pair together as an x-cross for a few extra moves. Never force it.",
      "Keep slow solves in your practice week. They are still the fastest route to lookahead at this level.",
    ],
    notYet: [
      "Chasing a higher TPS. At 30 seconds, ten wasted moves cost more than a slow hand.",
      "Full OLL, for now. 2-look OLL is enough to reach sub-20; start the full set only once the last layer is clearly your biggest leak.",
      "Full colour neutrality if you have not started. Dual (white and yellow) is a cheaper first step.",
    ],
    packs: [
      "lookahead",
      "sub-20-budget",
      "cross-into-f2l",
      "inspection",
      "f2l-efficiency",
      "advanced-f2l-cases",
      "oll-algorithms",
      "pll-execution",
      "auf-both-ends",
      "last-pair-into-oll",
      "practice-plan",
      "consistency",
    ],
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
      "Track one piece through your cross plan in inspection: pick the corner of a likely first pair and follow where the cross moves take it. Knowing even that shortens the pause at the start of F2L; planning the whole first pair is the Sub-15 step.",
      "Read the OLL case while you finish your last pair, not after it. The top face is visible for the whole insertion.",
      "Call the last turn of the top before the PLL algorithm ends, from one reference sticker per case. Reading the PLL from the two sides you can see is the Sub-15 step, and reading it while OLL finishes is Sub-12's.",
      "Full PLL should be finished by now. Full OLL is optional in this course: if the last layer is your leak, learn it in groups you recognise together, starting from the cases your 2-look algorithms already solve. It becomes expected in Sub-15.",
      "Measure the seams rather than guessing: the cross + F2L and last-slot + OLL tests exist to show exactly which join is leaking.",
    ],
    notYet: [
      "COLL, Winter Variation, ZBLL and the other big subsets. COLL and the short Winter Variation cases are optional from about Sub-15; ZBLL belongs to sub-10 solvers who want it.",
      "New hardware. A modern cube is a modern cube; the difference between good cubes at this level is preference.",
    ],
    packs: [
      "lookahead",
      "sub-20-budget",
      "cross-into-f2l",
      "inspection",
      "f2l-efficiency",
      "advanced-f2l-cases",
      "oll-algorithms",
      "pll-execution",
      "auf-both-ends",
      "last-pair-into-oll",
      "practice-plan",
      "consistency",
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
      "Get the cross and F2L together under about 10 seconds with no stops. That is the sub-15 shape: roughly 1.5-2 s of cross and 7.5-8 s of F2L, leaving 5-5.5 s for the last layer.",
      "Learn cross+1: in inspection, plan the cross, then find your first pair and follow its corner and edge through the cross moves, so F2L starts without a pause.",
      "Learn full OLL now if you have not. It is expected at this level: once the last layer is about five or six seconds, 2-look is the main leak. Keep 2-look as the fallback for the cases you have not learned yet.",
      "Learn the memorised F2L cases that intuition handles badly: an edge in its slot with the corner on top, a corner in its slot with the edge on top, and the cases where the corner's white sticker faces up.",
      "Tighten the end of the solve. On the last pair, when two inserts are equally good, take the one that leaves more top edges facing up (partial edge control, which mostly saves you from dot OLLs), and read the PLL from the two sides facing you instead of turning the cube to check.",
      "Find the algorithms you are slow on and treat them as separate work: the profile's OLL and PLL algorithm measurements exist to find them for you.",
      "Film a solve and watch it at quarter speed. Count the rotations, the filler moves (a U then a U2, a rotation you undo) and the pauses you did not know you were making, and for each case that keeps making you rotate the cube, learn a way to solve it in the back slot where it sits.",
      "Colour neutrality is optional, so weigh it honestly. Full neutrality saves about one move per cross on average (roughly 5.8 down to 4.8), dual (white or yellow) about half that, and Feliks Zemdegs measured the gain at about 0.25 s a solve. With full neutrality, crosses of four moves or fewer come up about five times as often as on one colour. At this speed a full switch can take months of slower solves; dual is the cheaper middle step.",
    ],
    notYet: [
      "Turning as fast as you physically can. At this level control is what keeps the pauses out.",
      "Big algorithm sets beyond full OLL and PLL. COLL and the short Winter Variation cases are the only optional extras worth a look, and only once full OLL is in and F2L is no longer your leak.",
    ],
    packs: [
      "stuck-at-fifteen",
      "oll-algorithms",
      "oll-execution",
      "turning-technique",
      "lookahead",
      "inspection",
      "cross-into-f2l",
      "f2l-from-the-front",
      "filler-moves",
      "oll-into-pll",
      "last-pair-into-oll",
      "good-and-bad-edges",
      "pair-recognition",
      "practice-plan",
      "consistency",
      "alg-sets-worth-it",
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
      "Aim for most OLLs and PLLs in about 1-1.5 s each, the common ones near 1 s. Under a second on most of them is the sub-10 standard, not this one; the slow handful are where the seconds are.",
      "Plan the cross and your first pair as one plan, and take an x-cross when the scramble hands you one. Never force one every solve.",
      "Choose your cross for what comes after it. When two crosses cost about the same, take the one that is easier to fingertrick or leaves the easier F2L cases.",
      "Predict the PLL before it arrives: while your hands finish OLL's closing trigger, check the side stickers already in view for a block, a bar or headlights, so the case is half-known before OLL ends. Learn a second angle only for the PLLs that would otherwise need a U2 first.",
      "Optional, once F2L is pause-free and full OLL and PLL are solid: COLL (40 cases) for solves where the top edges already face up, about 1 in 8. It leaves only an edges PLL (U, H or Z), or a skip about 1 time in 12. And the short R/U Winter Variation cases, for when the last pair is joined above its slot ready for U R U' R' and the top edges face up: the corners come up as the pair goes in, so OLL is skipped.",
    ],
    notYet: [
      "Chasing personal bests. The average is the thing that moves; a lucky single tells you nothing.",
      "Practising only full solves. Half your practice should still be deliberate work on one thing.",
      "ZBLL. It is optional even at the top and belongs to the sub-10 range; COLL is the step before it, if you want either.",
    ],
    packs: [
      "cross-for-f2l",
      "lookahead",
      "predict-pll",
      "oll-into-pll",
      "xcross-properly",
      "speed-you-can-use",
      "pll-execution",
      "consistency",
      "reconstruct-your-solves",
      "last-layer-at-the-top",
    ],
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
      "Make spotting free x-crosses routine: when a pair is nearly made during the cross, take it, and plan a plain cross when none is on offer. It takes one pair out of F2L and makes the rest easier to read.",
      "Squeeze the end of F2L: pseudo-slot a pair when it saves moves, pick the last insert that leaves more top edges facing up (partial edge control), and during OLL spot a block or headlights so the PLL is half-known before it starts.",
      "Reconstruct your own solves. Write out the moves you actually made and count them. Anything over about 55 moves has a reason worth finding. Then compare them with reconstructions of much faster solvers.",
      "Practise with a metronome at a fixed turn rate so pauses become audible rather than invisible.",
    ],
    notYet: [
      "Learning ZBLL as a whole. It is 493 cases; take the useful subsets first and see whether you want the rest.",
      "Changing method. CFOP goes well past sub-10; a method change now costs months.",
    ],
    packs: ["past-the-first-pair", "multislotting"],
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
      "New algorithm sets as the main plan. ZBLL is optional even here: Feliks Zemdegs and Max Park were already among the best in the world before they learned it, and the gain showed mostly in their singles. If you want it, begin with the ZBLL cases that differ only slightly from COLL cases you already know.",
    ],
    packs: ["practising-near-ten"],
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
