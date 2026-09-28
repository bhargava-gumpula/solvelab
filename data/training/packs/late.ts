import { SCRAMBLE_HOLD, SOLVING_ROTATION } from "@/lib/config/cube";
import { SOURCES } from "../sources";
import type { LevelPack } from "../types";

/*
 * Packs written for one stretch of the road rather than one part of the
 * profile: 30 → 20 s, 20 → 15 s, 15 → 10 s and sub-10.
 */

export const aufBothEnds: LevelPack = {
  id: "auf-both-ends",
  title: "The turn before, and the turn after",
  summary: "Adjusting the top layer is part of every last-layer case. Stop treating it as a pause.",
  levels: ["sub30", "sub25"],
  why: "Almost every OLL and PLL starts with a turn of the top to line the case up and ends with one to finish. Two small hesitations a solve, every solve, add up to around half a second — and they are among the easiest pauses to remove.",
  lessons: [
    {
      id: "auf-after",
      title: "Know the last turn before you need it",
      takeaway:
        "Every PLL ends with U, U', U2 or nothing, and one sticker tells you which before you start.",
      minutes: 4,
      body: [
        "The final top turn is decided the moment you recognise the case and choose the angle to do it from. Waiting until the algorithm ends to look is where the pause comes from.",
        "The standard trick is a reference sticker: for each PLL, one sticker on the front or right face that tells you where the layer will end up. If it matches the front centre now, there will be no final turn; if it matches the back, it will be a U2; and so on. Find one for each of your algorithms and use the same one every time.",
        "It takes some upfront work per case, and then it is free forever. This is widely described as the single most useful AUF skill to have.",
      ],
      checkpoint: "For your five most common PLLs, you know the final turn before starting.",
    },
    {
      id: "auf-before",
      title: "Recognise and line up in one step",
      takeaway:
        "Every case can appear at four angles. Find the case and the smallest turn together.",
      minutes: 4,
      body: [
        "A case can show up turned four ways from the angle you learned it. People fall into one of two habits: turning the top until it looks familiar, then recognising; or recognising from wherever it is, then turning. The second is faster, and it is a learnable skill.",
        "Aim to know each case from every angle, and to know the smallest turn that brings it to your starting angle. Some algorithms have alternatives that start from a different angle — the algorithm bank shows the turn each one needs from the picture — and choosing the one that needs no turn at all removes the step entirely.",
        "There is a further trick at a higher level: starting the algorithm with a slightly different move so that the last turn cancels. It is worth knowing it exists; only adopt it for a case after timing it against the plain version.",
      ],
    },
    {
      id: "auf-fingers",
      title: "Turns that flow out of the algorithm",
      takeaway: "The final turn should use whichever finger is already in place, not a regrip.",
      minutes: 3,
      body: [
        "Different algorithms leave your hands in different places. A final U2 can be two flicks with one index finger, or one flick from each hand; a U' can be a left-index push. The best choice is whichever one your hands are already set up for when the algorithm ends.",
        "Go through your most common cases and deliberately decide the finger trick for the final turn. It takes a session and removes a small regrip from nearly every solve.",
        "Avoid anything exotic here. The last turn is the moment nerves bite hardest, and a simple, repeatable movement is worth more than a slightly faster clever one.",
      ],
    },
  ],
  drills: [
    {
      id: "auf-call",
      title: "Call the last turn",
      purpose:
        "Forces the decision to happen before the algorithm ends, which is where the time is.",
      rules: [
        "Solve to PLL. Recognise, and say the final turn out loud before starting.",
        "Do the algorithm and check.",
        "Count how many you got right out of twenty.",
      ],
      dose: "Twenty cases a session for a week.",
      signal:
        "You are right nearly every time, and the end of each solve stops having a pause in it.",
      exerciseId: "pll_only",
    },
    {
      id: "auf-no-turn-first",
      title: "No turning to recognise",
      purpose: "Builds recognition from every angle, which removes the lining-up turn.",
      rules: [
        "Solve to OLL or PLL. Name the case before touching the top layer.",
        "Then do the smallest turn and the algorithm.",
        "If you had to turn the top to recognise it, note the case.",
      ],
      dose: "Twenty cases.",
      signal: "Your list of cases you turn to recognise gets shorter each week.",
      exerciseId: "oll_pll_only",
    },
  ],
  mistakes: [
    "Looking to see which final turn is needed after the algorithm has finished.",
    "Turning the top until a case looks familiar before recognising it.",
    "Regripping for the final turn instead of using the finger already in place.",
    "Adopting a clever AUF trick without timing it against the plain version.",
  ],
  sources: [SOURCES.aufTips, SOURCES.pllRecognitionGuide, SOURCES.sarahPll],
};

export const subTwentyBudget: LevelPack = {
  id: "sub-20-budget",
  title: "Where 20 seconds goes",
  summary: "The shape of a sub-20 solve, part by part, and how to find which part is over budget.",
  levels: ["sub30", "sub25"],
  why: "Twenty seconds feels like one number, but it is a budget spread across the cross, four pairs and the last layer. Most people between 30 and 20 are roughly on budget in some parts and well over in one — and it's rarely the one they think.",
  lessons: [
    {
      id: "budget-shape",
      title: "The shape of a sub-20 solve",
      takeaway: "Roughly two seconds of cross, ten or eleven of F2L, and six of last layer.",
      minutes: 4,
      body: [
        "A widely quoted breakdown of a sub-20 average is a cross of about two seconds, F2L of about ten or eleven, and a last layer of about six. The road on Learn shows the same split worked out from this app's own goals, including the pause in front of each part.",
        "Two things follow from that shape. F2L is more than half of it, so a small improvement there is worth more than a large one anywhere else. And six seconds of last layer is achievable with two-look OLL and full PLL — you don't need full OLL to get here.",
        "Four pairs in ten or eleven seconds is about two and a half seconds a pair including finding it. That is the number to hold in your head during slow solves.",
      ],
      checkpoint: "You know your own cross, F2L and last-layer times, not just your average.",
    },
    {
      id: "budget-overspend",
      title: "Where the time usually leaks",
      takeaway: "Pauses between pairs first, then the last layer's recognition, then the cross.",
      minutes: 4,
      body: [
        "Across most people at this level, the biggest leak is pausing between F2L pairs. It doesn't feel like much — half a second here and there — but four of them is two seconds, which is the difference between 22 and 20.",
        "The next is recognition in the last layer: turning the cube to look at an OLL or PLL, or a pause between OLL and PLL. Execution speed is rarely the problem at this level; recognition usually is.",
        "The cross is usually the smallest leak, but it is the easiest to fix: a cross planned fully in inspection, in eight moves or fewer, starts every solve without hesitation.",
      ],
    },
    {
      id: "budget-measure",
      title: "Measure it rather than guess",
      takeaway:
        "The skill tests exist to show exactly which part is over. Use them before choosing what to practise.",
      minutes: 3,
      body: [
        "Guessing where your time goes is unreliable: people consistently overestimate their last layer and underestimate their pauses, because pauses don't feel like time passing.",
        "The Coach tests measure each part in isolation and the joins between them. Taking the core tests once gives you a solve profile with each part marked against the sub-20 goal, and the packs it recommends are ordered by how far over budget each part is.",
        "Retake the test for the part you are working on every couple of weeks. The number moving is the only reliable sign the practice is working.",
      ],
    },
  ],
  drills: [
    {
      id: "budget-split-test",
      title: "Split one average",
      purpose:
        "Turns a vague sense of 'slow F2L' into a number you can compare against the budget.",
      rules: [
        "Take the cross, F2L and last-layer tests on Coach.",
        "Compare each with the sub-20 budget: about 2, 10–11 and 6 seconds.",
        "Pick the part furthest over as your focus for the next two weeks.",
      ],
      dose: "Once, then every two weeks.",
      signal: "The part you focused on moves towards budget, and the next one becomes the focus.",
      exerciseId: "f2l_only",
    },
    {
      id: "budget-pair-clock",
      title: "Two and a half seconds a pair",
      purpose: "Gives F2L a concrete pace to practise at instead of 'as fast as possible'.",
      rules: [
        "Do slow solves where each pair, including finding it, takes about two and a half seconds.",
        "The cube should never stop; if it does, go slower.",
        "Ten solves.",
      ],
      dose: "Ten solves, three times a week.",
      signal: "Your F2L test time settles around ten or eleven seconds.",
      exerciseId: "slow_turning_f2l",
    },
  ],
  mistakes: [
    "Learning full OLL to get sub-20 when F2L pauses are costing more.",
    "Judging progress by the overall average alone.",
    "Practising the part that feels slow instead of the part that measures slow.",
  ],
  sources: [SOURCES.subTwenty, SOURCES.solveSplits, SOURCES.cuberpalLookahead],
};

export const colourNeutralPlan: LevelPack = {
  id: "colour-neutral-plan",
  title: "Going colour neutral",
  summary: "A plan for solving on more than one colour, and an honest look at when it's worth it.",
  levels: ["sub20"],
  why: "With one cross colour you take whatever cross the scramble gives you. With two you take the better of two, and with six the best of six. The saving is a move or two on the cross and, often more importantly, a better first pair.",
  lessons: [
    {
      id: "cn-what-it-buys",
      title: "What it actually buys you",
      takeaway:
        "A shorter cross and a better start to F2L — and it is mostly a decision, not a skill.",
      minutes: 3,
      body: [
        "Colour neutrality means having no preference between cross colours and no speed difference between them. Its benefit is choice: in inspection you can pick the cross that is shortest, or the one that leaves an easy first pair.",
        "The cost is less than people expect. The recognition skills are the same with different colours; what changes is the decision to look at more than one. People who make that decision at an intermediate level generally report being dual neutral within a week or two.",
        "It is still a personal choice. Some very fast solvers use one colour. What is clear is that switching gets harder the faster you are, because you have more solves built on one colour.",
      ],
    },
    {
      id: "cn-dual-first",
      title: "White and yellow first",
      takeaway:
        "The two opposite colours are nearly the same skill, and capture much of the benefit cheaply.",
      minutes: 3,
      body: [
        "Dual neutrality — white or yellow — is the cheap first step. The two crosses are opposite each other, so the side colours around them keep the same arrangement, which is why the switch is quick.",
        "The plan is simple. Spend a week solving only yellow crosses, until it no longer feels foreign. Then spend a week choosing freely between the two in every inspection, taking whichever looks better.",
        "Once that is automatic, decide whether to go further. Full neutrality is the same process one opposite pair at a time, and it takes longer — one account described months before times were fully back.",
      ],
      checkpoint: "In inspection you look at both white and yellow before deciding, every solve.",
    },
    {
      id: "cn-pairs",
      title: "The part that takes time: pairs",
      takeaway: "The cross adapts in days; recognising pairs in new colours takes longer.",
      minutes: 3,
      body: [
        "Most people find the cross on a new colour becomes comfortable quickly. What lags is F2L: you have learned to spot pairs partly by their colour combinations, and a new cross colour changes every combination.",
        "Expect your F2L to be the slow part for a few weeks after switching. The fix is ordinary solving on the new colours, not a special drill; recognition catches up on its own with reps.",
        "Keep an eye on the numbers rather than the feeling. If your F2L test is back to where it was, the switch is done, whatever it still feels like.",
      ],
    },
  ],
  drills: [
    {
      id: "cn-colour-week",
      title: "The yellow week",
      purpose:
        "Makes the second colour ordinary through volume, which is the only thing that does.",
      rules: [
        "For a week, every cross is yellow, however the scramble looks.",
        "Normal solving otherwise; time them if you like.",
        "At the end of the week, compare your yellow average with your white.",
      ],
      dose: "Every solve for one week.",
      signal: "The gap between the two averages closes to nearly nothing.",
    },
    {
      id: "cn-best-of-two",
      title: "Best of two",
      purpose: "Builds the inspection habit that makes neutrality worth having.",
      rules: [
        "In each inspection, find the white cross and the yellow cross, and count moves for each.",
        "Solve the shorter one.",
        "Blind-check it: plan, close your eyes, solve the cross.",
      ],
      dose: "Twenty solves.",
      signal: "Deciding between the two fits comfortably inside fifteen seconds.",
      exerciseId: "cross_only",
    },
  ],
  mistakes: [
    "Switching fully neutral in one go, and losing months to it.",
    "Choosing a colour by habit in inspection rather than by which cross is better.",
    "Worrying that F2L feels slow on a new colour, when it just needs reps.",
  ],
  sources: [SOURCES.colourNeutrality, SOURCES.colourNeutralWiki, SOURCES.dualNeutral],
};

export const fillerMoves: LevelPack = {
  id: "filler-moves",
  title: "Cutting filler moves",
  summary: "Moves that cancel, turns that could merge, and how to find them in your own solves.",
  levels: ["sub20"],
  why: "A filler move is one that didn't need to happen: a U followed by a U2, a rotation you then undo, a top turn before an algorithm that starts with a top turn. Each costs a fraction of a second, and there are usually several per solve.",
  lessons: [
    {
      id: "filler-cancel",
      title: "Moves that cancel",
      takeaway: "Two turns of the same face in a row are one turn you did in two pieces.",
      minutes: 3,
      body: [
        "The plainest filler is two turns of the same layer back to back: U then U2 is really U', and U then U' is nothing. It happens when you set up a pair with one turn, change your mind, and adjust with another.",
        "It also happens across steps. The last move of an F2L pair is often a top turn, and the first move of the next is often a top turn as well. If you had planned the second while doing the first, those would have been one.",
        "People aiming for sub-10 are advised to watch for exactly this: extra U turns and rotations are listed alongside lookahead as things to eliminate.",
      ],
      examples: [
        {
          label: "Two turns that are one",
          moves: "U U2",
          note: "The same as U'. If you do this during a solve, you decided late.",
        },
      ],
    },
    {
      id: "filler-merge",
      title: "Merging into the next algorithm",
      takeaway: "Line up the next step with the turn you are already making.",
      minutes: 4,
      body: [
        "The more useful skill is merging. Many F2L solutions and last-layer algorithms begin or end with a top turn. If you know the next step while finishing this one, the adjusting turn and the finishing turn can be the same turn.",
        "The best-known example is between the last pair and OLL: if your last insert ends with a top turn and your OLL needs a top turn to line up, choose the insert's direction so the case comes out already aligned.",
        "This is lookahead applied to moves rather than pieces. It is also why reading the OLL during the last pair pays off twice: once for the pause, once for the turn.",
      ],
      checkpoint:
        "You catch yourself about to make a top turn you could have folded into the last one.",
    },
    {
      id: "filler-rotations",
      title: "Rotations you undo",
      takeaway: "A y to reach a slot and a y' to come back is two rotations spent on one pair.",
      minutes: 3,
      body: [
        "Rotations are expensive for a reason beyond their move count: they reset what your eyes are tracking. A rotation you later undo is the worst kind — two resets for one pair.",
        "The fix is the back-slot and left-hand insertions from the F2L packs. When you see yourself rotating to a slot, ask whether the pair can go in from where you are.",
        "Data from top solvers backs this up: the overwhelming majority of their insertions are plain R-U or L-U inserts from the angle they are already holding.",
      ],
    },
  ],
  drills: [
    {
      id: "filler-replay",
      title: "Replay and count",
      purpose: "Filler is invisible while solving and obvious when written down.",
      rules: [
        "Do a solve slowly and write down every move as you make it.",
        "Circle any two turns of the same face in a row, and any rotation you undid.",
        "Redo the same scramble without the circled moves.",
      ],
      dose: "Three solves, once a week.",
      signal: "Fewer circles each week, and a lower move count on the same scramble.",
    },
    {
      id: "filler-plan-the-merge",
      title: "Plan the merge",
      purpose: "Builds the habit of choosing a finishing turn with the next step in mind.",
      rules: [
        "Solve to the last pair. Before inserting, look at the top and decide the OLL's angle.",
        "Choose the insertion so the case comes out lined up.",
        "Note how often you managed no extra turn.",
      ],
      dose: "Twenty last pairs.",
      signal: "Your last-pair-plus-OLL test time drops towards the sum of its parts.",
      exerciseId: "ls_oll",
    },
  ],
  mistakes: [
    "Setting up a pair with one turn and correcting with another.",
    "Finishing a step without having looked at the next one.",
    "Rotating to a slot and rotating back.",
  ],
  sources: [SOURCES.subTen, SOURCES.reconStats, SOURCES.metricWiki],
};

export const multislotting: LevelPack = {
  id: "multislotting",
  title: "Solving two pairs at once",
  summary:
    "Keyhole, pseudo-slotting and multislotting — and when the advanced version isn't worth it.",
  levels: ["sub15", "sub12"],
  why: "Past about fifteen seconds, pairs one at a time with good lookahead is most of what F2L can be. The next gains come from solutions that do a little work on a second pair while solving the first.",
  lessons: [
    {
      id: "multi-family",
      title: "A family of related tricks",
      takeaway: "All of these use a slot you aren't filling right now as temporary space.",
      minutes: 4,
      body: [
        "Keyhole, pseudo-slotting and multislotting are one idea at increasing ambition. Keyhole uses an empty slot to place one piece of a pair while the other is already in. Pseudo-slotting inserts a pair into the wrong slot on purpose, knowing a later bottom-layer turn puts it right. Multislotting sets up a second pair while inserting the first.",
        "All three depend on seeing more of the cube than the pair in front of you, which is why they come after lookahead rather than before. Without it they become pauses to think.",
        "Advanced solvers tend to use them opportunistically: they notice the chance and take it. Very few plan them from scratch every solve.",
      ],
    },
    {
      id: "multi-example",
      title: "The simplest multislot",
      takeaway: "Move a second slot out of the way, insert, and bring it back already paired.",
      minutes: 4,
      body: [
        "The textbook example: instead of inserting a front pair with R U R' directly, first turn the left face out of the way, then do R U R', then turn the left face back. The first pair goes in exactly as before, and the left turns have lined up the second pair as a side effect.",
        "The cost is two moves. The saving is a whole pair's worth of pairing, which is usually four to six moves plus the time to find it. When it is available it is a very good trade.",
        "What makes it hard is spotting it. You need to see where the second pair's pieces are and what a face turn would do to them, while executing the first — which is the knowing stage of lookahead.",
      ],
      examples: [
        {
          label: "Insert one pair, pair up another",
          moves: "L' R U R' L",
          note: "The left turns move a second pair's pieces together while the right hand inserts the first.",
        },
      ],
    },
    {
      id: "multi-limits",
      title: "When it isn't worth it",
      takeaway:
        "Full multislotting needs you to see too much, too fast. Take the easy ones and move on.",
      minutes: 3,
      body: [
        "Be honest about the limits. Full multislotting — deliberately controlling a second pair on most inserts — is widely called the hardest F2L technique there is, and a common view is that for most people the time spent seeing the opportunity costs more than the moves it saves.",
        "The reasonable version is: learn keyhole well, learn to recognise the simplest multislot cases like the one above, and take them when they appear. Don't hunt for them.",
        "Data from top solvers supports keeping things simple: most of their insertions are plain inserts, and keyhole inserts, while fastest on average, are rare. The fast part is the flow, not the trick.",
      ],
      checkpoint:
        "You use keyhole without thinking, and take an easy multislot when you notice one.",
    },
  ],
  drills: [
    {
      id: "multi-spot",
      title: "Spot, don't solve",
      purpose: "Builds recognition of the opportunity without the pressure of executing it.",
      rules: [
        "During slow solves, before each insert, ask: would turning another face now pair something up?",
        "Say yes or no, then solve normally.",
        "Check afterwards whether you were right.",
      ],
      dose: "Ten solves.",
      signal: "You start seeing opportunities you'd have missed, and being right about them.",
      exerciseId: "slow_turning_f2l",
    },
    {
      id: "multi-keyhole-first",
      title: "Keyhole everywhere it fits",
      purpose: "Makes the simplest member of the family automatic before trying the harder ones.",
      rules: [
        "For a session, whenever one piece of a pair is already in place and a slot is empty, use keyhole.",
        "Even if another solution seems as good.",
        "Twenty solves.",
      ],
      dose: "One session a week.",
      signal: "You use keyhole in normal solves without deciding to.",
    },
  ],
  mistakes: [
    "Trying multislotting before lookahead is pause-free.",
    "Hunting for multislots every insert and pausing to do it.",
    "Skipping keyhole, the simple version that pays off most often.",
  ],
  sources: [SOURCES.multislotting, SOURCES.keyhole, SOURCES.pseudoslotting, SOURCES.reconStats],
};

export const xcrossProperly: LevelPack = {
  id: "xcross-properly",
  title: "X-cross, properly",
  summary: "Solving the cross and a pair together, built up one piece at a time.",
  levels: ["sub15", "sub12"],
  why: "An x-cross takes a pair out of F2L entirely and makes the rest easier to read, because there are fewer pieces to search. It is also a genuinely hard planning skill, and trying it too early makes the ordinary cross worse.",
  lessons: [
    {
      id: "xc-payoff",
      title: "Why it's worth the effort",
      takeaway: "One fewer pair to find, and the first pause of the solve gone.",
      minutes: 3,
      body: [
        "Solving the cross and one pair together removes the pause after the cross and a pair's worth of searching. Three slots remain instead of four, and the uninspected part of the solve starts with fewer loose pieces.",
        "Its prerequisite is a plain cross that you plan fully and reliably in inspection. An x-cross is that plan plus tracking two more pieces. Without the first, the second doesn't fit in fifteen seconds.",
        "Not every scramble has an easy one. The goal is to take the easy ones — which come up more often than people expect — not to force one every solve.",
      ],
    },
    {
      id: "xc-ladder",
      title: "Build it one piece at a time",
      takeaway: "Corner first, then corner and edge, with unlimited time, then fifteen seconds.",
      minutes: 4,
      body: [
        "The practical way in is a small ladder. First, plan your cross and also where one pair's corner ends up after it. Nothing more. Then plan the corner and its edge. Then plan the moves that join them during the cross.",
        "Do all of this with unlimited inspection first. The point is to learn what an x-cross solution looks like, and time pressure stops you seeing it. Try the same scramble several ways and notice which one leaves the pair joined.",
        "Only then bring the inspection back to fifteen seconds. Your hit rate will drop, and that is fine: an ordinary cross is always the fallback.",
      ],
      checkpoint: "With unlimited inspection, you find an x-cross on most scrambles.",
    },
    {
      id: "xc-shapes",
      title: "Shapes that suggest one",
      takeaway:
        "A pair already joined, or a corner already in the bottom layer, are the usual starting points.",
      minutes: 3,
      body: [
        "Some scrambles hand you an x-cross. The most common are a pair already joined somewhere on the cube, and a corner already sitting in the bottom layer near its slot, which the cross moves can carry home.",
        "Pseudo x-cross is a related idea: a pair placed in the wrong slot during the cross, fixed later by a bottom-layer turn. It widens the set of scrambles where something useful is possible.",
        "Trainers exist that give you a scramble and hide an optimal x-cross solution until you ask for it. Studying those solutions is one of the quickest ways to learn the shapes.",
      ],
    },
  ],
  drills: [
    {
      id: "xc-unlimited",
      title: "Unlimited x-cross",
      purpose: "Learns what the solutions look like before asking for speed.",
      rules: [
        "Take unlimited time to plan a cross plus one pair.",
        "Execute it with your eyes closed, then check.",
        "Do the same scramble another way.",
      ],
      dose: "Ten scrambles, twice a week.",
      signal: "Plans that took a minute take twenty seconds.",
      exerciseId: "cross_unlimited",
    },
    {
      id: "xc-first-pair-clock",
      title: "Cross plus first pair, timed",
      purpose: "Checks the skill survives fifteen seconds of inspection.",
      rules: [
        "Normal inspection. Plan an x-cross if you see one; a plain cross and first pair if not.",
        "Solve the cross and first pair, then stop.",
        "Note which you did.",
      ],
      dose: "Twenty attempts a week.",
      signal: "Your cross-plus-first-pair time falls, and the x-cross share rises.",
      exerciseId: "cross_first_pair",
    },
  ],
  mistakes: [
    "Attempting x-crosses before the plain cross is fully planned every time.",
    "Forcing one on every scramble instead of taking the easy ones.",
    "Practising only against the clock, so the solutions are never learned.",
  ],
  sources: [
    SOURCES.xcrossTrainer,
    SOURCES.xcrossThread,
    SOURCES.extendedCross,
    SOURCES.crossPlusPair,
  ],
};

export const algSetsWorthIt: LevelPack = {
  id: "alg-sets-worth-it",
  title: "Which algorithm sets are worth it",
  summary: "COLL, Winter Variation, ZBLL and the rest: what each does, and speed per algorithm.",
  levels: ["sub10"],
  why: "After full OLL and PLL there are dozens of algorithm sets, some with hundreds of cases. Some pay back quickly; others take a year to learn for a fraction of a second. The trick is picking by speed gained per algorithm, not by how impressive the set is.",
  lessons: [
    {
      id: "sets-principle",
      title: "Speed per algorithm",
      takeaway:
        "Judge a set by how often its cases come up and how much each saves, divided by how many there are.",
      minutes: 3,
      body: [
        "A useful way to think about every set is speed per algorithm: how much faster an average solve becomes, divided by the algorithms you have to learn and maintain. Small sets with common cases score well; huge sets score badly for all but the very fastest.",
        "The other half is honest: fundamentals come first. People report averaging under ten seconds with only basic CFOP, and a common view is that F2L speed and lookahead separate good solvers from great ones far more than extra algorithms do.",
        "So the question for any set is not 'is it good' but 'is it better than another month of F2L work'. Usually the answer is no until F2L is genuinely strong.",
      ],
    },
    {
      id: "sets-small",
      title: "The small sets that pay",
      takeaway: "Winter Variation and COLL: tens of cases each, both with a clear use.",
      minutes: 4,
      body: [
        "Winter Variation is 27 cases. It solves the last pair while orienting the last-layer corners, when the pair is ready to insert and the edges are already oriented, so you go straight into PLL. Recognition is simple, and some guides suggest it much earlier than others; this ladder puts it around twelve seconds.",
        "COLL is 40 cases. With the last-layer edges already oriented, it orients and permutes the corners together, leaving only an edge permutation. It gives a lot of PLL skips and easy PLLs, but recognition is harder than OLL's.",
        "Both are in the algorithm bank in this app, checked on a cube. They make sense once full OLL and PLL are fast; learn the cases you meet most first.",
      ],
    },
    {
      id: "sets-large",
      title: "The large ones, honestly",
      takeaway: "ZBLL, OLLCP and VLS run to hundreds of cases. They are for the very top.",
      minutes: 3,
      body: [
        "ZBLL solves the whole last layer in one step when the edges are oriented: about 470 cases, or 493 counting the PLLs. Only a handful of people have learned all of it. OLLCP is over 300 cases, and VLS over 400.",
        "These are real techniques used at the top of the sport, and they are a poor investment below it. The standard advice for anyone curious about ZBLL is to learn COLL first, since it is a subset of the same idea, then add ZBLL cases a group at a time.",
        "If you do start a large set, count case frequency first. Learn the cases that appear in your solves, and stop when the new ones stop showing up often enough to matter.",
      ],
    },
  ],
  drills: [
    {
      id: "sets-frequency",
      title: "Count before you commit",
      purpose: "Shows how often a set would actually help before you spend weeks learning it.",
      rules: [
        "For fifty solves, note every time a case from the set you are considering comes up.",
        "Estimate the time each would have saved.",
        "Compare with what a month of F2L work would do for you.",
      ],
      dose: "Once, before starting a new set.",
      signal: "You start a set only when it clearly beats more F2L work.",
    },
    {
      id: "sets-group-of-five",
      title: "Five at a time",
      purpose: "Keeps new learning at a size that survives into real solves.",
      rules: [
        "Pick the five cases of the set you meet most.",
        "Learn them, then use them in normal solves for a week before adding more.",
        "Drop any case you keep forgetting; it isn't coming up enough.",
      ],
      dose: "Five cases a week, at most.",
      signal: "Each group gets used in real solves without a pause.",
    },
  ],
  mistakes: [
    "Learning a big set before F2L and lookahead are strong.",
    "Choosing a set by reputation rather than by how often it helps you.",
    "Learning twenty cases at once and keeping none of them.",
  ],
  sources: [SOURCES.algSets, SOURCES.llHierarchy, SOURCES.sub10Thread, SOURCES.getFaster],
};

export const reconstructYourSolves: LevelPack = {
  id: "reconstruct-your-solves",
  title: "Reconstructing your own solves",
  summary: "Write down what you actually did, count it, and compare it with the best.",
  levels: ["sub10"],
  why: "At this level the remaining time is in details you can't feel during a solve: a few extra moves in one pair, a slow stretch in another. Reconstructing a solve — writing out every move you made — is how fast solvers find them.",
  lessons: [
    {
      id: "recon-two-numbers",
      title: "Two numbers make a solve",
      takeaway:
        "Time is moves divided by turns per second. Every improvement changes one or the other.",
      minutes: 3,
      body: [
        "Every solve has two numbers behind it: how many moves it took and how fast they were made. Sixty moves at ten turns a second is six seconds; forty at eight is five. The slower-turning solve wins because it was more efficient.",
        "That makes every improvement either fewer moves or faster moves, and a reconstruction tells you which your solve needs. Without one, 'I was slow' could mean either, and they need completely different practice.",
        "At the top of the sport the two pull against each other: very high turning speed usually comes with less efficient solutions. The fastest solves are the rare ones that manage both.",
      ],
    },
    {
      id: "recon-how",
      title: "How to reconstruct",
      takeaway: "Film it, slow it down, write each step's moves, count them.",
      minutes: 4,
      body: [
        "Record a solve from above, with a phone's slow-motion mode if you have one. Play it back and write down every move, step by step: cross, each pair, OLL, PLL, and the turns between.",
        "Count moves in a consistent metric. The common one counts any turn of any layer, including a half turn or a slice, as one move. Divide each step's moves by its time to get turns per second for that step.",
        "Reconstructions are usually shared in a standard layout, step by step with the move count and speed of each, and there is a long-running community thread of them from fast solvers. Comparing yours against theirs is the fastest way to see what a good solution for your weak step looks like.",
      ],
      checkpoint: "You can say your move count and turns per second for each step of one solve.",
    },
    {
      id: "recon-what-to-look-for",
      title: "What to look for",
      takeaway: "Slow steps, long pairs, rotations, and pauses you didn't know about.",
      minutes: 4,
      body: [
        "Look first at turns per second by step. F2L is usually turned noticeably faster than the cross by strong solvers, because the cross needs more thinking per move; a cross or F2L far slower than the rest of your solve points at planning or lookahead.",
        "Then look at pairs individually. Most good pairs are seven or eight moves; one at twelve had a better solution. Rotations are worth marking too, since they cost more than their move count and are usually avoidable.",
        "Finally, look at the time between steps in the video. Pauses show up clearly on film that you'd never notice while solving, and they are usually the cheapest thing on the list to fix.",
      ],
    },
  ],
  drills: [
    {
      id: "recon-five",
      title: "Reconstruct five",
      purpose: "Gives you real numbers for your own solving instead of impressions.",
      rules: [
        "Film five ordinary solves.",
        "Reconstruct each: moves per step, time per step, turns per second.",
        "Find the step that is worst in most of the five.",
      ],
      dose: "Once a month.",
      signal: "The worst step changes from month to month, which means you fixed the last one.",
    },
    {
      id: "recon-same-scramble",
      title: "Race your own reconstruction",
      purpose:
        "Turns a reconstruction into practice by finding a better solution on the same scramble.",
      rules: [
        "Take a reconstructed solve and replay the scramble.",
        "Find a shorter solution for its worst step with unlimited time.",
        "Execute the better version a few times, then return to normal solves.",
      ],
      dose: "One scramble a week.",
      signal: "Your move count on new solves drops over a few weeks.",
    },
  ],
  mistakes: [
    "Judging a solve as slow without knowing whether moves or speed were the problem.",
    "Counting moves inconsistently, so solves can't be compared.",
    "Reconstructing only your best solves, which show what went right.",
  ],
  sources: [SOURCES.reconstructionWiki, SOURCES.metricWiki, SOURCES.reconStats, SOURCES.limits],
};

export const competing: LevelPack = {
  id: "competing",
  title: "Competing well",
  summary: "How a WCA round works, how to prepare for it, and how to stop nerves costing you.",
  levels: ["sub20"],
  why: "Competition times are routinely slower than home times, especially at first. Very little of that is speed: it is an unfamiliar procedure, a stackmat, a judge, and nerves. All of those can be practised.",
  lessons: [
    {
      id: "comp-procedure",
      title: "How an attempt works",
      takeaway: "Fifteen seconds of inspection, a stackmat start and stop, and a sheet you sign.",
      minutes: 4,
      body: [
        `At a WCA competition each attempt runs the same way. A judge uncovers your cube and starts timing inspection. You have fifteen seconds; the judge calls out at eight and twelve. The cube was scrambled with ${SCRAMBLE_HOLD}, so the ${SOLVING_ROTATION} into your solving hold comes out of those fifteen seconds. Starting between fifteen and seventeen seconds costs two seconds; after seventeen, the attempt is a DNF.`,
        "You start by placing both hands flat on the stackmat and lifting them, and stop by placing both hands flat again. Pressing the timer's face instead is the classic first-timer mistake. A cube left one move from solved costs a two-second penalty; further off than that and the attempt doesn't count. The regulations have the exact wording.",
        "Most rounds of 3x3 are an average of five: your best and worst attempts are dropped, and your result is the mean of the middle three. That rewards consistency far more than a single fast solve.",
      ],
      checkpoint: "You could run an attempt from start to signing without being told what to do.",
    },
    {
      id: "comp-prepare",
      title: "Preparing in the weeks before",
      takeaway:
        "Practise the conditions: fifteen-second inspection, a stackmat if you can, averages of five.",
      minutes: 3,
      body: [
        "The single most useful preparation is inspection: practise with the full fifteen-second limit, planning your cross before looking up, every solve. Competitions punish going over, and nerves make you plan less than you think.",
        "If you can borrow or buy a stackmat, practise starting and stopping on it until it's automatic. Do your practice in averages of five, the way you will be judged, rather than endless singles.",
        "Make your last-layer recognition automatic with a trainer. Nerves slow recognition before they slow anything else, and an algorithm you half-know is the first thing to go.",
      ],
    },
    {
      id: "comp-nerves",
      title: "On the day",
      takeaway: "Expect to be slower, keep a routine, and think only about the next move.",
      minutes: 3,
      body: [
        "It is normal for a first competition to be something like five to twenty per cent slower than your practice average. Knowing that in advance takes a lot of the pressure off: a slower time is the expected result, not a failure.",
        "Have a short routine you do before every attempt — dry your hands, a couple of slow breaths, then say you're ready. Arrive early and watch a round before yours; seeing the procedure makes it familiar.",
        "During the solve, think about the process rather than the time. The attempt in front of you is the only one you can change; the others are already written down.",
      ],
    },
  ],
  drills: [
    {
      id: "comp-home-average",
      title: "Competition average at home",
      purpose: "Rehearses the format so nothing about it is new on the day.",
      rules: [
        "Do five solves with full fifteen-second inspection and nothing between them but a scramble.",
        "Drop the best and worst, and take the mean of the rest.",
        "If you can, have someone scramble and watch you.",
      ],
      dose: "One or two averages a day in the week before.",
      signal: "Your competition-style average gets close to your normal average.",
    },
    {
      id: "comp-cold-start",
      title: "Cold start",
      purpose:
        "Competitions give you no warm-up before an attempt. Practise being fast straight away.",
      rules: [
        "Start a session with a timed average of five and no warm-up.",
        "Compare it with your usual first average after warming up.",
        "Do this a few times a week for two weeks before a competition.",
      ],
      dose: "Three times a week.",
      signal: "The gap between cold and warmed-up averages shrinks.",
    },
  ],
  mistakes: [
    "Pressing the stackmat's face to stop the timer.",
    "Practising with unlimited inspection, then running out of time at the competition.",
    "Expecting home times at a first competition.",
    "Chasing one fast single when the result is the average of five.",
  ],
  sources: [
    SOURCES.wcaCompetitor,
    SOURCES.firstCompetition,
    SOURCES.wcaRegulations,
    SOURCES.practiceTips,
  ],
};
