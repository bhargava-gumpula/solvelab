import { SCRAMBLE_HOLD, SOLVING_ROTATION, SOLVING_VIEW } from "@/lib/config/cube";
import { SOURCES } from "../sources";
import type { AspectPack } from "../types";

export const crossEfficiency: AspectPack = {
  id: "cross-efficiency",
  aspectId: "cross",
  title: "The cross: on the bottom, then short",
  summary: "Why the cross goes on the bottom, and how to find a short one.",
  levels: ["sub120", "sub45"],
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
        "If you are still solving on top, switch now rather than later. The habit gets more expensive the more solves you have built on it, because the slow patch while you relearn gets longer.",
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
        "Any cross can be solved in eight moves or fewer, nearly all in five to seven, and the average is just under six. That is a mathematical fact about the position, not an aspiration, which makes the cross unusual: you can always tell whether your solution was good, by counting it.",
        "The gap between a beginner cross and a good one is wide. Rough bands people quote are ten to fifteen moves for a beginner, eight to ten for an intermediate solver, six to eight for an advanced one. At three turns a second, the difference between fifteen moves and seven is nearly three seconds — more than most people ever gain from turning faster.",
        "Efficient crosses rarely look like the obvious solution. They solve edges out of the order you first spotted them, they turn D to move several edges at once, and they set two edges up with one move so a single turn finishes both. None of that is visible if you solve edge by edge as you find them.",
        "The practical habit: after each solve, replay the cross you did and ask whether a shorter one existed. You do not need software for this. Just counting is enough to make you look for the shorter one next time.",
      ],
      checkpoint: "You can say how many moves your last cross took, and it is usually under ten.",
    },
    {
      id: "cross-pairing-edges",
      title: "Pair edges before you place them",
      takeaway:
        "Two cross edges that already sit right relative to each other on the bottom need one D turn between them, not two separate solutions.",
      minutes: 4,
      body: [
        "The saving in a short cross comes from moves that do two jobs. The most common shape: bring two cross edges so that they sit correctly relative to each other but in the wrong place, then turn D once to put both home.",
        "This is why solving edges strictly one at a time is expensive. Each new edge has to go in without knocking out the ones already placed, so the later ones cost more: the first usually takes one move, the last three or four. Even with the best moves for every edge, one at a time averages about eight and a half moves. Planned together, the same crosses average under six.",
        "Look for the edges that are already correct relative to each other first — two edges in the D layer next to each other with the right colours adjacent, even if both are misplaced. Those are free: one D turn fixes both once the others are in.",
        "The other common saving is a cross edge already in the bottom layer but out of place with the others, or flipped. Do not take it up to the top and back down. Out of place, a turn of its face parks it in the middle layer, a D turn lines the rest up, and turning the face back brings it home: three moves, and the same face turn can drop another edge in on the way. Flipped, it takes four.",
      ],
      examples: [
        {
          label: "Park it, turn D, bring it back",
          moves: "R' D' R",
          note: "White-orange is in its spot, but the other bottom edges are a D' away from theirs, and white-green waits in the front-right slot with white facing you. R' parks white-orange in the back-right slot and drops white-green into the bottom layer, D' lines the bottom edges up, and R brings white-orange back. Three moves, and nothing goes to the top.",
        },
        {
          label: "Flipped in place",
          moves: "F' D R' D'",
          note: "White-green is in its spot but flipped. F' lifts it into the front-right slot, D turns its spot round to the right, R' drops it in the right way up, and D' turns the bottom back. Four moves; any route through the top takes at least five.",
        },
      ],
      checkpoint: "You notice when two cross edges are already correct relative to each other.",
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
        "Write the solution down and count it before you touch the cube; if it is longer than eight, keep looking.",
        "Execute it and check the cross is right.",
        "The timer only records the session: the point is the search, not the hands.",
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
  ],
  mistakes: [
    "Solving the cross edge by edge in the order you spot them, which roughly doubles the move count.",
    "Taking an edge that is already in the bottom layer all the way to the top to re-insert it.",
    "Rotating the cube mid-cross to find an edge you lost track of.",
    "Practising the cross by turning faster, when the problem is that the solution was too long.",
  ],
  sources: [SOURCES.jpermCross, SOURCES.cubefreakCross, SOURCES.crossPlanning],
};

export const inspection: AspectPack = {
  id: "inspection",
  aspectId: "cross_planning",
  title: "Using all fifteen seconds",
  summary: "Planning is a trainable ladder, not a talent. Here are its rungs.",
  levels: ["sub60", "sub45", "sub30", "sub25", "sub20"],
  why: "If your cross is slower with fifteen seconds of inspection than it is with unlimited inspection, you are finishing your planning while the timer runs. Every move you plan on the clock costs you roughly the time it takes to make it, twice.",
  lessons: [
    {
      id: "inspection-what-it-is",
      title: "What inspection is actually for",
      takeaway:
        "Fifteen seconds of thinking is free. Any planning you push into the solve is paid for at full price.",
      minutes: 3,
      body: [
        "Competition rules give you up to fifteen seconds to look at the cube before the timer starts, during which you may hold and turn the puzzle over in your hands but not turn any layer. That time is free: nothing you work out in it costs you anything. Only the limit is strict. Start the solve after fifteen seconds and two seconds are added to your time (+2); start it after seventeen and the solve is a DNF, as if you had not finished it. SolveLab's timer counts inspection the same way when you turn it on.",
        `Spend the first second of it getting into your solving hold. Scrambles are applied with ${SCRAMBLE_HOLD}, so turn the cube over with ${SOLVING_ROTATION}, which keeps ${SOLVING_VIEW.F} in front (x2 does the same job but brings blue round to the front). Then plan the cross where you will solve it, with ${SOLVING_VIEW.D} on the bottom and ${SOLVING_VIEW.U} on top, rather than planning it on top and turning over afterwards.`,
        "The moment the timer starts, thinking is expensive. A pause to work out the next cross edge costs you a second that a plan would have cost nothing. This is why the gap between your timed cross and your unlimited-inspection cross is a real measurement of something: it is exactly the planning you did not finish in time.",
        "So the goal of inspection is not to look at the cube. It is to arrive at the start of the solve with nothing left to decide about the cross.",
      ],
    },
    {
      id: "inspection-ladder",
      title: "The planning ladder",
      takeaway:
        "Find the edges, then plan one, two, three and four. Each rung is a real amount of work, and most people stall at two: planning the second edge from a cube they can't see yet.",
      minutes: 5,
      body: [
        "Planning the whole cross at once is not a thing you decide to do; it is the top of a ladder. The rungs go like this.",
        "First: find all four cross edges within about six seconds. Just locate them — do not solve anything. This is pure scanning, and it is the rung nearly everyone can reach in a week.",
        "Second: plan the shortest solution for one edge, completely, before you start. Pick the easiest edge and it is usually one or two moves; no single edge needs more than three.",
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
        "The mechanical skill under cross planning is being able to say where a piece will be after a move. Most people can do this for one move and lose it by the third, which is exactly why planning the second edge is the rung that stops people.",
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
        "You do not need to plan its moves. Simply knowing which corner and which edge you are going for shortens the pause at the start of F2L, which is one of the more expensive pauses in the solve because it comes straight after the cross, with the timer running and nothing planned. The next step is following that pair's corner through your cross moves, so it is still where you expect when the cross is done; the Sub-15 course adds its edge.",
        "The step after that is the x-cross, a cross that finishes a pair as well, taken only when the scramble offers one; the lesson on the join after the cross covers it.",
      ],
    },
    {
      id: "inspection-cross-plus-one",
      title: "Cross plus one: follow the pair through the cross",
      takeaway:
        "Knowing which pair comes first is half the job. The other half is knowing where its two pieces will be once your cross moves have pushed them around.",
      minutes: 4,
      body: [
        "Picking your first pair in inspection only helps if it is still where you expect when the cross is done. Your cross moves turn the side layers, and any that pass through the pair's corner or edge carry it somewhere else. A pair you picked but did not follow is a pair you have to find again.",
        "So once the cross is planned, go through it a second time in your head, this time watching the pair. Pick up the corner and the edge before the first move and move them with every turn that touches them. A cross move that misses both pieces leaves them where they are, so you only have to think on the moves that hit them. At the end you want a picture of where each piece sits and which way it faces, enough to start the pair the moment the cross is in.",
        "It is the tracking skill from earlier, with two pieces instead of one and a cross solution instead of a practice sequence. The honest test is to do it blind: plan the cross and the pair, close your eyes for the cross, then open them and start the pair straight away. If you have to search, the tracking slipped, and you can usually say at which move.",
        "Sometimes the tracking shows you something better: the cross moves nearly join the pair on their own, and a cross plus pair of about nine or ten moves is sitting there. Take it when you see it. That is an x-cross offered by the scramble, and it is worth having.",
        "What is not worth it is forcing one. Hunting for an x-cross on every scramble eats the inspection you need for the plain cross and the pair, and usually ends with a longer cross, a rushed plan, or both. Plan the cross and track the first pair on every solve; take the x-cross only on the solves that hand you one.",
      ],
      checkpoint:
        "On most solves you start the first pair without looking for it, because you already know where its corner and edge ended up.",
    },
  ],
  drills: [
    {
      id: "inspection-blind-cross",
      title: "Blind cross",
      purpose:
        "The only honest test of whether you planned the cross or just started it. You cannot fake this one.",
      rules: [
        "Plan as far as your rung of the ladder goes (two edges, then three, then the whole cross) in fifteen seconds.",
        "Close your eyes and solve that much. Add an edge once it comes out right every time.",
        "Open them. If the cross is right, your plan was complete. If not, work out which edge you lost and at which move.",
      ],
      dose: "Ten a session, three sessions a week.",
      signal:
        "Your hit rate goes from a third to most of them. Later, from about sub-15, add the first pair and do the same thing.",
      exerciseId: "cross_only",
    },
    {
      id: "inspection-unlimited",
      title: "Unlimited inspection, then close the window",
      purpose:
        "Separates 'I cannot plan this' from 'I cannot plan this in fifteen seconds', which need different work.",
      rules: [
        "Take as long as you like to plan the cross, then solve it.",
        "Then take fresh scrambles and plan each in thirty seconds, then twenty, then fifteen.",
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
    {
      id: "inspection-follow-one-corner",
      title: "Follow one corner through the cross",
      purpose:
        "The first step past planning the cross alone: you know where one piece of your first pair will be when the cross is done.",
      rules: [
        "In inspection, plan the cross, then pick the pair you want to solve first.",
        "Go through the cross plan again in your head, following only that pair's corner, and say where it will end up.",
        "Solve the cross without looking for the corner, then check. When the corner is reliable, the Sub-15 course adds its edge.",
      ],
      dose: "Ten scrambles a session.",
      signal:
        "The corner is where you said most of the time, and F2L starts without a search for it.",
    },
    {
      id: "inspection-cross-plus-one-blind",
      title: "Cross plus one, eyes closed",
      purpose:
        "Proves you followed the first pair through the cross rather than just picking it. With your eyes shut there is nothing to re-find it with.",
      rules: [
        "In inspection, plan the cross and choose your first pair, then run through the cross again in your head, following the pair's corner and edge.",
        "Close your eyes and solve the cross.",
        "Open them and start the pair at once, without searching. If your eyes had to look for either piece, the rep does not count.",
        "When a rep fails, work out which cross move took the piece somewhere you did not expect.",
      ],
      dose: "Ten scrambles a session, two or three sessions a week.",
      signal:
        "Most reps go straight from the cross into the pair with no search, and your Cross + first pair times with your eyes open start to show the same clean join.",
      exerciseId: "cross_first_pair",
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
    SOURCES.subTen,
  ],
};

export const crossIntoF2l: AspectPack = {
  id: "cross-into-f2l",
  aspectId: "cross_to_f2l",
  title: "The join after the cross",
  summary:
    "Why there is a pause between a finished cross and a started pair, and how to remove it.",
  levels: ["sub30", "sub25", "sub20"],
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
        "After the cross is planned, the cheapest next thing is to pick your first pair: which corner and which edge. The next lesson, on inspection, has you follow both through your cross moves so you know where they will be when the cross is done.",
        "Which pair to pick matters less than picking one. That said, there are useful preferences: a pair whose pieces are both in the top layer is easiest to track, and a pair that goes into a slot you can reach without rotating is worth more than a marginally shorter one somewhere awkward.",
        "If you cannot find a pair in the inspection you have left, look for just the corner. Half the information removes most of the pause, and the edge is easier to find once you know which slot you are heading for.",
        "To see whether the join is where your time goes, measure it. Do a set of the Cross + first pair test alongside the Cross test and the Single pair test. Your cross plus first pair, minus your cross and minus one ordinary pair, is roughly the pause after the cross. The coach does that sum for you and shows it as Cross → F2L; a set of the Cross + F2L test, next to the Cross and F2L tests, gives it a better read. Check it again after a few weeks of choosing your pair in inspection.",
      ],
      checkpoint: "You start F2L with your hands moving, not with your eyes searching.",
    },
    {
      id: "join-xcross",
      title: "The extended cross",
      takeaway:
        "Sometimes the cross solution is one or two moves away from also solving a pair. When a scramble offers that, take it: it removes a quarter of F2L. Don't force one when it isn't there.",
      minutes: 4,
      body: [
        "An x-cross is a cross solution that finishes one F2L pair at the same time. It is not a separate technique so much as a choice: among the several cross solutions a scramble allows, one of them may leave a corner and edge already paired, or nearly so.",
        "The benefit is bigger than one pair of time. You start F2L with three slots instead of four, which means fewer pieces to search among and an easier read for everything that follows.",
        "It is genuinely advanced, and worth being honest about the prerequisite: you need to plan a plain cross reliably first, because an x-cross is planning a cross while tracking two extra pieces. Trying it before then produces crosses that are worse in the normal case in exchange for an x-cross you rarely spot.",
        "The way in is to practise noticing rather than forcing. During inspection, once your cross is planned, ask whether any corner-edge pair will happen to be solved or adjacent afterwards. Say yes or no and move on. After a few hundred solves of just noticing, the cases start suggesting themselves.",
        "Keep it that way round even once you are good at it. An x-cross is something the scramble hands you, not something you make happen: take it when it is there, and on every other solve do your normal cross. Forcing one each time spends the inspection you need for the cross and the first pair, and tends to leave a longer, shakier cross.",
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
    "Forcing an x-cross on a scramble that does not offer one.",
    "Picking the theoretically shortest first pair rather than the one you can start without a rotation.",
  ],
  sources: [
    SOURCES.crossTransition,
    SOURCES.crossPlusPair,
    SOURCES.extendedCross,
    SOURCES.jpermCfop,
  ],
};
