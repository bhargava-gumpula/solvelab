import { SOURCES } from "../sources";
import type { LessonQuiz, LevelPack } from "../types";

/*
 * Inspection at the fast end: the fifteen seconds spent in phases, a stopping
 * rule for the cross search, what a second cross colour buys, how often an
 * x-cross exists, and the pseudo x-cross. Every cross count is checked against
 * a full search on the cube engine, the neutrality figures against a seeded
 * sample of random cubes, and the pseudo x-cross examples and mechanics on the
 * engine (tests/unit/night-inspection-xcross.test.ts).
 */

export const inspectionBudget: LevelPack = {
  id: "inspection-budget",
  title: "Inspection at the fast end",
  summary:
    "Fifteen seconds spent in phases, when to stop looking for a shorter cross, what a second colour really buys, and how often an x-cross is there to find.",
  levels: ["sub15", "sub12"],
  why: "By now the cross is planned every solve and fifteen seconds is enough time. What goes wrong is how it's spent: seconds hunting for one move off a cross that was already good, a pair plan only half held when the timer starts, a colour choice reopened at ten seconds. Each feels careful and each costs more than it saves. The cross and x-cross counts say how often something better exists, so you can decide when to keep looking and when to stop.",
  lessons: [
    {
      id: "insp-commit-points",
      title: "Fifteen seconds in phases",
      takeaway:
        "Settle the cross in the first few seconds, have it fixed by the 8-second call, drop whatever isn't solid at 12 and start by 14. A half-held plan costs more than none.",
      minutes: 5,
      body: [
        "Planning in inspection has two sides. Its value comes early: the cross is worth the most, the first pair less, anything past that less again. Its risk comes late: each later part of the plan rests on following pieces through moves you haven't made yet, so it is more likely to be wrong. A wrong plan costs twice, once for the pause when the cube doesn't look the way you expected and again for working out where things really are. So the last seconds of inspection should go on holding and checking what you have, not on adding to it.",
        "That gives inspection a shape, with a decision at the end of each part. In the first two to four seconds, get into your solving hold and settle the cross: which colour, if you use more than one, and which edges first. Feliks Zemdegs aims to choose his cross colour within the first three or four seconds of inspection, ideally under two. By the 8-second call the cross is fully planned and run through once in your head. Between 8 and 12 you follow the first pair's corner and edge through the cross. At the 12-second call, anything you aren't sure of is dropped. The last seconds go on the first moves and your grip, and the solve starts before 15: after 15 it is +2, and after 17 a DNF.",
        "The calls are the WCA's. A judge calls out 8 and 12 seconds during inspection, and SolveLab's Inspection sounds setting plays a tone at the same moments, so you practise with the markers you'll hear in competition. Treat them as deadlines, not as a clock to glance at.",
        "The decisions only work if you don't reopen them. Switching colour at nine seconds because the pair looks awkward is the usual way to reach fifteen with two half-plans. On a hard scramble the phases stretch, with the cross finished nearer 10 and only the pair's corner followed, but the order holds: cross before pair, nothing past the pair, and a check before you start. Even around sub-10, solvers report very rarely seeing two whole pairs in inspection; what looks like it is lookahead during the cross.",
      ],
      checkpoint:
        "Most of your solves start between 12 and 14 seconds into inspection, with a cross you checked once, and the 12-second call never finds you still adding to the plan.",
    },
    {
      id: "insp-stop-searching",
      title: "When to stop looking for a shorter cross",
      takeaway:
        "A seven or eight you've found is usually a miss, so look once more; a five is usually as good as it gets, so stop and spend the seconds on the pair.",
      minutes: 5,
      body: [
        "Looking for a shorter cross costs seconds of inspection, and it only pays if a shorter one exists. How often one exists is known. On one colour, the best possible cross is four moves or fewer on 6% of scrambles, five on 24%, six on 51%, seven on 18%, and eight on only about one scramble in 2,000. The average is 5.8 moves. Lars Vandenbergh counted these over every cross position, and a full search on SolveLab's cube engine gives the same numbers.",
        "So what you've found tells you whether to keep looking. Of all the scrambles where a seven-move cross exists, four in five also have one of six or fewer, and an eight is the best on so few scrambles that finding one almost always means a shorter one was missed. Found a seven or eight: look once more. Found a five: only about one scramble in five that allows a five allows a four, and one move saved is worth less than a pair you've followed through the cross, so stop. Found a six: a five exists a little over a third of the time, so stop unless the six leaves an awkward first pair, in which case you're looking for a better start anyway.",
        "Make the second look a different kind of look, not the same search again. Try the edges in another order, start from a different edge, or check whether two edges already sitting together can go in with one turn. If you choose between white and yellow, the other colour is the second look: on the better of the two, a cross of seven or more comes up on only about 3 scrambles in 100.",
        'Strong solvers already work this way. Feliks Zemdegs estimates he picks the move-optimal cross only about 80% of the time, on purpose: his aim in inspection is an easy cross found quickly, which leaves time for the first pair. The rule above makes that trade deliberate. A short cross still has to turn well, too: a six with no B turns and no regrips beats a five that has them, as "Easy to turn beats one move shorter" showed.',
      ],
      checkpoint:
        "When you find a seven or an eight you look once more, and when you find a five you stop and go to the pair.",
    },
    {
      id: "insp-colour-tail",
      title: "What a second colour buys: a better worst case",
      takeaway:
        "Taking the better of two crosses barely moves the average but nearly removes the long ones, and whether that becomes time is something to measure, not assume.",
      minutes: 5,
      body: [
        "Choosing between crosses is taking the best of several draws, and the best of several draws moves the bad end far more than the middle. For the better of two crosses to be long, both have to be long. On one colour, a cross of seven or more turns up on about 18 scrambles in 100. With white and yellow both open it's about 3, close to what you'd expect if the two colours were independent, since 18% of 18% is about 3%. With all six colours it almost never happens.",
        "The middle moves much less. The average cross goes from 5.8 moves on one colour to 5.4 on two and 4.8 on six, and crosses of four moves or fewer go from about 6 scrambles in 100 to about 12 and then 29. So the usual headline, about a move off the average, undersells what changes most: the solves that start with a long, awkward cross mostly disappear, and those are the solves that turn into slow ones.",
        "The same is true of x-crosses. Johannes91's counts put an x-cross of six moves or fewer on about 11% of scrambles on one colour, about 20% when either colour of an opposite pair will do, and about 42% with all six.",
        "None of it is free. Every inspection now holds a decision, and F2L on a new colour takes weeks to months of reps, because the pairs go into different slots. Feliks Zemdegs tested it on himself with three sessions of 100 solves, alternated: fully neutral he averaged 6.28, white and yellow 6.54, white only 6.52. Full neutrality was worth about a quarter of a second; dual was worth nothing to him, and he was surprised how hard he found it, since the numbers make it look like a good compromise. The move counts tell you what is possible; only your own solves tell you what you get, which is what this pack's colour test is for.",
      ],
      checkpoint:
        "You can say what a second colour would change about your worst crosses, and you have numbers from your own solves rather than only the statistics.",
    },
    {
      id: "insp-xcross-supply",
      title: "How often an x-cross is really there",
      takeaway:
        "On one colour a six-move x-cross exists on about one scramble in nine and one of seven or fewer on about half, so aim for a rising share of those, not an x-cross every solve.",
      minutes: 4,
      body: [
        "An x-cross is a search with a known supply. Johannes91 counted the shortest x-cross over random scrambles, counting moves the same way as the cross counts. On one colour, with any of the four slots allowed, the best x-cross averages 7.35 moves. It is six or fewer on about 11% of scrambles, seven or fewer on about 54%, and eight or fewer on nearly all of them. Tied to one particular slot, the average is nearly eight.",
        "Those numbers set the ceiling. If you can find six-move x-crosses but not sevens, the most you'll get is about one solve in nine. Finding sevens reliably, before the 8-second call, raises it to about half. So the target is your x-cross share climbing toward that supply while your cross-plus-first-pair time gets faster, not an x-cross on every solve. An eight-move x-cross found at 13 seconds and never checked is worse than a plain cross and a pair you trust.",
        "The short ones come from the shapes you already know: a pair already joined somewhere, or a corner already on the bottom near its slot, which the cross moves can carry home. Feliks Zemdegs's 25 worked extended crosses are mostly six to eight moves, and when none can be planned he takes an easy plain cross and predicts the first pair instead. In the SpeedSolving x-cross thread experienced solvers describe the same habit: they build one when the scramble shows them blocks.",
        "Be careful what you compare yourself with. A world record single is the best of a very large number of solves, so it usually had a lucky start. Max Park's 3.13 opens with an xx-cross, the cross with two pairs, and Yusheng Du's 3.47 with an xx-cross that orients the edges as well. Yiheng Wang's 3.08 opens with a plain nine-move cross. A record shows what a scramble can give, not what to expect from yours.",
      ],
      checkpoint:
        "You know your x-cross share from your Cross + first pair attempts, and you judge it against the supply, not against every solve.",
    },
    {
      id: "insp-pseudo-xcross",
      title: "Pseudo x-cross: every corner with every edge",
      takeaway:
        "With the cross built a turn off, each slot takes its own edge and the corner the bottom will carry home. That makes all sixteen corner and edge combinations usable, at the price of pairs whose colours never match.",
      minutes: 5,
      body: [
        "A plain x-cross needs a true pair: a corner and the edge that belongs with it. There are four, and on most scrambles none is close. A pseudo x-cross widens the choice using the fact pseudo-slotting is built on: a turn of the bottom layer carries the cross and the bottom corners round with it, but leaves the middle-layer edges where they are.",
        "So build the cross a quarter or a half turn off. Each slot then needs its own edge in the middle layer, which the bottom never moves, and below it the corner that turning the bottom back will carry home. The bottom has four positions, and in exactly one of them a given corner's home sits under a given slot. So the four corners and four edges make sixteen combinations, and each one is a pair for one position of the bottom. A plain x-cross can use four of them; a pseudo x-cross can use all sixteen.",
        "The catch comes afterwards. Turn the bottom straight back and, unless the scramble already put one of the other pieces home, you don't have a finished pair: the edge is home in its slot, the corner is home in another, and each slot still needs its other piece. To finish them as pairs, leave the bottom turned through F2L. Every later pair is then a pseudo pair too, and one turn of the bottom at the end sends them all home. That is a lot of pairs whose colours don't match, which is exactly where pseudo-slotting goes wrong, so this belongs to solvers whose pseudo pairs are already reliable.",
        "It is more than a curiosity. Feliks Zemdegs's 4.22 world record single, as reconstructed on the SpeedSolving wiki, opens with a pseudo cross that becomes an x-cross after a three-move insert and a wide turn. Learn the shapes the way you learned x-crosses: on a trainer that hides the shortest solution until you ask for it, with unlimited time first.",
      ],
      examples: [
        {
          label: "A quarter off: the front-left corner with the front-right edge",
          moves: "R U R' D'",
          note: "The cross is in but a quarter turn off. Above the front-right slot sits the white-green-red corner, white facing right, and the green-orange edge is at the back of the top layer. Their colours don't match, but with the bottom turned this way they are a pair: R U R' puts them in together, and D' sends the corner home to the front-left while the edge stays home in the front-right. In a solve the D' waits for the end of F2L; here everything else is a quarter off too, so it finishes the cube.",
        },
        {
          label: "A half off: the back-left corner with the same edge",
          moves: "R U R' D2",
          note: "The same edge, the same R U R', but with the bottom a half turn off the white-blue-red corner is the one that fits, again above the slot with white facing right. D2 carries it home to the back-left, diagonally across from where it went in.",
        },
      ],
      checkpoint:
        "Given a corner and an edge from different pairs, you can say how far to turn the bottom so they go in together, and where each one lands when it turns back.",
    },
  ],
  drills: [
    {
      id: "insp-commit-drill",
      title: "Commit points",
      purpose:
        "Makes the phases a habit, using the same 8 and 12-second markers a judge calls, so planning stops spilling past the point where it pays.",
      rules: [
        "Turn on 15-second inspection and Inspection sounds in Settings.",
        "Settle the cross colour and first edge in the first few seconds. At the first tone the cross must be planned and checked once; between the tones, follow the first pair; at the second tone, drop anything you're unsure of.",
        "Start by about 14 seconds. After each solve, open it and note its inspection time.",
        "Mark any solve where you reopened a decision after its tone. Those are the ones to look at.",
      ],
      dose: "25 solves a session, three sessions a week for two weeks.",
      signal:
        "Your inspection times settle between about 12 and 14 seconds with little spread, you get no +2s, and fewer solves start the first pair with a search.",
    },
    {
      id: "insp-move-audit",
      title: "Count against the best cross",
      purpose:
        "Shows how far your crosses are from the shortest available, and whether your misses are the sevens and eights the stopping rule says to look at twice.",
      rules: [
        "Do a set of the Cross test as usual. After each attempt, write down how many moves your cross took.",
        "Paste the scramble into csTimer's cross solver, in its tools panel, to see the shortest cross for your colour, and for the other one if you choose between white and yellow.",
        "Note the difference, and mark every attempt where you did seven or more when six or fewer existed.",
      ],
      dose: "20 scrambles, once a week.",
      signal:
        "Your crosses average about a move or less over the shortest, and the marked attempts become rare.",
      exerciseId: "cross_only",
    },
    {
      id: "insp-colour-test",
      title: "Your own colour test",
      purpose:
        "Finds out whether choosing between two colours makes you faster, the way Feliks Zemdegs tested it on himself, instead of trusting the move counts.",
      rules: [
        "Pick two conditions: your usual colour only, and the better of white and yellow (or all six, if full neutrality is the question).",
        "Alternate in blocks: 25 solves of this drill on one condition, then 25 on the other, until each has 100.",
        "For each block, write down its mean and how many of its solves were 2 seconds or more over your usual average.",
        "Keep the second colour only if it wins on the slow solves or the mean, with its decision time paid for.",
      ],
      dose: "100 solves per condition, over one to two weeks.",
      signal:
        "The two-colour blocks show fewer slow solves and an equal or better mean. If after 100 each they don't, the answer for now is one colour.",
    },
    {
      id: "insp-plan-depth",
      title: "How far to plan",
      purpose:
        "Tests whether planning past the first pair helps you or slows you, instead of assuming more planning is better.",
      rules: [
        "Two conditions: the cross and first pair planned; or the cross, the first pair and where the second pair's corner will be.",
        "Alternate blocks of 25 solves of this drill, one condition each, until each has 50.",
        "Write down each block's mean, and count the solves where you stopped to check the plan.",
        "Keep the deeper plan only if it wins.",
      ],
      dose: "50 full solves per condition, over a week or two.",
      signal:
        "One condition is clearly faster across its blocks. If it's the deeper plan, keep it; if not, spend those seconds checking the first pair instead.",
    },
    {
      id: "insp-pseudo-trainer",
      title: "Pseudo x-cross study",
      purpose:
        "Learns what pseudo x-crosses look like with the clock off, so you know a short one when inspection shows you one.",
      rules: [
        "Use Solved's pseudo x-cross trainer, with unlimited time.",
        "For each scramble, find your best plain x-cross and your best pseudo x-cross, and count both.",
        "Reveal the shortest solution and note which kind won, and by how much.",
        "Do your pseudo one with your eyes closed, turn the bottom back, and check which pieces landed home.",
      ],
      dose: "Ten scrambles, twice a week.",
      signal:
        "Your pseudo solutions get closer to the trainer's shortest, and you find one within fifteen seconds on most scrambles.",
      untimed: true,
    },
  ],
  mistakes: [
    "Adding to the plan after the 12-second call instead of checking what you have.",
    "Reopening the colour choice halfway through inspection.",
    "Searching for one move off a five-move cross while the first pair goes unplanned.",
    "Taking a seven or an eight without one more look.",
    "Judging colour neutrality by the average cross, or adopting it without measuring your own solves.",
    "Expecting an x-cross every solve because record singles start with one.",
    "Turning the bottom straight back after a pseudo x-cross and leaving two half-filled slots.",
  ],
  sources: [
    SOURCES.crossStudy,
    SOURCES.xcrossCounts,
    SOURCES.neutralityExperiment,
    SOURCES.wcaRegulations,
    SOURCES.feliksCommentary,
    SOURCES.inspectionUse,
    SOURCES.extendedCross,
    SOURCES.xcrossThread,
    SOURCES.recordHistory,
    SOURCES.pseudoslotting,
    SOURCES.pseudoXcrossTrainer,
    SOURCES.csTimer,
  ],
};

/** A check question for every lesson in the pack; they belong in LESSON_QUIZZES. */
export const inspectionBudgetQuizzes: Record<string, LessonQuiz[]> = {
  "insp-commit-points": [
    {
      question:
        "At the 12-second call you're still unsure where your first pair's edge lands after the cross. What's the best use of the last seconds?",
      options: [
        "Keep tracking it: a full plan is worth the risk of a +2",
        "Drop the pair, check the cross start and begin by 14",
        "Switch to the other colour, which may leave an easier pair",
        "Use the two seconds of grace after 15, which cost nothing",
      ],
      answer: 1,
      why: "A half-held plan makes you stop to check it, and starting after 15 seconds costs two. Planning is worth most early; by 12 the cross you committed to is what counts, and the pair can be found while the cross goes in.",
    },
  ],
  "insp-stop-searching": [
    {
      question:
        "Five seconds in, you have a six-move cross that leaves an easy first pair. Should you keep looking for a five?",
      options: [
        "Yes: most scrambles have a cross of five or fewer",
        "No: a five exists only about a third of the time",
        "Yes: a six is rarely the shortest cross there is",
        "No: no cross is ever shorter than six moves",
      ],
      answer: 1,
      why: "Of the scrambles that have a cross of six or fewer, only about 37 in 100 have one of five or fewer. With an easy pair already there, the seconds are worth more following it than hunting for one move.",
    },
    {
      question: "Your cross took eight moves. What does that most likely mean?",
      options: [
        "The scramble was hard: eight comes up fairly often",
        "You missed a shorter one: eight is rarely the best",
        "Nothing: any cross of up to eight moves is fine",
        "You should have gone for an x-cross instead",
      ],
      answer: 1,
      why: "On one colour the best cross is eight moves on only about one scramble in 2,000. An eight almost always means a shorter cross was there, which is the signal to look once more the next time you find a seven or eight.",
    },
  ],
  "insp-colour-tail": [
    {
      question:
        "Going from white only to the better of white and yellow, which number changes most?",
      options: [
        "The average cross, which drops by about two moves",
        "How often you face a cross of seven or more",
        "How often the cross takes eight, from common to never",
        "Nothing much: both colours usually give the same cross",
      ],
      answer: 1,
      why: "The better of two draws mostly cuts the bad ones: crosses of seven or more fall from about 18 scrambles in 100 to about 3, while the average moves by less than half a move, from 5.8 to 5.4.",
    },
  ],
  "insp-xcross-supply": [
    {
      question:
        "On one cross colour, how often does a scramble have an x-cross of six moves or fewer?",
      options: [
        "Nearly every scramble, if you look hard enough",
        "On about half of all scrambles",
        "About one scramble in nine",
        "Never: an x-cross always takes ten or more",
      ],
      answer: 2,
      why: "Johannes91's counts put a six-move x-cross on about 11% of scrambles on one colour, and one of seven or fewer on about half. An x-cross every solve isn't on offer; the target is a rising share of the ones that are.",
    },
  ],
  "insp-pseudo-xcross": [
    {
      question: "Why can a pseudo x-cross use more corner and edge combinations than a plain one?",
      options: [
        "Bottom turns move the middle-layer edges, so any edge fits",
        "Each corner fits each edge for one turn of the bottom layer",
        "It leaves the corner out and places only the edge",
        "Turning the bottom changes which colour the cross is",
      ],
      answer: 1,
      why: "A bottom turn carries the corners round but leaves the middle-layer edges where they are. So for every corner and edge there is exactly one position of the bottom where that corner's home sits under that edge's slot: sixteen combinations instead of four true pairs.",
    },
    {
      question:
        "After a pseudo x-cross with the bottom a quarter off, you turn the bottom straight back. What do you have?",
      options: [
        "A cross and a finished pair, as with a plain x-cross",
        "A cross, an edge home in one slot and a corner in another",
        "A broken cross, since the cross edges move with the bottom",
        "Nothing new: the corner and edge both come back out",
      ],
      answer: 1,
      why: "Turning back sends the corner home to its own slot and leaves the edge home in its slot, so each of the two slots still needs its other piece. To finish them as pairs, keep the bottom turned, make every later pair a pseudo pair and turn it back once at the end of F2L.",
    },
  ],
};
