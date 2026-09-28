import { SCRAMBLE_HOLD, SOLVING_ROTATION, SOLVING_VIEW } from "@/lib/config/cube";
import { SOURCES } from "../sources";
import type { AspectPack } from "../types";

export const crossEfficiency: AspectPack = {
  id: "cross-efficiency",
  aspectId: "cross",
  title: "A cross worth eight moves",
  summary: "Why a short cross is a different skill from a fast cross, and how to find one.",
  levels: ["sub120", "sub60", "sub45", "sub30"],
  why: "A slow cross is almost never slow hands. It is a long solution — twelve or fourteen moves where seven would do — found one edge at a time while the timer runs, usually with a cube rotation thrown in to see the piece you lost.",
  lessons: [
    {
      id: "cross-bottom",
      title: "Solve it on the bottom",
      takeaway:
        "Solving the cross on top costs you a whole-cube flip on the clock and hides the slots you are about to fill.",
      minutes: 3,
      body: [
        "Most people learn the cross on the top face, because that is where you can see it. Every one of those solves then needs a z2 or x2 flip before F2L can start, and during the cross itself you are looking at the face you are building rather than the four slots you are about to fill.",
        "The flip does not disappear; it moves into inspection, where it is free. Scrambles go on with white on top, so turn the cube over with z2 before you start planning (x2 works too, but brings blue to the front instead of green). Then plan and solve the cross with white on the bottom and yellow on top, and leave it that way up for the rest of the solve.",
        "Solving it on the bottom feels blind at first. It is not: after two or three sessions you read the cross from the side stickers and the bottom edge of each face, the same way you will later read an F2L pair. What you gain is the rotation, the view of the slots, and the ability to see a pair forming while you finish the cross.",
        "If you are still solving on top, switch now rather than later. The habit gets more expensive the more solves you have built on it, and the relearning takes about a week at any level.",
      ],
      checkpoint: "You can solve a cross on the bottom without turning the cube over to check it.",
    },
    {
      id: "cross-move-count",
      title: "Count moves, not seconds",
      takeaway:
        "The cross is a move-count problem. Eight moves is the number to aim at; the solution always exists.",
      minutes: 4,
      body: [
        "Any cross can be solved in eight moves or fewer, and most in six or seven. That is a mathematical fact about the position, not an aspiration, which makes the cross unusual: you can always tell whether your solution was good, by counting it.",
        "The gap between a beginner cross and a good one is wide. Rough bands people quote are ten to fifteen moves for a beginner, eight to ten for an intermediate solver, six to eight for an advanced one. At three turns a second, the difference between fifteen moves and seven is nearly three seconds — more than most people ever gain from turning faster.",
        "Efficient crosses rarely look like the obvious solution. They solve edges out of the order you first spotted them, they use the D layer to move three edges at once, and they set two edges up with one move so a single turn finishes both. None of that is visible if you solve edge by edge as you find them.",
        "The practical habit: after each solve, replay the cross you did and ask whether a shorter one existed. You do not need software for this. Just counting is enough to make you look for the shorter one next time.",
      ],
      checkpoint: "You can say how many moves your last cross took, and it is usually under ten.",
    },
    {
      id: "cross-pairing-edges",
      title: "Pair edges before you place them",
      takeaway:
        "Two edges moved into the same D layer face can often be finished with one turn instead of two solutions.",
      minutes: 4,
      body: [
        "The saving in a short cross comes from moves that do two jobs. The most common shape: bring two cross edges so that they sit correctly relative to each other but in the wrong place, then turn D once to put both home.",
        "This is why solving edges strictly one at a time is expensive. Each edge gets its own two-to-four move solution, so four edges cost you twelve to sixteen moves. Handling them in pairs typically brings the same cross in under eight.",
        "Look for the edges that are already correct relative to each other first — two edges in the D layer next to each other with the right colours adjacent, even if both are misplaced. Those are free: one D turn fixes both once the others are in.",
        "The other common saving is the edge already in the bottom layer but flipped or in the wrong slot. Do not take it out to the top and put it back. A single move of its face, then a D turn, then the face back, handles it in three.",
      ],
      examples: [
        {
          label: "Wrong slot, right layer",
          moves: "R' D' R",
          note: "An edge sitting in the bottom layer in the wrong place: one turn out, D to line up, one turn back. Three moves, no trip to the top.",
        },
        {
          label: "Flipped in place",
          moves: "F' D R' D'",
          note: "An edge in its slot but flipped. Taking it to the top and back costs more than moving it round the bottom.",
        },
      ],
      checkpoint: "You notice when two cross edges are already correct relative to each other.",
    },
    {
      id: "cross-colour-neutral",
      title: "Colour neutrality, and when it is worth it",
      takeaway:
        "Choosing between six crosses instead of one usually saves a move or two, and it is mostly a decision rather than a skill.",
      minutes: 3,
      body: [
        "If you always solve the white cross, you get whatever white cross the scramble gives you. If you can solve any of the six, you pick the easiest one. In practice this is worth roughly a move or two on the cross, plus a better start to F2L, because the easiest cross usually leaves the friendliest pairs.",
        "It is less of a project than it sounds. Most of what you are doing is the same recognition with different colours; what you are really changing is the decision to look. People who switch at an intermediate level often report being dual neutral, white and yellow, within a week or two, and fully neutral in a few more weeks of ordinary solving.",
        "The cost is real though, and it scales with how much you have already built. Switching is cheap below about fifteen seconds and expensive above it, so if you are going to do it, do it now rather than after another year of white crosses. One account of a full switch at a high level described five months before times came back to where they started.",
        "Dual neutrality — white and yellow — is the cheap middle. It takes days rather than weeks, because the two crosses are mirror images of each other, and it captures a good share of the benefit.",
      ],
      checkpoint: "During inspection you look at more than one colour before deciding.",
    },
  ],
  drills: [
    {
      id: "cross-eight-move-hunt",
      title: "The eight-move hunt",
      purpose:
        "Forces you to search for a short solution instead of taking the first one you see. This is the skill; speed follows it.",
      rules: [
        "Scramble, then take as long as you like — a minute if you need it — to find a cross solution of eight moves or fewer.",
        "Write the solution down before you touch the cube.",
        "Execute it and check the cross is right. If it is longer than eight, keep looking before you execute.",
        "Do not time anything. The point is the search, not the hands.",
      ],
      dose: "Ten scrambles, two or three times a week for a fortnight.",
      signal:
        "The time you need to find an eight-move solution drops from a minute to about twenty seconds, and then towards fifteen — which is inspection.",
    },
    {
      id: "cross-replay",
      title: "Replay and shorten",
      purpose:
        "Shows you the gap between the cross you did and the cross that existed, which is the only feedback that actually changes your choices.",
      rules: [
        "Do a normal timed solve, but stop after the cross and write down the moves you made.",
        "Scramble the same scramble again and try to beat your own move count.",
        "Note what you missed: an edge you took to the top unnecessarily, a rotation, a pair you did not see.",
      ],
      dose: "Five scrambles at the end of a session.",
      signal:
        "Your first attempt and your second attempt converge; you stop finding two moves to cut.",
    },
    {
      id: "cross-other-colours",
      title: "One colour a day",
      purpose: "Turns colour neutrality from a project into a week of ordinary solving.",
      rules: [
        "Pick a colour that is not your usual one and solve only that cross for a whole session.",
        "Expect it to be slow and ugly. It is the same skill with unfamiliar colours, not a new skill.",
        "Rotate through the six over a week, then start choosing freely.",
      ],
      dose: "One session per colour, then free choice.",
      signal: "You stop having to think about which face is which before you can plan.",
    },
  ],
  mistakes: [
    "Solving the cross edge by edge in the order you spot them, which roughly doubles the move count.",
    "Taking an edge that is already in the bottom layer all the way to the top to re-insert it.",
    "Rotating the cube mid-cross to find an edge you lost track of.",
    "Practising the cross by turning faster, when the problem is that the solution was too long.",
  ],
  sources: [
    SOURCES.jpermCross,
    SOURCES.cubefreakCross,
    SOURCES.crossPlanning,
    SOURCES.colourNeutrality,
    SOURCES.colourNeutralWiki,
  ],
};

export const inspection: AspectPack = {
  id: "inspection",
  aspectId: "cross_planning",
  title: "Using all fifteen seconds",
  summary: "Planning is a trainable ladder, not a talent. Here are its rungs.",
  levels: ["sub60", "sub45", "sub30", "sub25", "sub20", "sub15", "sub12"],
  why: "If your cross is slower with fifteen seconds of inspection than it is with unlimited inspection, you are finishing your planning while the timer runs. Every move you plan on the clock costs you roughly the time it takes to make it, twice.",
  lessons: [
    {
      id: "inspection-what-it-is",
      title: "What inspection is actually for",
      takeaway:
        "Fifteen seconds of thinking is free. Any planning you push into the solve is paid for at full price.",
      minutes: 3,
      body: [
        "Competition rules give you up to fifteen seconds to look at the cube before the timer starts, during which you may hold and turn the puzzle over in your hands but not turn any layer. That time is free: nothing you work out in it costs you anything.",
        `Spend the first second of it getting into your solving hold. Scrambles are applied with ${SCRAMBLE_HOLD}, so turn the cube over with ${SOLVING_ROTATION}, which keeps ${SOLVING_VIEW.F} in front (x2 does the same job but brings blue round to the front). Then plan the cross where you will solve it, with ${SOLVING_VIEW.D} on the bottom and ${SOLVING_VIEW.U} on top, rather than planning it on top and turning over afterwards.`,
        "The moment the timer starts, thinking is expensive. A pause to work out the next cross edge costs you a second that a plan would have cost nothing. This is why the gap between your timed cross and your unlimited-inspection cross is a real measurement of something: it is exactly the planning you did not finish in time.",
        "So the goal of inspection is not to look at the cube. It is to arrive at the start of the solve with nothing left to decide about the cross.",
      ],
    },
    {
      id: "inspection-ladder",
      title: "The planning ladder",
      takeaway:
        "Plan one edge, then two, then three, then four. Each rung is a real amount of work, and most people stall on the third.",
      minutes: 5,
      body: [
        "Planning the whole cross at once is not a thing you decide to do; it is the top of a ladder. The rungs go like this.",
        "First: find all four cross edges within about six seconds. Just locate them — do not solve anything. This is pure scanning, and it is the rung nearly everyone can reach in a week.",
        "Second: plan the shortest solution for one edge, two to four moves, completely, before you start.",
        "Third: hold the cube state in your head after that first edge is placed, and plan the second edge from the new position. This is the rung that stops people, because it is the first one that needs you to imagine a cube you cannot see. It is worth grinding; everything above it is the same skill repeated.",
        "Fourth: three edges, with a check of the whole sequence before you move. Fifth: all four, planned and verified, before your hands do anything.",
        "The reason to go rung by rung rather than attempting the whole cross is that partial planning is already valuable. Two edges planned is two edges you do not stop for.",
      ],
      checkpoint: "You can plan two edges and execute both without looking for the second one.",
    },
    {
      id: "inspection-tracking",
      title: "Tracking a piece through moves",
      takeaway:
        "Planning is tracking: following where a piece goes when you turn a face you have not turned yet.",
      minutes: 4,
      body: [
        "The mechanical skill under cross planning is being able to say where a piece will be after a move. Most people can do this for one move and lose it by the third, which is exactly why the third rung of the ladder is hard.",
        "Practise it away from solving. Hold a solved cube, pick a piece, close your eyes, do R U R' and say where that piece is now. Open your eyes and check. Then do it with a longer sequence. This is dull and it works, and it transfers directly to F2L lookahead later, where the same skill is worth much more.",
        "It also helps to reduce how much you have to track. Plan solutions that keep the pieces you care about out of the way: if your next edge is in the top layer, a solution for the current edge that does not disturb the U layer means you have nothing to re-find.",
      ],
      checkpoint:
        "After a four-move sequence on a solved cube, you can name where a chosen piece ended up.",
    },
    {
      id: "inspection-next-pair",
      title: "When the cross is easy, look further",
      takeaway: "The next thing to plan is not a better cross. It is your first F2L pair.",
      minutes: 3,
      body: [
        "Once the cross reliably takes eight or nine seconds of your inspection, the remaining seconds have a better use than double-checking: find the pair you will do first.",
        "You do not need to plan its moves. Simply knowing which corner and which edge you are going for removes the pause at the start of F2L, which is one of the more expensive pauses in the solve because it happens while your hands are already moving.",
        "The step after that is the extended cross, or x-cross: noticing during inspection that one pair will be nearly made by your cross solution anyway, and choosing a cross that finishes it. It is genuinely advanced and needs the rest to be automatic first, but the payoff is real: one fewer pair to find, and the ones that remain are easier to read because more of the cube is solved.",
      ],
    },
  ],
  drills: [
    {
      id: "inspection-blind-cross",
      title: "Blind cross",
      purpose:
        "The only honest test of whether you planned the cross or just started it. You cannot fake this one.",
      rules: [
        "Plan the cross in fifteen seconds.",
        "Close your eyes and solve it.",
        "Open them. If the cross is right, your plan was complete. If not, work out which edge you lost and at which move.",
      ],
      dose: "Ten a session, three sessions a week.",
      signal:
        "Your hit rate goes from a third to most of them. When it is reliable, add the first pair and do the same thing.",
      exerciseId: "cross_only",
    },
    {
      id: "inspection-unlimited",
      title: "Unlimited inspection, then close the window",
      purpose:
        "Separates 'I cannot plan this' from 'I cannot plan this in fifteen seconds', which need different work.",
      rules: [
        "Take as long as you like to plan the cross and the first pair. Execute.",
        "Do the same scramble again with thirty seconds. Then twenty. Then fifteen.",
        "Whatever falls apart as the window shrinks is your real weakness.",
      ],
      dose: "Five scrambles, once a week.",
      signal: "Your unlimited-inspection cross and your fifteen-second cross converge.",
      exerciseId: "cross_unlimited",
    },
    {
      id: "inspection-track-a-piece",
      title: "Track one piece",
      purpose:
        "Builds the raw ability to imagine the cube after moves, which every planning rung sits on.",
      rules: [
        "Solved cube. Pick a corner or edge and watch where it is.",
        "Close your eyes, do a short sequence — R U R' U' to start — and say out loud where the piece is.",
        "Check. Work up to seven or eight move sequences.",
      ],
      dose: "Five minutes, most days. It is a warm-up, not a session.",
      signal: "You stop losing the piece at move three.",
    },
  ],
  mistakes: [
    "Spending inspection looking at the cube rather than deciding on moves.",
    "Planning four edges badly instead of two edges properly — a half-remembered plan costs more than no plan.",
    "Skipping the two-edge rung and attempting the full cross, which usually stalls for months.",
    "Never checking whether the plan was right, so mistakes in tracking never get found.",
  ],
  sources: [
    SOURCES.crossPlanning,
    SOURCES.wcaRegulations,
    SOURCES.crossPlusPair,
    SOURCES.extendedCross,
  ],
};

export const crossIntoF2l: AspectPack = {
  id: "cross-into-f2l",
  aspectId: "cross_to_f2l",
  title: "The join after the cross",
  summary:
    "Why there is a pause between a finished cross and a started pair, and how to remove it.",
  levels: ["sub45", "sub30", "sub25", "sub20", "sub15", "sub12"],
  why: "Your cross is fine and your F2L is fine, but doing them one after the other takes longer than doing them separately. The extra time is a pause: the cross finished and your eyes started looking, from scratch, for a pair.",
  lessons: [
    {
      id: "join-why-it-exists",
      title: "Where the pause comes from",
      takeaway:
        "You finish the cross with your attention on the cross. The pause is the cost of switching targets.",
      minutes: 3,
      body: [
        "The last moves of a cross are usually easy and your eyes have nothing to do. If you spend them watching the cross finish, the moment it does you are starting a search with no information, and the search takes a second or more.",
        "This is the same problem as F2L lookahead, one stage earlier, and it has the same fix: use the free attention. While your hands do the last two or three cross moves, your eyes should already be somewhere else.",
        "Two things make this easier. Knowing which pair you want before you start, from inspection — that removes the search entirely. And planning a cross whose last moves do not scatter the top layer, so the pieces you identified are still where you left them.",
      ],
    },
    {
      id: "join-first-pair",
      title: "Choosing the first pair before you need it",
      takeaway:
        "Any decision made during inspection is a decision you are not making on the clock.",
      minutes: 4,
      body: [
        "After the cross is planned, the cheapest next thing is to pick your first pair. Not to plan it — just to decide which corner and which edge, and roughly where they will be once the cross is done.",
        "Which pair to pick matters less than picking one. That said, there are useful preferences: a pair whose pieces are both in the top layer is easiest to track, and a pair that goes into a slot you can reach without rotating is worth more than a marginally shorter one somewhere awkward.",
        "If you cannot find a pair in the inspection you have left, look for just the corner. Half the information removes most of the pause, and the edge is easier to find once you know which slot you are heading for.",
      ],
      checkpoint: "You start F2L with your hands moving, not with your eyes searching.",
    },
    {
      id: "join-xcross",
      title: "The extended cross",
      takeaway:
        "Sometimes the cross solution is one or two moves away from also solving a pair. Taking it removes a quarter of F2L.",
      minutes: 4,
      body: [
        "An x-cross is a cross solution that finishes one F2L pair at the same time. It is not a separate technique so much as a choice: among the several cross solutions a scramble allows, one of them may leave a corner and edge already paired, or nearly so.",
        "The benefit is bigger than one pair of time. You start F2L with three slots instead of four, which means fewer pieces to search among and an easier read for everything that follows.",
        "It is genuinely advanced, and worth being honest about the prerequisite: you need to plan a plain cross reliably first, because an x-cross is planning a cross while tracking two extra pieces. Trying it before then produces crosses that are worse in the normal case in exchange for an x-cross you rarely spot.",
        "The way in is to practise noticing rather than forcing. During inspection, once your cross is planned, ask whether any corner-edge pair will happen to be solved or adjacent afterwards. Say yes or no and move on. After a few hundred solves of just noticing, the cases start suggesting themselves.",
      ],
    },
  ],
  drills: [
    {
      id: "join-cross-plus-one",
      title: "Cross plus one, planned",
      purpose:
        "Trains the decision rather than the execution. What you are practising is arriving at F2L already knowing where to go.",
      rules: [
        "Plan the cross and identify the first pair during inspection.",
        "Solve the cross and that pair. Stop the timer there.",
        "If you had to search for the pair after the cross, the rep did not count.",
      ],
      dose: "Ten attempts, twice a week.",
      signal:
        "Your cross-plus-first-pair time falls faster than your cross time — that difference is the pause closing.",
      exerciseId: "cross_first_pair",
    },
    {
      id: "join-last-moves-elsewhere",
      title: "Eyes off the cross",
      purpose:
        "Makes the free attention during the last cross moves into a habit instead of something you do when you remember.",
      rules: [
        "Solve normally, but with one rule: once you are two moves from finishing the cross, you may not look at the cross again.",
        "Your eyes go to the top layer, hunting the first pair, while your hands finish.",
        "It will feel wrong and you will misplace a cross edge occasionally. That is the drill working.",
      ],
      dose: "Fifteen solves, untimed.",
      signal: "You stop needing the rule; the eyes move on their own.",
    },
    {
      id: "join-xcross-spotting",
      title: "X-cross spotting, no execution",
      purpose:
        "Separates recognising the opportunity from taking it, so you can build the recognition cheaply.",
      rules: [
        "Scramble. Plan your cross as normal.",
        "Before executing, ask: will any pair be made or nearly made when this cross is done? Answer yes or no.",
        "Execute the ordinary cross anyway and check whether you were right.",
      ],
      dose: "Twenty scrambles a week. No timing.",
      signal: "You start saying yes more often, and being right.",
    },
  ],
  mistakes: [
    "Watching the cross finish, so the search starts from nothing.",
    "Planning an x-cross before a plain cross is automatic, which makes the average cross worse.",
    "Picking the theoretically shortest first pair rather than the one you can start without a rotation.",
  ],
  sources: [
    SOURCES.crossTransition,
    SOURCES.crossPlusPair,
    SOURCES.extendedCross,
    SOURCES.jpermCfop,
  ],
};
