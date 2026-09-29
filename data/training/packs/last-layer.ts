import { SOURCES } from "../sources";
import type { AspectPack } from "../types";

export const ollExecution: AspectPack = {
  id: "oll-execution",
  aspectId: "oll",
  title: "Faster OLL",
  summary: "Recognising the case from where your hands already are, and executing without lockups.",
  levels: ["sub45", "sub20"],
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
      takeaway:
        "Both 2-look reads work from any angle. Line the case up by turning the top layer, not by turning the cube round to look.",
      minutes: 3,
      body: [
        "On 2-look OLL you read the top twice, and neither read needs a particular angle. First the edges: no yellow edges on top is a dot, two opposite each other is a line, and two side by side is an L. Then, with the cross made, the corners: count how many corners have their yellow facing up. None means H or Pi, one means Sune or Antisune, and two means Headlights, T or Bowtie. The side stickers then decide between them.",
        "The common failure is learning each case the way it is drawn and then turning the cube round in your hands until it matches the picture. With two looks a solve, that can be two rotations a solve. The count tells you the family from any side; the angle only tells you which way to turn the top layer before you start, and turning the top is a flick where a rotation is a regrip.",
        "So practise it on purpose rather than hoping normal solving covers it. Set up a case, turn the top a random amount, and name the case and the turn you need before touching the cube. Normal solving gives each angle a quarter of the reps and lets you rotate out of the awkward ones. The habit carries straight over if you learn full OLL later.",
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
        "On 2-look OLL, a few short algorithms do most of the work. Seven solves in eight need the line or the L algorithm, F R U R' U' F' or f R U R' U' f', and both have R U R' U' in the middle, so a lockup there comes back again and again. After that the corner step is shared almost evenly: Sune, Antisune, Pi, Headlights, T and Bowtie each come up equally often and H half as often, so look next at whichever corner algorithm you restart most.",
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
  levels: ["sub30", "sub25", "sub20"],
  why: "A few cases you half-know cost more than the whole set being slightly slow. If one OLL in eight takes twice as long as the rest, that is where your last-layer time is going.",
  lessons: [
    {
      id: "oll-when",
      title: "When full OLL is worth it",
      takeaway:
        "Optional in the Sub-20 course, expected in Sub-15, and always after full PLL. 2-look OLL is enough to reach sub-20.",
      minutes: 3,
      body: [
        "Full OLL replaces two algorithms with one on most solves, which is worth roughly a second. That is a real saving and it is also 47 more algorithms than 2-look, so the question is what else a second of improvement would cost you.",
        "Until you are close to twenty seconds there is almost always a cheaper second somewhere else: pause-free F2L, a planned cross, and above all full PLL, which comes first. PLL is about a third of the size and each of its cases comes up about three times as often, so it pays back sooner. You can reach sub-20 on 2-look OLL, so nothing forces the switch early.",
        "In the Sub-20 course you can start if you want to, in small groups, beginning with the cases you already know from 2-look. In the Sub-15 course it stops being optional: once your last layer takes about five or six seconds and the second look is the biggest leak in it, full OLL is the standard fix. Keep 2-look as the fallback while you learn, and switch over one case at a time.",
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
        "A sensible order: start with the seven cases where all four edges already face up. You know them from 2-look, so the job there is making them fast, or swapping in a better algorithm where yours is slow. Your 2-look edge algorithms already count too: held the usual way, with the two right-hand corners also facing up and both left-hand corners showing their yellow on the left side, F R U R' U' F' solves OLL 45, one of the two T shapes, in one go, and f R U R' U' f' does the same for OLL 44, one of the P shapes. Next take the cases built from triggers you already know: the T shapes, P shapes, fish, squares and knight moves. After that, work through the other families one at a time: lines, L shapes, lightning bolts and the rest. Leave the dots until last. They are easy to spot, but the eight of them are harder to tell apart from each other, and their algorithms are long and awkward to execute.",
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
  levels: ["sub20", "sub15"],
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
  ],
  drills: [
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
  summary: "Getting your cases quick and even, and finding the ones that are not.",
  levels: ["sub30", "sub25", "sub15"],
  why: "PLL is the most repeated part of the solve — 21 cases, every solve, always the same job. Time here comes back at a better rate than almost anywhere else, and it is easy to measure.",
  lessons: [
    {
      id: "pll-target",
      title: "What good looks like",
      takeaway:
        "Most PLLs under a second is the sub-10 standard. At any level, the useful target is not the average but the worst few.",
      minutes: 3,
      body: [
        "Around sub-10, fast solvers execute roughly eighty per cent of their PLLs in under a second; add recognition and most cases land somewhere between about 0.8 and 1.4 seconds. You do not need that yet. On the way down, having most cases under two seconds including recognition is a good mark for sub-15, and about one to one and a half seconds for sub-12. At every level, though, the number that matters is the spread rather than the mean.",
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
    {
      id: "ll-random-auf-log",
      title: "Random angle, every miss logged",
      purpose:
        "Drills the last layer the way it arrives in a solve, at a random angle, and sorts each mistake by what went wrong, because each kind needs a different fix.",
      rules: [
        "Work on last-layer states only: the OLL + PLL test's scrambles for random ones, or your own set-ups of the cases you are working on.",
        "Before every rep, turn the top layer a random amount (U, U', U2 or not at all), so each rep includes recognising the case, choosing the turn before the algorithm, and the algorithm itself.",
        "Give each case you are working on ten to twenty reps.",
        "Log every miss as one of three kinds. Recognition: slow or wrong to name the case or its angle. Recall: you knew the case but the algorithm did not come. Execution: you knew both and your hands fumbled or locked up.",
        "Once a week, read the log and fix each kind its own way: a new cue, one sticker or pattern that settles the case, for recognition; spaced reps, where a case you miss comes back sooner, for recall; a different fingertrick or algorithm, drilled slowly, for execution.",
      ],
      dose: "Ten to twenty reps per case, a few cases a session. Read the log once a week.",
      signal:
        "The log gets shorter, and a case you have fixed does not come back under a different kind of miss.",
      exerciseId: "oll_pll_only",
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
  levels: ["sub60", "sub45"],
  why: "Two-look PLL costs an extra algorithm on most solves. Full PLL is the single best-value algorithm set in CFOP: 21 cases, each used constantly, and the recognition you build carries into everything else in the last layer.",
  lessons: [
    {
      id: "pll-why-first",
      title: "Why PLL before OLL",
      takeaway:
        "About a third of the size, about three times the use per case, and the recognition carries further. Start in Sub-45 if you like; finish in Sub-30.",
      minutes: 3,
      body: [
        "If you are choosing between full PLL and full OLL, take PLL. It is 21 cases against 57, so it is done in a fraction of the time, and each case comes up about three times as often, so the reps arrive faster and the learning sticks.",
        "You can make a start in the Sub-45 course with the cases that come quickly, and aim to have the whole set by the end of the Sub-30 course. Take about two new cases a day at most; more than that and they blur together. Learn each one as a picture you can recognise without walking round the cube to check; a turn of the top to see it from a familiar side is fine for now. Reading every case from just the two sides facing you is the Sub-15 step.",
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
        "A workable order after that: the A perms and the J perms (Jb and F are the T perm with a different start, so they come quickly); then the G perms as a group of four, which are the ones people most often leave until last and most often regret leaving; then the R perms; and E, V and the two N perms last, the N perms because they are rare and long. If you are starting early, in Sub-45, the A perms and J perms are a natural place to stop for now; the rest can wait for Sub-30.",
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
        "So when you take on a case, start with the picture. What does it look like from the side you usually meet it on? What distinguishes it from the case it resembles most? Only then learn the moves.",
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
      dose: "About two new cases a day at most, and one family at a time.",
      signal: "You stop mixing up cases within a family.",
    },
    {
      id: "pll-recognition-flash",
      title: "Recognition without execution",
      purpose:
        "Separates the two halves so the harder one gets its own practice, which sharing a drill never allows.",
      rules: [
        "Set up a random case. Name it without turning the cube; a turn of the top is allowed. Do not solve it.",
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
    "Cramming five new cases into one day and confusing all of them.",
    "Learning one G perm now and the rest later.",
    "Measuring progress in algorithms memorised rather than cases recognised.",
    "Dropping the 2-look fallback before the new case is reliable.",
  ],
  sources: [SOURCES.subTwenty, SOURCES.sarahPll, SOURCES.twoSidedPll, SOURCES.jpermCfop],
};
