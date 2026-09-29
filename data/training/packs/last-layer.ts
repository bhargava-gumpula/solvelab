import { SOURCES } from "../sources";
import type { AspectPack } from "../types";

export const ollExecution: AspectPack = {
  id: "oll-execution",
  aspectId: "oll",
  title: "Faster OLL",
  summary: "Recognising the case from where your hands already are, and executing without lockups.",
  levels: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12"],
  why: "OLL time is recognition plus execution, and for most people it is mostly recognition — a second spent turning the cube round looking at the top face, then a fast algorithm.",
  lessons: [
    {
      id: "oll-by-shape",
      title: "Recognise by shape, not by number",
      takeaway:
        "The 57 cases fall into a handful of visual families. Learning the families is what makes recognition instant.",
      minutes: 4,
      body: [
        "The last layer is the yellow one on top, with the white cross on the bottom where you built it. Every face, shape and sticker in these lessons is described from that hold.",
        "OLL numbers are a way of writing cases down, not a way of seeing them. What you actually recognise is a shape on the top face: a dot, a line, an L, a cross, and within those, where the corner stickers point.",
        "Grouping by shape has two benefits. Recognition becomes a two-step read — the shape narrows it to a few, then one corner sticker decides — which is much faster than comparing against 57 pictures. And when you are learning, cases in the same family share fingertricks, so they go in as a group rather than one at a time.",
        "The families worth having in your head: all edges oriented (the 'cross' cases, seven of them, which are also the second step of 2-look), edges forming a line, edges forming an L, and the dot cases where no edge is oriented. That is the first split; everything after it is corners.",
      ],
      checkpoint:
        "You can say which family a case is in before you have worked out which case it is.",
    },
    {
      id: "oll-angle",
      title: "Recognise from where you are standing",
      takeaway: "Turning the cube to see a case costs more than the algorithm saves.",
      minutes: 3,
      body: [
        "The common failure is learning each case from one angle — usually the way it is drawn in the list — and then rotating the cube during solves until it matches. That rotation is half a second, every solve.",
        "Every OLL can be recognised from any of the four angles, and executed from any of them too, sometimes with a different algorithm and sometimes with the same one after an adjustment of the top layer. The work is in the reps, not the theory.",
        "The way in is to drill your slower cases from all four angles specifically, rather than hoping normal solving covers it. Normal solving gives each angle a quarter of the reps and lets you rotate out of the awkward ones.",
      ],
    },
    {
      id: "oll-lockups",
      title: "Lockups are a turning problem",
      takeaway:
        "If an algorithm locks up, the fix is slower, more accurate turning, not a different cube.",
      minutes: 3,
      body: [
        "A locked-up algorithm costs more than a slow one, because you lose the time and the rhythm. It is tempting to blame hardware, but on a decent modern cube, lockups on ordinary triggers almost always mean the turns are not finishing before the next one starts.",
        "The fix is the same one that works for turning speed generally: turn calmly and accurately, keeping your hands close to a neutral position, and let speed come from not wasting movement rather than from force. Aggressive turning produces lockups which cost more than the aggression gains.",
        "Practically: take the algorithm you lock up on, do it twenty times slowly and perfectly, then twenty times slightly faster, and stop at the speed where it is still clean. That speed is your real speed for that case, and it will rise.",
      ],
      checkpoint: "You have no algorithm that you regularly have to restart.",
    },
  ],
  drills: [
    {
      id: "oll-isolated",
      title: "OLL only",
      purpose:
        "Separates OLL from everything around it, so recognition time is visible instead of buried in the solve.",
      rules: [
        "Use scrambles that leave only the last layer, with the corners and edges still to orient.",
        "Start the timer, recognise, execute, stop.",
        "Note any case that takes noticeably longer than the rest.",
      ],
      dose: "Twelve attempts a session.",
      signal:
        "The spread narrows. A consistent OLL time matters more than a fast average one, because the slow cases are the ones costing you.",
      exerciseId: "oll_only",
    },
    {
      id: "oll-four-angles",
      title: "Four angles",
      purpose:
        "Removes the rotation-to-recognise habit, which normal solving will never remove on its own.",
      rules: [
        "Pick one case. Set it up and solve it. Then set it up rotated by a quarter turn and solve it again, without rotating the cube back.",
        "All four angles for each case.",
        "Start with the cases you know you rotate for.",
      ],
      dose: "Five cases a session.",
      signal: "You stop turning the cube to look at the top face.",
    },
    {
      id: "oll-slow-clean",
      title: "Slow and clean",
      purpose: "Fixes lockups by rebuilding the algorithm at a speed where every turn finishes.",
      rules: [
        "Take one algorithm you lock up on. Execute it twenty times slowly and perfectly.",
        "Speed up a little. Twenty more. If a lockup happens, drop back a step.",
        "Stop at the fastest clean speed, not the fastest speed.",
      ],
      dose: "Two or three algorithms a session.",
      signal: "The case stops appearing in your list of slow ones.",
    },
  ],
  mistakes: [
    "Learning cases by number rather than by what they look like.",
    "Rotating the cube to bring a case to the angle you learned it at.",
    "Drilling the cases you are already good at, because they are more satisfying to practise.",
    "Blaming hardware for lockups on standard triggers.",
  ],
  sources: [SOURCES.ollAlgs, SOURCES.turningSpeed, SOURCES.jpermCfop],
};

export const ollAlgorithms: AspectPack = {
  id: "oll-algorithms",
  aspectId: "oll_algorithms",
  title: "Learning OLL without drowning",
  summary: "How to take on 57 cases so they stay learned, and how to pick which ones first.",
  levels: ["sub25", "sub20", "sub15", "sub12"],
  why: "A few cases you half-know cost more than the whole set being slightly slow. If one OLL in eight takes twice as long as the rest, that is where your last-layer time is going.",
  lessons: [
    {
      id: "oll-when",
      title: "When full OLL is worth it",
      takeaway:
        "Around twenty seconds. Before that there is more time available elsewhere for less work.",
      minutes: 3,
      body: [
        "Full OLL replaces two algorithms with one on most solves, which is worth roughly a second. That is a real saving and it is also 47 more algorithms than 2-look, so the question is what else a second of improvement would cost you.",
        "Below about twenty-five seconds there is usually a cheaper second available: pause-free F2L, a shorter cross, full PLL. Most guides put full PLL before full OLL for this reason — PLL is a third of the size and its cases come up twice as often each.",
        "Around twenty seconds, and certainly on the way to fifteen, OLL becomes the thing holding the last layer back and the trade flips. That is the point to start.",
      ],
    },
    {
      id: "oll-groups",
      title: "Learn in groups that look alike",
      takeaway:
        "Take cases in families. Shared shapes and shared fingertricks make five cases easier than five separate cases.",
      minutes: 4,
      body: [
        "Learning in the numbered order is the worst order, because consecutive numbers rarely look or feel alike. Learning by family means each new case reinforces the recognition of the ones next to it.",
        "A sensible order: start with the seven cases where all four edges already face up. You know them from 2-look, so the job there is making them fast, or swapping in a better algorithm where yours is slow. Next take the cases built from triggers you already know: the T shapes, P shapes, fish, squares and knight moves. After that, work through the other families one at a time: lines, L shapes, lightning bolts and the rest. Leave the dots until last. They are easy to spot, but the eight of them are harder to tell apart from each other, and their algorithms are long and awkward to execute.",
        "Take three to five cases at a time, and do not start the next group until the current one turns up in real solves without you thinking. Learning twenty at once reliably produces twenty you half-know.",
      ],
      checkpoint: "Every case you have learned appears in solves without hesitation.",
    },
    {
      id: "oll-retention",
      title: "Making them stick",
      takeaway:
        "Ten to twenty solves with a case is what makes it yours. Practise the ones you get wrong more than the ones you get right.",
      minutes: 4,
      body: [
        "A new algorithm needs roughly ten to twenty uses before the hands stop needing the head. Until then it is knowledge, not skill, and it will be slow in a solve even when it is fast in a drill.",
        "The efficient way to spend those reps is spaced repetition, and the rule is simple enough to do by hand: a case you get wrong comes back soon, a case you get right comes back later. Trainers that do this automatically exist; a notebook with 'easy / hard / needs work' beside each case does nearly as well.",
        "The step people skip is transfer. A case that is fast in a trainer is not learned until it is fast in an actual solve, where it arrives unannounced at the end of an F2L you were concentrating on. After a drilling session, do ordinary solves and watch for the cases you just practised.",
        "When you learn a case, check the algorithm is one you want to keep. Relearning an algorithm later because the first one was awkward costs more than picking well now. Prefer solutions that run on R and U moves with few regrips.",
      ],
      checkpoint:
        "You can list which cases you are currently weak on, from evidence rather than feel.",
    },
  ],
  drills: [
    {
      id: "oll-weak-list",
      title: "Build the weak list",
      purpose:
        "You cannot practise your bad cases until you know which they are, and memory is unreliable about this.",
      rules: [
        "Do a session of OLL-only attempts and write down every case that felt slow.",
        "Keep the list where you practise. Add to it when a case surprises you in a solve.",
        "Work only from the list. Cross a case off when it stops appearing.",
      ],
      dose: "Rebuild the list every fortnight.",
      signal: "The list gets shorter, and the new entries are different cases each time.",
      exerciseId: "oll_only",
    },
    {
      id: "oll-group-of-four",
      title: "A group of four",
      purpose:
        "Keeps new learning at a size that survives, and uses family resemblance instead of fighting it.",
      rules: [
        "Choose four cases that look alike. Learn all four before doing anything else with them.",
        "Drill them mixed together so you have to recognise, not just execute.",
        "Do twenty normal solves afterwards and note whether they showed up cleanly.",
      ],
      dose: "One group a week.",
      signal: "Cases from last week's group appear in solves without a pause.",
    },
  ],
  mistakes: [
    "Learning full OLL before full PLL.",
    "Taking on twenty cases at once and ending up with twenty you half-know.",
    "Drilling cases in a trainer and never checking they survive a real solve.",
    "Keeping a bad algorithm because relearning feels like going backwards.",
  ],
  sources: [SOURCES.ollAlgs, SOURCES.subTwenty, SOURCES.getFaster, SOURCES.jpermCfop],
};

export const ollIntoPll: AspectPack = {
  id: "oll-into-pll",
  aspectId: "oll_to_pll",
  title: "Reading PLL while OLL finishes",
  summary: "The last pause in the solve, and the two-sided recognition that removes it.",
  levels: ["sub25", "sub20", "sub15", "sub12", "sub10"],
  why: "OLL ends, you stop, you turn the cube to look at the sides, you find the PLL, you start. That stop is half a second or more, and it is entirely avoidable because the information appears before the algorithm ends.",
  lessons: [
    {
      id: "pll-two-sided",
      title: "Two-sided recognition",
      takeaway:
        "Every PLL can be told apart from two adjacent faces. If you need three, you are turning the cube for information you already had.",
      minutes: 5,
      body: [
        "The decisive information for PLL is on the side stickers, not the top face. Headlights — two matching corner stickers with a different one between them — blocks of three, and bars tell you almost everything.",
        "There are 21 cases and only two faces visible without moving, which sounds like it should not be enough. It is: every case is distinguishable from two adjacent sides, and lists of exactly which patterns mean which case are freely available. It takes a few weeks to internalise and it is permanent once it is there.",
        "The practical form is a decision tree rather than a lookup. Look at the two faces. How many pairs of headlights? Are there blocks? That narrows twenty-one cases to two or three, and one more sticker decides.",
        "Once it is two-sided, the recognition can happen while your hands are still finishing OLL, because the side stickers you need are visible throughout.",
      ],
      checkpoint: "You can name any PLL from two adjacent faces without turning the cube.",
    },
    {
      id: "pll-during-oll",
      title: "Start reading before OLL ends",
      takeaway: "Your eyes should leave the top face before the last move of the OLL algorithm.",
      minutes: 3,
      body: [
        "Once an OLL algorithm is running, your hands do not need supervision — that is what it means for it to be learned. So the last few moves are free attention, in exactly the same way the last F2L pair is.",
        "The habit: as you begin the last trigger of the OLL, move your eyes to the side stickers. You will not always get the full case, because the final moves change what is where, but you will usually get the family — adjacent corner swap, diagonal corner swap, edges only — and that is most of the work.",
        "How early you can read it depends on how the algorithm ends. Once the last move that is not a U turn is done, the PLL is fixed: any U turns after it only change the angle, so read the case before them and allow for the turn. Algorithms that finish on R or F keep moving side stickers until the very last move, so on those the picture is still changing as you read it. Knowing which of your algorithms end which way is worth noticing.",
      ],
    },
    {
      id: "pll-auf",
      title: "The final turn is part of the case",
      takeaway:
        "The U turn at the end is not an afterthought. Predicting it removes a pause after the algorithm as well as before it.",
      minutes: 3,
      body: [
        "Most PLL algorithms finish with the last layer solved but rotated, needing a U, U' or U2 to finish. If you wait until the algorithm ends to work out which, you have added a small pause at the very end of the solve, where it is most annoying.",
        "The turn is determined by the case and the angle you executed from, so it can be known in advance. Some people learn it per case; others read it from a single sticker as the algorithm finishes. Either works; not deciding until the end does not.",
        "The same applies to the alignment before the algorithm. Recognition includes knowing which way to hold the case, and if you are doing a trial U turn to see whether it looks right, that is recognition that has not finished.",
      ],
      checkpoint: "You know the final U turn before the algorithm ends.",
    },
  ],
  drills: [
    {
      id: "pll-predict",
      title: "Predict the PLL",
      purpose:
        "Builds the read-during-execution habit directly. Calling it out loud forces the decision to happen before the algorithm ends.",
      rules: [
        "Solve to OLL. Start the OLL algorithm and, as it runs, say which PLL you expect.",
        "Finish and check.",
        "Untimed. Being wrong is information; being silent is a wasted rep.",
      ],
      dose: "Twenty solves a session.",
      signal: "Your calls come earlier in the algorithm and are right more often.",
    },
    {
      id: "pll-two-face",
      title: "Two faces only",
      purpose: "Removes the crutch of looking around, which is the thing keeping recognition slow.",
      rules: [
        "Set up a PLL case. Look at exactly two adjacent faces and the top.",
        "Name the case before touching anything. Do not turn the cube.",
        "Check, then repeat with the next case.",
      ],
      dose: "All 21 cases, a few times a week, until it is automatic.",
      signal: "You stop wanting to turn the cube during PLL recognition.",
      exerciseId: "pll_only",
    },
    {
      id: "pll-oll-pll-joined",
      title: "OLL into PLL, joined",
      purpose:
        "Measures the seam. Practising OLL and PLL separately hides the exact thing that is slow.",
      rules: [
        "Use a scramble that leaves the last layer.",
        "Do OLL and PLL as one continuous thing with no stop between them.",
        "Compare against your separate OLL and PLL times; the extra is the join.",
      ],
      dose: "Ten attempts a session.",
      signal: "The combined time approaches the sum of the parts.",
      exerciseId: "oll_pll_only",
    },
  ],
  mistakes: [
    "Turning the cube to look at three or four sides instead of reading the two you can see.",
    "Waiting until the OLL algorithm has completely finished before looking anywhere.",
    "Doing a trial U turn to check the alignment.",
    "Working out the final U turn after the algorithm instead of before.",
  ],
  sources: [SOURCES.sarahPll, SOURCES.twoSidedPll, SOURCES.predictPll, SOURCES.pllRecognitionGuide],
};

export const pllExecution: AspectPack = {
  id: "pll-execution",
  aspectId: "pll",
  title: "Faster PLL",
  summary: "Getting most of your cases under a second, and finding the ones that are not.",
  levels: ["sub30", "sub25", "sub20", "sub15", "sub12"],
  why: "PLL is the most repeated part of the solve — 21 cases, every solve, always the same job. Time here comes back at a better rate than almost anywhere else, and it is easy to measure.",
  lessons: [
    {
      id: "pll-target",
      title: "What good looks like",
      takeaway:
        "At a high level most PLLs are under a second. The useful target is not the average but the worst few.",
      minutes: 3,
      body: [
        "Fast solvers describe roughly eighty per cent of their PLLs being executed in under a second, with most cases landing somewhere between about 0.8 and 1.4 seconds including recognition. That is a useful shape to aim at, but the number that matters is the spread rather than the mean.",
        "If nineteen of your cases take a second and two take three, your PLL average looks reasonable and your solves do not, because those two come up often enough to matter and they come with a pause as well as a slow execution.",
        "So the work is not 'get faster at PLL'. It is 'find the cases that are much slower than the rest, and fix those specifically'. Everything else is maintenance.",
      ],
      checkpoint: "You can name your three slowest PLLs.",
    },
    {
      id: "pll-algorithm-choice",
      title: "Choosing algorithms you can actually execute",
      takeaway:
        "A shorter algorithm with a regrip in the middle loses to a longer one that runs off the fingers.",
      minutes: 4,
      body: [
        "Algorithm lists usually rank by move count, which is the wrong axis for the last layer. What matters is how long it takes your hands, and that is about grips and triggers more than length.",
        "The usual preference: sequences built from R, U and occasional F moves that you can execute in one grip; avoid ones that need you to rotate or re-place your hands mid-algorithm. A fifteen-move algorithm with a clean rhythm beats a thirteen-move one with a pause in it.",
        "This is worth revisiting for your worst cases specifically. People often find that a case they have always been slow at has a much more comfortable alternative that they never tried because the one they learned was 'fine'.",
        "One honest caveat: switching an algorithm costs you the ten to twenty reps of relearning, and you will be slower on that case for a week. It is still usually worth it for a case you will execute tens of thousands of times.",
      ],
    },
    {
      id: "pll-under-pressure",
      title: "Simple beats clever when it counts",
      takeaway:
        "Under pressure, stick to the movements you always use. Fancy fingertricks fail when you are nervous.",
      minutes: 2,
      body: [
        "The last layer is where a solve is won or lost in a competition, because it is the end and you know what your time will be. That is exactly the moment when an unusual fingertrick goes wrong.",
        "The advice from people who compete is to keep the movements standard and repeatable, and to save the clever variants for practice. A solve lost to a popped or misaligned layer costs more than the tenth of a second the variant would have saved.",
      ],
    },
  ],
  drills: [
    {
      id: "pll-full-set",
      title: "The whole set, timed",
      purpose:
        "Gives you a number per case, which is the only way to know which ones are actually slow rather than which ones feel slow.",
      rules: [
        "Go through all 21 cases, timing each individually.",
        "Write the times down. Do not rely on feel.",
        "Repeat monthly and compare.",
      ],
      dose: "One pass through the set, once a fortnight.",
      signal: "The slowest case and the fastest case get closer together.",
      exerciseId: "pll_only",
    },
    {
      id: "pll-worst-three",
      title: "The worst three",
      purpose: "Concentrates practice where the time actually is instead of spreading it evenly.",
      rules: [
        "Take the three slowest cases from your timed pass.",
        "For each: check whether a better algorithm exists, then drill it slowly and cleanly before speeding up.",
        "Do not practise the other eighteen this session.",
      ],
      dose: "Fifteen minutes a session until they leave the list.",
      signal: "Next month's timed pass has three different cases at the bottom.",
    },
  ],
  mistakes: [
    "Practising the whole set evenly when three cases hold the time.",
    "Choosing algorithms by move count instead of by how they feel.",
    "Never timing individual cases, so the slow ones stay invisible.",
    "Using fancy variants in competition.",
  ],
  sources: [SOURCES.subTen, SOURCES.pllRecognitionGuide, SOURCES.turningSpeed],
};

export const pllAlgorithms: AspectPack = {
  id: "pll-algorithms",
  aspectId: "pll_algorithms",
  title: "Learning full PLL",
  summary: "Twenty-one cases, in an order that makes each one easier than the last.",
  levels: ["sub45", "sub30", "sub25", "sub20"],
  why: "Two-look PLL costs an extra algorithm on most solves. Full PLL is the single best-value algorithm set in CFOP: 21 cases, each used constantly, and the recognition you build carries into everything else in the last layer.",
  lessons: [
    {
      id: "pll-why-first",
      title: "Why PLL before OLL",
      takeaway:
        "A third of the size, twice the use per case, and the recognition is more transferable.",
      minutes: 3,
      body: [
        "If you are choosing between full PLL and full OLL, take PLL. It is 21 cases against 57, so it is done in a fraction of the time, and each case appears more often, so the reps arrive faster and the learning sticks.",
        "There is a second reason that is easy to miss: PLL recognition teaches you to read side stickers, which is the same skill you use for reading the cube during F2L and for predicting cases. OLL recognition is more self-contained.",
        "Keep 2-look as a fallback while you learn. A case you half-know is slower than two algorithms you know, so use the new one when you are confident and fall back when you are not, until the fallback stops being needed.",
      ],
    },
    {
      id: "pll-order",
      title: "An order that builds on itself",
      takeaway:
        "Start with the cases you already have from 2-look, then take groups that share recognition.",
      minutes: 4,
      body: [
        "You already know six cases from 2-look PLL: the T and Y perms for the corners and the four edge-only cases (Ua, Ub, H and Z). If you learned the A perms and E perm for the corners instead, count those. That is six or more of the twenty-one before you start, and they anchor the recognition for the rest.",
        "A workable order after that: the A perms and the J perms (Jb and F are the T perm with a different start, so they come quickly); then the G perms as a group of four, which are the ones people most often leave until last and most often regret leaving; then the R perms; and E, V and the two N perms last, the N perms because they are rare and long.",
        "Take the G perms as a set rather than individually. They are four variations on one idea and learning them together is what makes them distinguishable — learning one now and one in three months guarantees you will confuse them.",
      ],
      checkpoint: "You can execute every case you have learned without a fallback.",
    },
    {
      id: "pll-recognition-first",
      title: "Learn to see it before you learn to solve it",
      takeaway: "The algorithm is the easy half. Spend the time on what the case looks like.",
      minutes: 3,
      body: [
        "It is tempting to measure progress in algorithms memorised, because that is countable. But in a solve, the time goes on recognition: a case you can execute in one second but need two seconds to identify is a three-second PLL.",
        "So when you take on a case, start with the picture. What does it look like from the two faces you will actually see? What distinguishes it from the case it resembles most? Only then learn the moves.",
        "A practical test: set up the case, look away, look back, and see whether you know it instantly. If you have to work it out, you have learned an algorithm and not a case.",
      ],
    },
  ],
  drills: [
    {
      id: "pll-group-learn",
      title: "One group at a time",
      purpose:
        "Groups that share recognition are learned together or confused forever. This is especially true of the G perms.",
      rules: [
        "Take a family — the three or four cases that look alike — and learn all of them before moving on.",
        "Drill them mixed, so you have to tell them apart rather than just execute.",
        "Do twenty ordinary solves before starting the next family.",
      ],
      dose: "One family a week.",
      signal: "You stop mixing up cases within a family.",
    },
    {
      id: "pll-recognition-flash",
      title: "Recognition without execution",
      purpose:
        "Separates the two halves so the harder one gets its own practice, which sharing a drill never allows.",
      rules: [
        "Set up a random case. Look at two faces. Name it. Do not solve it.",
        "Reset and repeat. You are training the eyes only.",
        "Thirty cases takes about five minutes.",
      ],
      dose: "Five minutes at the start of a session.",
      signal:
        "Naming becomes instant, and your solve-time PLL drops without the algorithms changing.",
    },
  ],
  mistakes: [
    "Learning full OLL first.",
    "Learning one G perm now and the rest later.",
    "Measuring progress in algorithms memorised rather than cases recognised.",
    "Dropping the 2-look fallback before the new case is reliable.",
  ],
  sources: [SOURCES.subTwenty, SOURCES.sarahPll, SOURCES.twoSidedPll, SOURCES.jpermCfop],
};
