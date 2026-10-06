import { SOURCES } from "../sources";
import type { LessonQuiz, LevelPack } from "../types";

/*
 * The last layer from about 15 seconds to sub-10, where OLL and PLL are known
 * and the time left is around the algorithms: the corner read before OLL
 * (ROLL), the one sticker that splits look-alike PLLs, cancelling moves at the
 * OLL-to-PLL join, and splitting last-layer time with SolveLab's own tests.
 * Every corner table, sticker count, PLL row and cancelled sequence is checked
 * on the cube engine (tests/unit/night-last-layer-fast.test.ts).
 */

export const lastLayerWithoutGaps: LevelPack = {
  id: "last-layer-without-gaps",
  title: "The last layer without gaps",
  summary:
    "The one sticker that splits look-alike PLLs, OLL into PLL as one motion, the corner read before OLL, and where your last-layer seconds go.",
  levels: ["sub15", "sub12"],
  why: "From about 15 seconds down, OLL and PLL are learned and mostly quick. What's left in the last layer often sits between and around the algorithms: a PLL named from part of the row and then corrected, a stop after the OLL while the read finishes, a move at the join that cancels but gets turned anyway. For many solvers here the time is between the algorithms rather than in them, and SolveLab's three last-layer tests show which is true for you.",
  lessons: [
    {
      id: "gaps-confusable-plls",
      title: "The sticker that splits look-alike PLLs",
      takeaway:
        "Every PLL is one sticker away from another, and that sticker is always an edge or a far corner. Read all six, and read colours as opposite or neighbours.",
      minutes: 6,
      body: [
        "Two-sided recognition works because the row is complete. Two faces show six stickers: the front's three, then the right's three. SolveLab's cube engine finds 71 different rows across all 21 PLLs at every angle (the same pattern in other colours counts once), and none of them belongs to two PLLs. So when you misread a PLL, the information was in front of you: you decided before you had read it.",
        "Misreads come from reading part of the row. Every one of the 21 PLLs has another PLL whose row differs from it in a single sticker, and that sticker is always one of the two edges or one of the two far corners. It is never the corner nearest you, the one the two faces share, so the two stickers you probably look at first can't settle a case on their own. A read that takes in that corner and one or two more, and fills in the rest from what usually comes next, is a guess between neighbours.",
        "The second trap is reading for shape: which stickers match, and nothing about the colours themselves. Read that way, 54 patterns are left and 12 of them belong to two PLLs each. Aa, Ab and T share them; so do Ga, Gb and Rb; Gc, Gd and Ra; H and Z; Ua and Ub. In every one of the twelve, one question settles it: are two particular colours opposite each other on the cube (green and blue, red and orange) or neighbours?",
        "Two rules cover the pairs that cost the most. Headlights on both faces, with each edge a colour seen nowhere else in the row: if each edge is the opposite colour of its own headlights it's an H, and if it's a neighbour colour it's a Z. A row with the same colour at both ends and exactly one other colour twice, not side by side, is always an R or a G: if that twice-seen colour is opposite the end colour it's a G, and if it's a neighbour it's an R.",
        "Then build your own list. Every misread you log in the random-angle drill of Faster PLL is a pair; for each one, find the sticker or the opposite-or-neighbour question that splits it, and say it to yourself as you read until the read takes it in without trying.",
      ],
      examples: [
        {
          label: "H perm: edges opposite their headlights",
          moves: "M2 U M2 U2 M2 U M2",
          caseId: "pll-h",
          note: "Front: green, blue, green. Right: orange, red, orange. Blue is opposite green and red is opposite orange, so it's the H.",
        },
        {
          label: "Z perm: edges are neighbour colours",
          moves: "M' U M2 U M2 U M' U2 M2",
          caseId: "pll-z",
          note: "Front: red, blue, red. Right: green, orange, green. The same shape as the H above, but blue is a neighbour of red and orange a neighbour of green, so it's the Z.",
        },
        {
          label: "Ra perm: the twice-seen colour is a neighbour",
          moves: "R U' R' U' R U R D R' U' R D' R' U2 R'",
          caseId: "pll-ra",
          note: "Front: red, red, green. Right: orange, green, red. Red at both ends, green twice and not side by side; green is a neighbour of red, so it's an R.",
        },
        {
          label: "Gc perm: the twice-seen colour is opposite",
          moves: "R2 U' R U' R U R' U R2 U D' R U' R' D",
          caseId: "pll-gc",
          note: "Front: green, blue, orange. Right: blue, red, green. Green at both ends, blue twice and not side by side; blue is opposite green, so it's a G.",
        },
      ],
      checkpoint:
        "For the two PLLs you confuse most, you can name the sticker or the opposite-or-neighbour question that splits them.",
    },
    {
      id: "gaps-one-motion",
      title: "OLL into PLL as one motion",
      takeaway:
        "Where the OLL's last move and the PLL's first move cancel, turn neither; where they don't, start the PLL from the grip the OLL leaves you in.",
      minutes: 4,
      body: [
        "The end of the OLL, the PLL's set-up turn and the start of the PLL are usually three things your hands do one after another. They can merge. When the OLL ends with R' and the PLL, at the angle it arrives, starts with R, the two cancel and neither gets turned. The moves either side can then merge too: Sune into a T perm that needs no set-up turn loses its R' and R, then Sune's U2 and the T perm's first U make a single U', and 21 moves become 18. OLL 33 into a Y perm loses an F' and an F, and its two R turns become an R2, so 25 moves become 22.",
        "Fast solvers use this. In one PLL time-attack sequence of Yiheng Wang's, moves cancelling between algorithms took it from 300 moves to 280. Community time-attack rules forbid cancelling, so his 280-move run doesn't count as a legal attempt; in a solve nothing forbids it.",
        "Where nothing cancels, the join is a matter of grip. Every OLL algorithm finishes with your hands somewhere, and every PLL algorithm starts from somewhere. If the PLL you get needs a regrip to begin, that regrip is a stop. Jayden McNeill's advice on AUFs applies here: make each AUF without an awkward regrip, and where the grip makes one awkward, do the U turn before the algorithm instead of after it, or pick a different algorithm for that AUF. At the join, that means a PLL algorithm or angle that starts from the grip you're in, which is what the second angles in Predict the PLL are for.",
        "Map your own joins: the last move and grip of your five most common OLLs, the first move and grip of the PLLs you meet most, and the pairings that force a regrip.",
      ],
      examples: [
        {
          label: "Sune into a T perm, cancelled",
          moves: "R U R' U R U' R' U' R' F R2 U' R' U' R U R' F'",
          note: "Sune (R U R' U R U2 R') then the T perm (R U R' U' R' F R2 U' R' U' R U R' F') when the T needs no set-up turn. The R' and R cancel, the U2 and U make a U', and 21 moves become 18.",
        },
        {
          label: "OLL 33 into a Y perm, cancelled",
          moves: "R U R' U' R' F R2 U' R' U' R U R' F' R U R' U' R' F R F'",
          note: "OLL 33 (R U R' U' R' F R F') then the Y perm (F R U' R' U' R U R' F' R U R' U' R' F R F'). The F' and F cancel and the two R turns become an R2, so 25 moves become 22.",
        },
        {
          label: "Yiheng Wang's last layer in a 4.49",
          moves: "R U R' U' R' F R F' U' R U' R' U' R U R D R' U' R D' R' U2 R' U'",
          note: "OLL 33, then a U', the Ra perm and a U' to finish: 25 moves in 1.59 s. Even at this speed the PLL has a turn before it and one after; nothing cancels at this join, so the saving there is in knowing both turns before they're needed.",
        },
      ],
      checkpoint:
        "You know which of your common OLL-and-PLL pairings cancel, and none of the pairings you meet most needs a regrip.",
    },
    {
      id: "gaps-corners-before-oll",
      title: "Read the corners before the OLL",
      takeaway:
        "An OLL moves corners the same way every time, so the PLL's corner group is fixed before you start, and on some OLLs two faces' corner stickers show it.",
      minutes: 6,
      body: [
        "An OLL algorithm turns pieces to face up, but it also moves them, and it moves them the same way every time. So which corners the PLL will have to swap is settled before the OLL's first move. There are three groups: corners already right, which leaves a U, H or Z perm or a skip; one side with matching corners, which is an A, F, G, J, R or T perm; and no side with matching corners, an E, N, V or Y. Reading the group before the OLL is called ROLL. It comes earlier than the glance in Predict the PLL, and it works on OLLs that end with an F turn, where that glance can't. Feliks Zemdegs uses the same fact with blocks in his commentary on a 5.80 average: he knew his OLL algorithm keeps a corner-and-edge block and attaches another corner to it, so a block of three would end up on the left, the PLL would be a J or an F, and there was almost no pause between the OLL and the J perm.",
        "What you read is the corner stickers on two faces, and whether each face's pair is the same colour, opposite colours (green and blue, red and orange) or neighbours. The table belongs to one algorithm done from one angle, so each OLL has its own. For the T shape done as F R U R' U' F', which ends with an F, look at the front and right faces. Neighbours on the front and opposites on the right: the corners will be solved. Neighbours on the front and a match on the right: no side will match. Opposites on both: matching corners on the left. Opposites on the front and a match on the right: matching corners on the right. Neighbours on both: matching corners at the front or the back.",
        "Two OLLs are easier still. OLL 28 and OLL 57 already have every corner facing up, so the corners' side stickers show the group already, and SolveLab's algorithms for them keep it where it is: corners that match on a side now still match on that side after the OLL. The rare OLL 20 has its corners up too and keeps the group, but its algorithms carry the matching side one face round.",
        "Not every OLL reads this way. For Sune and Antisune, done as R U R' U R U2 R' and R U2 R' U' R U' R', the corner stickers on the front and right, or the left and front, don't settle the group, because a twisted corner shows yellow where one of its colours would be. The pair of faces that would settle it is the back and left, which you can't see. Jayden McNeill counts six corner cases (corners solved, no side matching, and matching corners on each of the four sides) and advises starting small: you can get a long way knowing only two of them, corners solved and no side matching, and add the rest as they come.",
        "Work a new OLL out on the cube. Do a random U turn, any PLL algorithm backwards, another random U turn, then the OLL algorithm backwards; read the two faces, do the OLL, and see what you got. Repeat until each pattern has turned up a few times. What it buys is the group, not the exact case: you start the PLL read knowing which part of the list to look in, and two-sided recognition finishes the job.",
      ],
      examples: [
        {
          label: "T shape: read the front and the right",
          moves: "F R U R' U' F'",
          caseId: "oll-45",
          note: "Front neighbours, right opposites: corners solved. Front neighbours, right match: no side matches. Both opposites: matching corners on the left. Front opposites, right match: on the right. Both neighbours: at the front or back.",
        },
        {
          label: "P shape: read the left and the front",
          moves: "F U R U' R' F'",
          caseId: "oll-44",
          note: "Left opposites, front neighbours: corners solved. Left match, front neighbours: no side matches. Left match, front opposites: matching corners on the left. Both opposites: on the right. Both neighbours: at the front or back.",
        },
      ],
      checkpoint:
        "Before F R U R' U' F' you can call the corner group from the front and right faces, and the call is right.",
    },
    {
      id: "gaps-ll-budget",
      title: "Where your last-layer time goes",
      takeaway:
        "Split the last layer with SolveLab's three tests before choosing what to work on, and price every fix by how often it applies times what it saves.",
      minutes: 5,
      body: [
        "A last layer is seven pieces of time: reading the OLL, its set-up turn, the OLL itself, reading the PLL, its set-up turn, the PLL, and the final turn. Only two of them are algorithms. SolveLab's last-layer tests split them for you. The OLL test times the first three; the PLL test times the last four from a standing start; the OLL + PLL test times all seven in one go. Your solve profile's OLL → PLL figure is the OLL + PLL time minus the other two, so it measures the join, and it falls as more of the PLL read moves inside the OLL.",
        "For many solvers here the time is between the algorithms rather than in them; the three tests show which is true for you. At the top the algorithms themselves are very fast: in Yiheng Wang's 4.49, reconstructed on reco.nz, the last layer was 25 moves in 1.59 s, 15.72 turns a second, against 12.25 for the whole solve and 10.34 for F2L. Caleb Valenzuela's sub-10 guide asks for 80% of OLLs and PLLs under a second each. So if your OLL and PLL tests are near the goals your profile shows but your OLL + PLL time is well above the two added together, the seconds are in the join and the reading, not your hands. A slow PLL test with a small join is the opposite case, and the worst-three drill in Faster PLL is the work.",
        "Price every fix the same way: how often it applies, times what it saves when it does. COLL only applies when the top edges come out oriented, about one solve in eight. Suppose it saves you 0.4 s on those: that's 0.05 s a solve on average. Cutting your join by 0.1 s saves 0.1 s on every solve, twice as much, with no new algorithms to learn.",
        "One solver who measured himself found he paused about half a second between OLL and PLL. On one OLL case, an algorithm about 0.2 s slower that let him read the PLL while it ran still came out ahead, though he recommends plain OLL then PLL for most cases. Run your own numbers the same way: take the three tests, find the biggest gap against the goals your profile shows, fix that one thing, and test again.",
      ],
      checkpoint:
        "You know your OLL → PLL figure, and whether your next last-layer week goes on reading and joins or on execution.",
    },
  ],
  drills: [
    {
      id: "gaps-freeze-and-name",
      title: "Freeze and name",
      purpose:
        "Times the PLL read on its own, at a random angle, so a slow or wrong read can't hide inside the algorithm.",
      rules: [
        "Use the PLL test's scrambles, turned over as it says. Look at the front and right faces only; don't turn the cube or the top.",
        "Start the timer, read all six stickers, and stop it the moment you can name the case, the turn before it and the turn after it.",
        "Say all three out loud, then solve to check. The solve isn't timed.",
        "Log every misread as the pair you confused and the sticker or opposite-or-neighbour question that should have decided it.",
      ],
      dose: "Forty reads a session, twice a week.",
      signal:
        "The session mean falls week on week, and each session logs fewer misreads, all of them on pairs you've written a rule for.",
      exerciseId: "pll_only",
    },
    {
      id: "gaps-cancel-pairs",
      title: "Joins that cancel",
      purpose:
        "Turns your commonest OLL-to-PLL joins into one movement: cancelled moves left out and the PLL started from the grip the OLL leaves.",
      rules: [
        "List your five most common OLLs with the last move and grip of each, and the PLLs you meet most with the first move and grip of each.",
        "Pair them up: where an OLL's last move cancels a PLL's first one (R' then R, F' then F), write out the merged sequence; where a pairing needs a regrip, find another algorithm or angle for that PLL that doesn't.",
        "Set a pairing up by doing the PLL backwards, then the OLL backwards. Run OLL into PLL as one sequence, the cancelled moves left out.",
        "Ten reps of each pairing, slowly until the merged version is the one your hands reach for.",
      ],
      dose: "Five pairings, ten reps each, twice a week for three weeks.",
      signal:
        "Each pairing runs five times in a row with no regrip and no stop, and your OLL → PLL figure in the weekly check comes down.",
      untimed: true,
    },
    {
      id: "gaps-weekly-join",
      title: "The weekly join check",
      purpose:
        "Tracks the OLL-to-PLL join with SolveLab's own tests, so you can see whether the reading and joining work is landing.",
      rules: [
        "In one session, take the OLL test, the PLL test and the OLL + PLL test. In the OLL + PLL test, go from the OLL into the PLL without stopping.",
        "Open your solve profile and read the OLL → PLL figure, the OLL + PLL time minus the other two. Write it down with the date.",
        "Compare it with last week's, and with the goal your profile shows beside it.",
      ],
      dose: "Once a week.",
      signal:
        "The OLL → PLL figure falls week on week towards the goal your profile shows, while the OLL and PLL tests hold steady.",
      untimed: true,
    },
    {
      id: "gaps-call-corners",
      title: "Call the corners first",
      purpose:
        "Builds the corner read one OLL at a time, away from solves, until the call comes before your first move.",
      rules: [
        "Pick one OLL from the lesson; start with the T shape, F R U R' U' F'.",
        "Set it up: a random U turn, any PLL algorithm backwards, another random U turn, then the OLL algorithm backwards.",
        "Before touching it, read the corner stickers on the two faces the lesson names and call the group: corners solved, no side matching, or matching corners on the left, on the right, or at the front or back.",
        "Do the OLL, check the call and tally it. Add the next OLL only when a whole session's calls are right.",
      ],
      dose: "Thirty calls a session, three sessions a week, one OLL at a time.",
      signal:
        "Your hits out of thirty climb until every call is right, and in solves you start that OLL already knowing the group.",
      untimed: true,
    },
  ],
  mistakes: [
    "Naming the PLL from four or five stickers and filling in the rest from habit.",
    "Reading which stickers match but not whether two colours are opposite or neighbours, so an H passes for a Z and an R for a G.",
    "Turning an OLL's last R' and the PLL's first R as two moves.",
    "Taking a fast PLL time attack as proof your in-solve PLL is fast: a time attack has no read, no random angle and no set-up turn to find.",
    "Learning the corner read for every OLL at once instead of one OLL until the call is automatic.",
    "Spending months on a set that applies one solve in eight while the join between OLL and PLL costs you on every solve.",
  ],
  sources: [
    SOURCES.twoSidedGuide,
    SOURCES.twoSidedPll,
    SOURCES.pllTimeAttack,
    SOURCES.aufTips,
    SOURCES.feliksCommentary,
    SOURCES.roll,
    SOURCES.ocllPermutations,
    SOURCES.yihengRecon,
    SOURCES.subTen,
    SOURCES.ollPllPause,
    SOURCES.algSets,
  ],
};

/** A check question for each lesson; spread into LESSON_QUIZZES when the pack is wired in. */
export const lastLayerWithoutGapsQuizzes: Record<string, LessonQuiz[]> = {
  "gaps-confusable-plls": [
    {
      question:
        "Two PLLs you keep confusing differ by a single sticker in the two-sided row. Which sticker can it never be?",
      options: [
        "One of the two edges, the middle sticker of either face",
        "The corner nearest you, the one both faces share",
        "The far corner on the front face, out at the left end",
        "The far corner on the right face, out at the right end",
      ],
      answer: 1,
      why: "On SolveLab's cube engine, every pair of PLLs one sticker apart differs at an edge or a far corner, never at the shared corner. So a read that starts at that corner must go on to the edges and far corners before it names anything.",
    },
    {
      question:
        "Both faces show headlights, and each edge is a colour seen nowhere else in the row. How do you tell the H from the Z?",
      options: [
        "Count the colours: the H shows four in the row and the Z three",
        "See whether each edge is opposite its own headlights' colour",
        "Look for a block of two beside one of the headlights",
        "Check whether the corner nearest you shows matching stickers",
      ],
      answer: 1,
      why: "Both rows have the same shape and the same four colours, so only the colours' relation settles it: edges opposite their own headlights make the H, neighbour colours make the Z.",
    },
  ],
  "gaps-one-motion": [
    {
      question:
        "Your OLL ends with R', and the PLL, at the angle it arrived, starts with R. What should happen at the join?",
      options: [
        "Turn both quickly, so the pause between them stays as short as it can",
        "Turn neither: they cancel, and the turns beside them may merge",
        "Turn the top first so the PLL starts from your usual grip",
        "Turn the R' slowly so your grip is set for the R that follows",
      ],
      answer: 1,
      why: "R' then R is no move at all. Leaving both out also brings the turns either side together, as Sune's U2 and the T perm's U become one U'.",
    },
  ],
  "gaps-corners-before-oll": [
    {
      question: "Why can the PLL's corner group be read before the OLL algorithm even starts?",
      options: [
        "OLL algorithms only turn corners in place, so the PLL already shows",
        "An OLL moves corners the same way every time, fixing the outcome",
        "The yellow stickers on the sides show which corners will swap",
        "The OLL's last trigger shows the PLL before the algorithm ends",
      ],
      answer: 1,
      why: "An OLL algorithm moves corners as well as turning them, but always in the same way. So the corners' arrangement before it decides the arrangement after it, and the PLL's corner group is fixed before the first move.",
    },
  ],
  "gaps-ll-budget": [
    {
      question:
        "COLL would save you 0.4 s on the solves it applies to, about one in eight. Cutting your OLL-to-PLL join by 0.1 s applies to every solve. Which saves more per solve?",
      options: [
        "COLL: 0.4 s is four times as much as 0.1 s",
        "The join: 0.1 s a solve against about 0.05 s",
        "They come to the same, about 0.1 s a solve each",
        "COLL, once its recognition is as quick as OLL's",
      ],
      answer: 1,
      why: "A saving counts only as often as it applies: 0.4 s on one solve in eight is 0.05 s a solve on average, while 0.1 s on every solve is 0.1 s.",
    },
  ],
};
