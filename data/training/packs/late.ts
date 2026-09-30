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
        "The standard trick is a reference sticker: for each PLL, one sticker on the front or right face that the algorithm leaves where it is, so it tells you where the layer will end up. If it matches the centre below it now, there will be no final turn; if it matches the opposite centre, it will be a U2; and so on. Find one for each of your algorithms and use the same one every time.",
        "It takes some upfront work per case, and then it is free forever. This is widely described as the single most useful AUF skill to have.",
      ],
      checkpoint:
        "For five PLLs you use a lot (the T, the two U perms and the two J perms, say), you know the final turn before starting.",
    },
    {
      id: "auf-before",
      title: "Recognise and line up in one step",
      takeaway:
        "Every case can appear at four angles. Find the case and the smallest turn together.",
      minutes: 4,
      body: [
        "A case can show up turned four ways from the angle you learned it. People fall into one of two habits: turning the top until it looks familiar, then recognising; or recognising from wherever it is, then turning. The second is faster, and it is a learnable skill.",
        "Aim to know each case from every angle, and to know the smallest turn that brings it to your starting angle. Some algorithms have alternatives that start from a different angle — the algorithm bank shows the turn each one needs from the picture — and choosing the one that needs no turn at all removes the step entirely. For OLL the whole top face is always in view, so learning each case from every angle is the work now. For PLL, reading from any angle comes with two-sided recognition, the Sub-15 step; until then a turn of the top to check a PLL is fine.",
        "There is a further trick at a higher level: a second algorithm for the same case that starts or finishes a turn away from the one you know, so the extra top turn disappears. It is worth knowing it exists; only adopt it for a case after timing it against the plain version.",
      ],
    },
    {
      id: "auf-fingers",
      title: "Turns that flow out of the algorithm",
      takeaway: "The final turn should use whichever finger is already in place, not a regrip.",
      minutes: 3,
      body: [
        "Different algorithms leave your hands in different places. A final U2 can be an index-then-middle double flick with either hand, or one flick from each hand; a U' can be a left-index push. The best choice is whichever one your hands are already set up for when the algorithm ends.",
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
        "Solve to OLL. Name the case before touching the top layer. Add PLL once you read PLLs from two sides.",
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
      takeaway:
        "Roughly two to two and a half seconds of cross, ten or eleven of F2L, and six or seven of last layer.",
      minutes: 4,
      body: [
        "A widely quoted breakdown of a sub-20 average is a cross of about two seconds, F2L of about ten or eleven, and a last layer of about six. The road on Learn works the split out from this app's own goals, with the pause in front of each part included, and lands close to that: a little more on the cross and the last layer.",
        "Two things follow from that shape. F2L is more than half of it, so a small improvement there is worth more than a large one anywhere else. And six seconds of last layer is within reach on two-look OLL and full PLL, so you can get to sub-20 without full OLL. If your measured last layer is the part over budget, though, this is a good time to start full OLL, a group at a time, building out from the cases two-look OLL already taught you.",
        "Four pairs in ten or eleven seconds is about two and a half seconds a pair including finding it. That is the pace to work down towards. In slow solves, go slower than that, so the cube never stops.",
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
        "Compare each with the sub-20 budget: about 2–2.5, 10–11 and 6–7 seconds.",
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
        "Start at the pace where the cube never stops, and time your F2L.",
        "Each week, bring the pace down towards about two and a half seconds a pair, finding it included.",
        "If the cube stops, you went faster than your eyes: ease off a little and hold that pace.",
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
  levels: ["sub120"],
  why: "With one cross colour you take whatever cross the scramble gives you. With two you take the better of two, and with six the best of six. The saving averages about one move on the cross, with many more short, easy crosses. It is optional, and staying on the white cross is a sound choice.",
  lessons: [
    {
      id: "cn-what-it-buys",
      title: "What it actually buys you",
      takeaway:
        "About one move off the average cross and far more easy starts, paid for with months of practice if you go fully neutral.",
      minutes: 3,
      body: [
        "Colour neutrality means having no preference between cross colours and no speed difference between them. Its benefit is choice: in inspection you can pick the cross that is shortest, or the one that leaves an easy first pair.",
        "The numbers are modest. The average cross falls from roughly 5.8 moves on one colour to about 4.8 on six, and dual neutrality, white and yellow, gets about half of that. The bigger difference is easy starts: crosses of four moves or fewer come up about five times as often. Feliks Zemdegs tested it on his own solves and estimated the long-run saving at about 0.25 seconds a solve.",
        "The cost is not small. A full switch can take months, with slower times while you adjust and an extra decision in every inspection. Switching is easiest soon after you can solve and gets harder the faster you are, because you have more solves built on one colour. For someone who is already fast, that means months of work for about a quarter of a second; soon after you can solve, the switch costs far less. If you want some of the benefit later on, dual neutrality is the cheaper route.",
      ],
    },
    {
      id: "cn-dual-first",
      title: "White and yellow first",
      takeaway:
        "Dual neutrality gets about half the saving for a week or two of practice, sometimes a few weeks.",
      minutes: 3,
      body: [
        "Dual neutrality — white or yellow — is the cheap first step. The yellow cross itself comes quickly; what takes the practice is F2L, because the side colours around yellow run in mirrored order and every pair belongs in the slot on the opposite side.",
        "The plan is simple. Spend a week solving only yellow crosses, until it no longer feels foreign. Then spend a week choosing freely between the two in every inspection, taking whichever looks better.",
        "Once that is automatic, decide whether to go further. Full neutrality is the same process one opposite pair at a time, and it takes much longer: expect months, and a dip in your times while it settles.",
      ],
      checkpoint: "In inspection you look at both white and yellow before deciding, every solve.",
    },
    {
      id: "cn-pairs",
      title: "The part that takes time: pairs",
      takeaway: "The cross adapts quickly; putting pairs in their mirrored slots takes reps.",
      minutes: 3,
      body: [
        "Most people find the cross on a new colour becomes comfortable quickly. What lags is F2L. Hold a yellow cross on the bottom with green in front and red is on the right, where orange sits in a white-cross solve: the side colours run the other way round. So the green-orange pair now goes in the front-left slot instead of the front-right, and every other pair has swapped sides the same way.",
        "Expect your F2L to be the slow part for a few weeks after switching, while your hands keep reaching for the old slot. The fix is ordinary solving on the new colours, not a special drill; recognition catches up with reps.",
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
      untimed: true,
    },
    {
      id: "cn-best-of-two",
      title: "Best of two",
      purpose: "Builds the inspection habit that makes neutrality worth having.",
      rules: [
        "In each inspection, find the four white edges and the four yellow edges, and see which colour's first two edges go in more easily (or its whole cross, once you plan whole crosses).",
        "Solve the one with the better start: usually the shorter cross, or one a move longer if you can see it leaves an easy first pair.",
        "Plan as much of it as you can before you turn. Once you can plan the whole cross, check it blind: close your eyes and solve the cross.",
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
        "It also happens between pairs. An insert ends on a side turn, like the R' of R U R', and the next pair usually starts with a top turn to set it up. Decide that turn late and it comes in pieces: a U, a look, then a U2 to fix it. Plan the next pair's set-up while the current one goes in, and it is one turn.",
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
      takeaway:
        "When one step ends with a top turn and the next starts with one, make them a single turn; where nothing can merge, have the next turn ready.",
      minutes: 4,
      body: [
        "The more useful skill is merging. Most steps start with a top turn, the set-up for a pair or the turn that lines up an OLL or PLL, and some algorithms end with one. When one step ends with a top turn and the next starts with one, knowing the next step while finishing this one makes them a single turn.",
        "The plainest example is at the end of the solve. SolveLab's default Jb, R U R' F' R U R' U' R' F R2 U' R' U', ends with a U'. If the layer would then need a U2 to finish, do a U instead of the U': the algorithm's last turn and the finishing turn become one.",
        "Between the last pair and OLL there is nothing to merge, because an insert ends on a side turn. The saving there is deciding early. The insert's last move, an R' say, moves only the right-hand column of the top, so the rest of the top is already set before it. Read it while the pair goes in, and the OLL's set-up turn follows the R' with no look in between. If you know two inserts for the pair, you can also choose the one that leaves the better OLL; the edge-control lesson in The last pair into OLL has the case to start with.",
        "This is lookahead applied to moves rather than pieces. It is also why reading the OLL during the last pair pays off twice: once for the pause, and once for the set-up turn, which you make at once instead of finding it by trial.",
      ],
      examples: [
        {
          label: "A last turn folded in",
          moves: "R U R' F' R U R' U' R' F R2 U' R' U",
          note: "SolveLab's default Jb with its closing U' changed to a U, for the angle where the layer would otherwise need U' and then U2.",
        },
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
        "You have seen why a rotation costs more than its moves: it resets what your eyes are tracking. The worst kind is one you later undo, two resets for one pair.",
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
      untimed: true,
    },
    {
      id: "filler-plan-the-merge",
      title: "Plan the merge",
      purpose: "Builds the habit of deciding the next top turn before the current step ends.",
      rules: [
        "Solve to the last pair. While it goes in, read the top and decide the OLL's set-up turn.",
        "Make that turn straight after the insert, with no look in between. If you know two inserts for the pair, pick the one that leaves the better OLL.",
        "Note how often you needed a second look or a second top turn.",
      ],
      dose: "Twenty last pairs.",
      signal:
        "Most of the twenty go straight from the insert into the OLL's set-up turn, with no second look or second turn.",
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
    "Pseudo-slotting and multislotting, built on the keyhole you already know — and when the advanced version isn't worth it.",
  levels: ["sub12"],
  why: "Down to about fifteen seconds, pairs one at a time with good lookahead is most of what F2L can be. Faster than that, the next gains come from solutions that do a little work on a second pair while solving the first.",
  lessons: [
    {
      id: "multi-family",
      title: "A family of related tricks",
      takeaway: "All of these use a slot you aren't filling right now as temporary space.",
      minutes: 4,
      body: [
        "Keyhole is the simplest member of the family, and you should already be using it from the Sub-30 course: an empty slot lets you place one piece of a pair while the other is already in. This pack adds the two more ambitious ones. Pseudo-slotting puts a corner and an edge from two different pairs in together, with the bottom layer turned on purpose so that turning it back finishes both. Multislotting sets up a second pair while inserting the first.",
        "Pseudo-slotting and multislotting both depend on seeing more of the cube than the pair in front of you, which is why they come after lookahead rather than before. Without it they become pauses to think. Keyhole is different: it only needs the pair you're solving and one empty slot, which is why it belongs much earlier.",
        "Advanced solvers tend to use them opportunistically: they notice the chance and take it. Very few plan them from scratch every solve.",
      ],
    },
    {
      id: "multi-pseudo",
      title: "Pseudo-slotting: a pair that isn't one",
      takeaway:
        "With the bottom layer turned, a corner and an edge from different pairs can go in together; turning the bottom back sends each one home, and each slot then still needs its other piece.",
      minutes: 4,
      body: [
        "A turn of the bottom layer carries its corners round with it, but the middle-layer edges stay where they are. Pseudo-slotting is built on that. Turn the bottom a quarter with D and the front-left corner's home moves round to sit under the front-right slot, while the front-right edge's home stays put. So the front-left corner and the front-right edge can go into the front-right slot together, as if they were a pair. Turn the bottom back with D' and the corner rides home to the front-left, while the edge is already where it belongs.",
        "It pays when the pieces already sit that way: a corner and an edge from two different pairs that one short insert would place together, or a bottom layer already turned by an earlier step. One pseudo insert does the work of two separate keyholes in fewer moves, and it needs only two open slots. Tymon Kolasiński, known for it, uses one about once a solve.",
        "It is also easy to get wrong. Side by side, the two pieces' colours don't match on either face, so the check you use on every real pair, matching stickers, tells you nothing. You have to work out which way the corner must face to land correctly once the bottom turns back, and a pseudo-pair is easily put in with its edge flipped.",
        "So don't wait for it to appear by itself; drill it on purpose. In untimed solves, look for a corner and an edge from different pairs that would go in together with the bottom turned a quarter either way, or a half, and check the corner's twist before you insert. Keep a tally of how often you find one and how often it comes out right.",
      ],
      checkpoint:
        "In slow solves you spot a pseudo-pair now and then, and it comes out solved when the bottom turns back.",
    },
    {
      id: "multi-example",
      title: "The simplest multislot",
      takeaway:
        "With the front-left slot still open, an L' before R U R' and an L after it can pair or even insert a second pair along with the first.",
      minutes: 4,
      body: [
        "A simple example is L' R U R' L. The R U R' in the middle is an ordinary insert for the front-right pair. The L' before it opens the front-left slot, which you haven't filled yet, and the L after it closes that slot again. The U in the middle turns the whole top layer, so anything sitting on top rides round with it, and whatever it brings above the open slot, the L puts in.",
        "That only helps when two things are true. The front-left slot must not be finished yet, since the L' lifts whatever is in it and the U carries it away. And the second pair's pieces must sit where the R and the U will carry them over that slot. In the example below, the front-left pair's corner is stuck in the front-right slot, and its edge waits at the front of the top layer: the R lifts the corner out, the U brings corner and edge round together above the open slot, and the L drops them in.",
        "The cost is the two left turns. Without them, R U R' puts the first pair in and brings the second out joined above its slot, and U' L' U L puts it in: seven moves and a second look, against five. On other scrambles the left turns can pair a second pair without putting it in, which still saves the moves it would take to pair it.",
        "What makes it hard is spotting it. You need to see where the second pair's pieces are and what a face turn would do to them, while executing the first — which is the knowing stage of lookahead.",
      ],
      examples: [
        {
          label: "Two pairs in five moves",
          moves: "L' R U R' L",
          note: "Before: the front-right pair's corner is above its slot with white facing right, and its edge is at the back. The front-left slot is empty; that pair's corner is stuck in the front-right slot with white facing right, and its edge is at the front of the top layer, green on top. After: both pairs are in.",
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
        "The reasonable version is: keep keyhole automatic, learn to recognise the simplest multislot cases like the one above, and take them when they appear. Don't hunt for them.",
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
        "During slow solves, before each insert, ask: would turning another face now pair something up, or would turning the bottom let a corner and an edge from different pairs go in together?",
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
    "Checking a pseudo-pair by matching its stickers, which never match, instead of working out where the corner will land.",
    "Skipping keyhole, the simple version that pays off most often.",
  ],
  sources: [SOURCES.multislotting, SOURCES.keyhole, SOURCES.pseudoslotting, SOURCES.reconStats],
};

export const xcrossProperly: LevelPack = {
  id: "xcross-properly",
  title: "X-cross, properly",
  summary: "Solving the cross and a pair together, built up one piece at a time.",
  levels: ["sub15"],
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
        "Pseudo x-cross is a related idea: the cross is built with the bottom layer turned a quarter or a half, so a corner and an edge from different pairs can go in with it, and turning the bottom back sends each one home. It widens the set of scrambles where something useful is possible.",
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
  summary:
    "What the bigger algorithm sets do, and how to judge each by the time it saves per algorithm.",
  levels: ["sub20"],
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
        "Winter Variation is 27 cases. It inserts the last pair and turns the last-layer corners yellow side up in the same algorithm, so PLL comes next. It only applies in one situation: the last pair already joined in the top layer, ready for a U R U' R' insert, with the last layer's edges already facing up. Recognition is simple, and the short R and U cases are the ones to learn first.",
        "COLL is 40 cases, and it only applies when the last-layer edges are already oriented after F2L, which happens about one solve in eight. It orients and places the corners together, so the PLL left is always an edges-only one (U, H or Z), skipped about one time in twelve. Recognition is harder than OLL's.",
        "Both are in the algorithm bank in this app, checked on a cube. They make sense once full OLL and PLL are solid, around fifteen seconds. For COLL, start with the H and Pi groups and leave Sune and Antisune for last, since an OLL and a PLL are already quick there.",
      ],
    },
    {
      id: "sets-large",
      title: "The large ones, honestly",
      takeaway: "ZBLL, OLLCP and VLS run to hundreds of cases. They are for the very top.",
      minutes: 3,
      body: [
        "ZBLL solves the whole last layer in one step when the edges are oriented: about 470 cases, or 493 counting the PLLs. Relatively few solvers have learned all of it, nearly all of them at the very top. OLLCP is over 300 cases, and VLS over 400.",
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
      untimed: true,
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
      untimed: true,
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
  levels: ["sub15"],
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
        "Count moves in a consistent metric. The common one, STM, counts any turn of any layer, including a half turn or a slice, as one move. Divide each step's moves by its time to get turns per second for that step.",
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
        "Look first at turns per second by step. F2L is usually turned noticeably faster than the cross by strong solvers, because cross moves are awkward (D, B and F turns, straight out of inspection) while F2L runs on practised triggers; a cross or F2L far slower than the rest of your solve points at planning or lookahead.",
        "Then look at pairs individually. A good pair averages about seven moves and most take eight or fewer; one at twelve probably had a better solution. Rotations are worth marking too, since they cost more than their move count and are usually avoidable.",
        "Finally, look at the time between steps in the video. Pauses show up clearly on film that you'd never notice while solving, and they are usually the cheapest thing on the list to fix.",
      ],
    },
    {
      id: "recon-fast-solvers",
      title: "Learn from fast solvers' reconstructions",
      takeaway:
        "Compare your solves with faster solvers' step by step, then review your own the way they review theirs.",
      minutes: 4,
      body: [
        "Fast solvers' reconstructions are easy to find. The SpeedSolving forum has a long-running reconstruction thread, and reco.nz is a large archive of them. Read the very best, but also solvers a little faster than you: their solutions are closer to what your own hands can copy next month.",
        "Compare like with like, one step at a time. How many moves does each of their pairs take, against yours? Where do they pause, if anywhere? How often do they rotate? When did they take an x-cross, and when did they leave the cross plain? Which insert did they choose for the last pair, and did it set up an easier last layer? A difference that turns up in solve after solve is worth far more than one clever move.",
        "Then turn the same eye on your own solves. Fast solvers talking through their reconstructions are blunt about their flaws: the start that could have been cleaner, the small pause before a pair, the regrip that cost a tenth. Write that kind of comment beside each step of yours. It turns a list of moves into a list of things to fix.",
      ],
      checkpoint:
        "You've compared one of your solves with a faster solver's and written down one habit to copy.",
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
      untimed: true,
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
      untimed: true,
    },
  ],
  mistakes: [
    "Judging a solve as slow without knowing whether moves or speed were the problem.",
    "Counting moves inconsistently, so solves can't be compared.",
    "Reconstructing only your best solves, which show what went right.",
  ],
  sources: [
    SOURCES.reconstructionWiki,
    SOURCES.metricWiki,
    SOURCES.reconStats,
    SOURCES.limits,
    SOURCES.feliksCommentary,
  ],
};

export const competing: LevelPack = {
  id: "competing",
  title: "Competing well",
  summary: "How a WCA round works, how to prepare for it, and how to stop nerves costing you.",
  levels: ["sub120"],
  why: "Competition times are routinely slower than home times, especially at first. Very little of that is speed: it is an unfamiliar procedure, a stackmat, a judge, and nerves. All of those can be practised.",
  lessons: [
    {
      id: "comp-procedure",
      title: "How an attempt works",
      takeaway: "Fifteen seconds of inspection, a stackmat start and stop, and a sheet you sign.",
      minutes: 4,
      body: [
        `At a WCA competition each attempt runs the same way. A judge uncovers your cube and starts timing inspection. You have fifteen seconds; the judge calls out at eight and twelve. The cube was scrambled with ${SCRAMBLE_HOLD}, so the ${SOLVING_ROTATION} into your solving hold comes out of those fifteen seconds. Starting between fifteen and seventeen seconds costs two seconds; after seventeen, the attempt is a DNF.`,
        "You start by resting both hands flat on the stackmat's pads and lifting them. To finish, let go of the cube, then stop the timer with both palms. Stopping it while your hand is still on the cube is the classic first-timer mistake. A cube left one move from solved costs a two-second penalty; further off than that and the attempt doesn't count. The regulations have the exact wording.",
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
        "The single most useful preparation is inspection: practise with the full fifteen-second limit every solve, and plan your cross inside it. Competitions punish going over, and nerves make you plan less than you think.",
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
    "Stopping the timer while still touching the cube.",
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
