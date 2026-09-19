import type { AspectId } from "@/lib/coach/aspects";

/**
 * Coaching tips for every part of the solve, written in our own words from
 * public speedcubing resources (linked as sources). Language is hedged on
 * purpose: these are what usually helps, not guarantees.
 */

export interface TipSource {
  label: string;
  url: string;
}

export interface AspectTips {
  /** What usually causes this to be slow, in one sentence. */
  why: string;
  /** Things to change, most useful first. */
  tips: string[];
  /** One specific practice drill. */
  drill: string;
  /** Shown when this part is already on pace. */
  keep: string;
  sources: TipSource[];
}

const SOURCES = {
  jpermCross: { label: "J Perm: Cross", url: "https://www.jperm.net/3x3/cfop/cross" },
  jpermF2l: { label: "J Perm: F2L", url: "https://jperm.net/3x3/cfop/f2l" },
  extendedCross: {
    label: "CubeSkills: 25 extended cross examples",
    url: "https://www.cubeskills.com/blog/25-extended-cross-examples",
  },
  crossPlusPair: {
    label: "CubeSkills: Planning cross and one F2L pair",
    url: "https://www.cubeskills.com/tutorials/advanced-f2l/planning-cross-1-f2l-pair",
  },
  crossTransition: {
    label: "CubeSkills: Improving the cross to F2L transition",
    url: "https://www.cubeskills.com/tutorials/intermediate-cross-and-f2l/improving-crossf2l-transition",
  },
  lookaheadFramework: {
    label: "CubeSkills: Lookahead progression framework",
    url: "https://www.cubeskills.com/blog/lookahead-progression-framework",
  },
  slowF2l: {
    label: "SpeedSolving: Going slow and looking ahead",
    url: "https://www.speedsolving.com/threads/fridrich-f2l-going-slow-and-looking-ahead-tutorial.15213/",
  },
  cubefreakLookahead: {
    label: "Cubefreak: A guide to F2L lookahead",
    url: "https://cubefreak.net/speed/articles/lookahead.php",
  },
  emptySlots: {
    label: "Jayden McNeill: Taking advantage of empty slots",
    url: "https://www.jaydenmcneillcubing.com/blog/blog-post-twelve-s6blk",
  },
  badmephistoF2l: { label: "Badmephisto: F2L", url: "http://badmephisto.com/f2l.html" },
  edgeControl: {
    label: "SpeedSolving: Partial control during F2L",
    url: "https://www.speedsolving.com/threads/partial-corner-control-during-f2l.38870/",
  },
  ollAlgs: { label: "SpeedCubeDB: OLL algorithms", url: "https://speedcubedb.com/a/3x3/OLL" },
  pllAlgs: {
    label: "SpeedSolving wiki: PLL",
    url: "https://www.speedsolving.com/wiki/index.php/PLL",
  },
  pllRecognition: {
    label: "Sarah's Cubing Site: PLL recognition guide",
    url: "https://sarah.cubing.net/3x3x3/pll-recognition-guide",
  },
  twoSidedPll: {
    label: "Two-sided PLL recognition",
    url: "https://logiqx.github.io/cubing-algs/html/2spll.html",
  },
  predictPll: {
    label: "CubeSkills: Predicting PLL drill",
    url: "https://www.cubeskills.com/tutorials/advanced-last-layer/practice-drill-predicting-pll",
  },
  roll: {
    label: "Jayden McNeill: ROLL for PLL prediction",
    url: "https://www.jaydenmcneillcubing.com/blog/blog-post-nine-9w8xs",
  },
  fingerTricks: {
    label: "SpeedSolving wiki: Finger tricks",
    url: "https://www.speedsolving.com/wiki/index.php/Finger_tricks",
  },
  turningSpeed: {
    label: "CubeSkills: Improving turning speed",
    url: "https://www.cubeskills.com/blog/improving-turning-speed",
  },
  lockups: {
    label: "Cubelelo: How to fix cube lockups",
    url: "https://www.cubelelo.com/blogs/cubing/how-to-fix-cube-lockups",
  },
  practicePlan: {
    label: "CuberPal: A better practice session plan",
    url: "https://www.cuberpal.com/blog/how-to-practice-speedcubing",
  },
} satisfies Record<string, TipSource>;

export const ASPECT_TIPS: Record<AspectId, AspectTips> = {
  cross: {
    why: "A slow cross usually means solving the edges one at a time instead of seeing how they fit together, or doing more moves than needed.",
    tips: [
      "Look at how the four cross edges relate to each other and solve pairs of them together; almost every cross takes 8 moves or fewer.",
      "Solve the cross on the bottom so you never have to flip the cube before F2L.",
      "Turn a little slower and smoother during the cross; a clean cross with no pause afterwards beats a rushed one.",
    ],
    drill:
      "Take ten scrambles, plan each cross fully, write the move count down, then look for a shorter solution before you solve it.",
    keep: "Your cross is on pace. Keep planning all of it in inspection.",
    sources: [SOURCES.jpermCross, SOURCES.extendedCross],
  },
  cross_planning: {
    why: "Losing time here usually means you can't finish planning the cross in 15 seconds, so you plan the rest while turning.",
    tips: [
      "Practise planning the whole cross in inspection, then execute it without looking at the cube. If it's not solved, the plan was incomplete.",
      "Start with the edges that are easiest to place and track how each move affects the others.",
      "Gradually shorten the time you allow yourself to plan until 15 seconds feels comfortable.",
    ],
    drill:
      "Blindfolded cross: plan in inspection, close your eyes, solve the cross, open and check. Do ten a day.",
    keep: "You're using inspection well: planning under the 15-second limit costs you almost nothing.",
    sources: [SOURCES.jpermCross, SOURCES.crossPlusPair],
  },
  cross_to_f2l: {
    why: "A pause after the cross usually happens because you only start looking for your first pair once the cross is done.",
    tips: [
      "In inspection, once the cross is planned, find where the first pair's corner and edge are; they often don't move during the cross.",
      "Finish the cross with the first pair's slot in a comfortable spot so you can start F2L without a rotation.",
      "Slow down the last cross moves slightly and use them to spot the pair.",
    ],
    drill:
      "Cross + first pair: for each scramble, plan the cross and name the first pair before starting, then solve both without pausing.",
    keep: "You go from cross into F2L smoothly. Next step could be planning an extended cross.",
    sources: [SOURCES.crossTransition, SOURCES.crossPlusPair, SOURCES.extendedCross],
  },
  f2l: {
    why: "Slow F2L is usually a mix of slow single pairs and pauses between them; the pair speed and lookahead lines show which one matters more for you.",
    tips: [
      "Work on whichever is slower for you below: pair speed (how you solve each pair) or lookahead (the pauses between pairs).",
      "Avoid cube rotations where you can, and use empty slots to set up easier cases.",
      "Solve F2L a little slower but without stopping; smooth usually beats fast-then-pause.",
    ],
    drill:
      "Slow-turning F2L: solve five F2Ls at about half speed without ever stopping, then five at normal speed.",
    keep: "Your F2L is on pace for your goal.",
    sources: [SOURCES.jpermF2l, SOURCES.lookaheadFramework],
  },
  pair_speed: {
    why: "Slow pairs usually come from inefficient solutions: extra moves, rotations, or not recognising the case quickly.",
    tips: [
      "Learn the efficient solution for each basic F2L case, and the mirror for the other side, so you don't need rotations.",
      "Use empty slots to set up pairs more easily, especially for your first two pairs.",
      "Practise pairs in the back slots so you don't always rotate them to the front.",
    ],
    drill:
      "Single pairs: set up one pair at a time (the single pair test does this) and solve each in the fewest moves you can find.",
    keep: "You solve individual pairs quickly. Keep the solutions efficient as you speed up.",
    sources: [SOURCES.jpermF2l, SOURCES.emptySlots, SOURCES.badmephistoF2l],
  },
  lookahead: {
    why: "Time lost here is pausing between pairs: you only look for the next pair after inserting the current one.",
    tips: [
      "While you insert a pair, move your eyes away from it and find the pieces of the next one.",
      "Turn slower than your maximum; turning faster than you can see usually creates pauses that cost more than the speed saves.",
      "Build up gradually: first look ahead during the easy part of each insert, then during the whole insert.",
    ],
    drill:
      "Very slow F2L (about one second per turn) without ever stopping. When it's easy, speed up a little but keep never stopping.",
    keep: "You barely pause between pairs. That's the hardest F2L skill; keep it as you turn faster.",
    sources: [SOURCES.lookaheadFramework, SOURCES.slowF2l, SOURCES.cubefreakLookahead],
  },
  f2l_to_oll: {
    why: "A pause before OLL usually means stopping to find the OLL case after the last pair.",
    tips: [
      "Insert the last pair quickly and cleanly, then recognise OLL from the shape on top.",
      "Learn to recognise OLL cases from two sides, so you don't turn the cube to look.",
      "Later on, look into edge control: some last-pair inserts also orient the edges, which gives easier OLLs.",
    ],
    drill:
      "Last pair + OLL: set up the last pair and name the OLL case the moment the pair goes in, before turning.",
    keep: "You go from the last pair into OLL without much of a pause.",
    sources: [SOURCES.edgeControl, SOURCES.ollAlgs],
  },
  oll: {
    why: "Slow OLL is usually slow recognition or algorithms that aren't fully in your fingers yet.",
    tips: [
      "Drill the algorithms you use most until you can do them without thinking.",
      "Pick algorithms that suit your hands: fewer regrips and moves that flow into each other.",
      "Recognise cases by their shape (lines, dots, fish, and so on) instead of counting stickers.",
    ],
    drill: "Pick three OLLs you know but do slowly, and do each 20 times in a row, twice a day.",
    keep: "Your OLL is on pace.",
    sources: [SOURCES.ollAlgs, SOURCES.fingerTricks],
  },
  oll_algorithms: {
    why: "Some OLL cases take much longer than others, which usually means algorithms you don't know yet (two-look) or know only slowly.",
    tips: [
      "If you use two-look OLL, learn full OLL one group at a time, starting with the most common cases.",
      "Write down which cases feel slow during practice and drill those first.",
      "Learning cases by their shape makes the next group easier to recognise.",
    ],
    drill:
      "Each day, learn two new OLL cases and review the last few days' cases until they're as fast as your others.",
    keep: "Your OLL cases take about the same time. You know your algorithms well.",
    sources: [SOURCES.ollAlgs],
  },
  oll_to_pll: {
    why: "A pause before PLL usually means stopping to look around the cube to find the PLL case.",
    tips: [
      "Learn two-sided PLL recognition so you can spot the case from the two faces you already see.",
      "During the last moves of OLL, start looking for bars, headlights and blocks on the sides.",
      "Later, practise predicting PLL (or the AUF) before OLL is finished.",
    ],
    drill:
      "OLL then PLL: after each OLL, name the PLL out loud within a second, before turning the top.",
    keep: "You go from OLL into PLL smoothly.",
    sources: [SOURCES.twoSidedPll, SOURCES.predictPll, SOURCES.roll],
  },
  pll: {
    why: "Slow PLL is usually slow recognition, clunky finger tricks, or an extra look before the final turn (AUF).",
    tips: [
      "Recognise the case from two sides using headlights, bars and blocks.",
      "Drill your slowest PLLs with smooth finger tricks and no regrips.",
      "Finish the final turn (AUF) in the same motion as the algorithm instead of stopping to check.",
    ],
    drill: "Do your three slowest PLLs ten times each, focusing on flow rather than speed.",
    keep: "Your PLL is on pace.",
    sources: [SOURCES.pllRecognition, SOURCES.pllAlgs, SOURCES.fingerTricks],
  },
  pll_algorithms: {
    why: "Some PLL cases take much longer than others, which usually means two-look PLL or a few cases you don't know well.",
    tips: [
      "If you use two-look PLL, learn full PLL: 21 cases, and the most common ones first.",
      "Find better algorithms for the slow cases: many people swap their G or N perms for ones that suit their hands.",
      "Practise recognition separately from execution.",
    ],
    drill: "Every day, do each PLL you know once in a row, and repeat the slowest ones.",
    keep: "Your PLL cases take about the same time.",
    sources: [SOURCES.pllAlgs, SOURCES.twoSidedPll],
  },
  full_solve: {
    why: "Your overall average is the sum of every part; the parts marked slow are where most of the time goes.",
    tips: [
      "Work on the slowest parts in your profile first; they usually give the biggest drop in average.",
      "Mix focused practice on one part with normal solves so the improvements carry over.",
      "Retake the matching test after a week or two to check the change.",
    ],
    drill: "Twenty minutes of focused practice on your top weakness, then twelve normal solves.",
    keep: "Your average is already at your goal. Time for a faster one.",
    sources: [SOURCES.practicePlan],
  },
  consistency: {
    why: "High spread usually comes from lockups, rushing, or a few bad cases, rather than from being slow overall.",
    tips: [
      "Check your cube: even tension and a clean, lightly lubed cube lock up much less.",
      "Turn at a steady pace you can hold for every solve, rather than going all-out.",
      "Look at your slowest solves for a pattern (a case, a lockup, a pause) and practise that.",
    ],
    drill:
      "Do solves at a pace where you never lock up for a whole average of twelve, then nudge the pace up.",
    keep: "Your times are steady.",
    sources: [SOURCES.lockups, SOURCES.practicePlan],
  },
  turning_speed: {
    why: "Slow turning is usually wrist turns instead of finger tricks, extra regrips, or tight, heavy turning.",
    tips: [
      "Use finger tricks: flick U with your index fingers and keep your thumbs on the front face.",
      "Cut regrips by starting algorithms from a comfortable grip.",
      "Turn lightly; pushing hard slows you down and causes lockups.",
    ],
    drill:
      "Do R U R' U' as fast as you cleanly can, 100 reps a day in short bursts, then the same for your most common algorithms.",
    keep: "Your hands are fast enough for your goal. Lookahead and recognition matter more now.",
    sources: [SOURCES.fingerTricks, SOURCES.turningSpeed],
  },
};
