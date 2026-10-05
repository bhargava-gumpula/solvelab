import { SOURCES } from "../sources";
import type { LessonQuiz, LevelPack } from "../types";

/*
 * F2L at the fast end: choosing each insert for the pairs after it. Every
 * move sequence here, the edge-orientation claims behind them, Feliks's 5.97
 * line and the five-move SMMS example are checked on the cube engine
 * (tests/unit/night-f2l-advanced.test.ts).
 */

export const f2lAtTheFastEnd: LevelPack = {
  id: "f2l-at-the-fast-end",
  title: "F2L at the fast end",
  summary:
    "Choosing each insert for the pairs after it: edges oriented, back slots first, the front face as storage, and a stopwatch for the close calls.",
  levels: ["sub15"],
  why: "By now your pairs flow, the awkward cases are memorised and keyhole is automatic. What's left in F2L is mostly the cost one insert passes on to the next: a bad edge that forces an F move or a rotation two pairs later, a last pair stuck in a back slot you can't see, a choice between two solutions made on feel. Each insert can be chosen for what it leaves behind. And there are numbers to check first whether F2L is the part of your solve worth this work at all.",
  lessons: [
    {
      id: "fastf2l-is-it-f2l",
      title: "Is F2L really where your time goes?",
      takeaway:
        "Compare each phase's share of your solve with the shares sub-10 solvers average, and work on F2L only if it's the phase clearly over.",
      minutes: 4,
      body: [
        "Everything in this pack makes F2L faster, so check first that F2L is what's slow. A single average can't tell you: an 11-second solve could be a slow cross and a quick last layer, or the other way round. What tells you is how the time splits between the phases. Stuck at 15 found the part furthest behind the goals on your profile; this is a second check, against how sub-10 solvers split their time, and the two yardsticks can disagree.",
        "An analysis posted on SpeedSolving gives idealised shares, averaged from hundreds of solves by world-class sub-10 CFOP solvers: the cross about 12% of the solve, the cross and first pair 24.5%, the cross and all of F2L 62%, OLL 16.5% and PLL 21.5%. OLL and PLL both include recognition and AUF, so the last layer as a whole is 38%. At an 11-second average that's about 1.3 seconds of cross, 2.7 for the cross and first pair, 6.8 for the cross and F2L, and 4.2 for the last layer.",
        "Read the gaps, not the totals. If the cross and first pair take a much bigger share than 24.5%, the leak is inspection or the start of F2L, and the cross units suit it better than this pack. If the cross and first pair are on share but the cross and F2L are well over 62%, the time is in the later pairs, the pauses between them and what each one leaves the next, which is what this pack is about. If F2L is on share and the last layer is over, advanced F2L is the wrong place to spend the next month.",
        "The author's rule for when a gap counts: a phase appreciably over its share, around 10% over as he suggests, is the one to work on, and you stay with it until it's no longer the worst. The shares are averages from a group of fast solvers, not targets to hit exactly; they point at a leak rather than define a good solve. One caveat is SolveLab's own: a test that times one phase on its own doesn't flow into it the way a real solve does, so only a clear gap means much.",
      ],
      checkpoint:
        "You know which phase of your solve is furthest over its share, and whether it's F2L.",
    },
    {
      id: "fastf2l-orient-the-rest",
      title: "Orient the F2L edges you haven't used yet",
      takeaway:
        "An insert with F and F' in it flips two edges: the one going in and the one it lifts out of the slot. Aim that second flip at a bad F2L edge and the later pairs need only R and U.",
      minutes: 6,
      body: [
        "Good edges, bad edges showed that R, L, U and D never change whether an edge is good, and that a quarter turn of F or B flips all four edges on that face. So whether your last two pairs can go in with R and U alone is decided earlier, by the F and B turns and the rotations before them. At this level that makes edge orientation something you steer with every insert, not something you discover at the last pair.",
        "Look at exactly what an F-move insert flips. F U F' puts a pair into the front-left slot: the F lifts the slot's two places into the top layer, the U brings the pair round to them, and the F' drops it in. Only two edges change: the edge that goes in, and whatever edge was sitting in the slot, which comes out onto the top layer flipped. Every other edge keeps its state, because the U only moved it around the top. F' U' F into the front-right slot works the same way, and R and U inserts flip nothing.",
        "So when the slot you're filling holds a bad F2L edge, an F-move insert fixes it for free. Feliks Zemdegs points to exactly this in his commentary on a 5.97 average. After his cross and a first pair in the back-left slot, the front-left pair's edge was bad, and another F2L edge sat bad in the front-left slot. U' R U R' F U F' puts the pair in and lifts that edge out good, so both remaining F2L edges are good, and the last two pairs, as he put it, 'could have been solved using just R and U moves'.",
        "The same idea settles a choice between two inserts of the same length. A pair joined on the right of the top layer, ready for U R U' R', also goes in with the sledgehammer, R' F R F'. Compared with U R U' R', the sledgehammer flips two edges: the one at the front of the top layer and the one sitting in the slot. The last-pair lesson uses that for yellow edges; on an earlier pair, use it for F2L edges. Count the bad F2L edges among those two, and take the sledgehammer when flipping both leaves fewer.",
        "A rotation is the other tool. A y or y' turns every F2L edge in the top layer from good to bad or bad to good, and leaves the F2L edges in the middle layer as they were. A y2 changes no edge at all. So when both remaining F2L edges sit bad in the top layer, one y makes them both good, which is an honest reason to spend a rotation mid-F2L. A y2 never helps orientation.",
        "Don't force it. One guide estimates, roughly, that orienting every edge during the cross raises the optimal F2L move count from about 27 to about 36, so orienting everything costs real moves. The free version is the one to use: between two inserts that cost the same, take the one that leaves fewer bad F2L edges.",
      ],
      examples: [
        {
          label: "Feliks's front-left pair",
          moves: "U' R U R' F U F'",
          note: "From his 5.97 commentary, after the cross and a first pair in the back-left slot, with the front-right slot still empty. U' R U R' uses that empty slot to set the pair up, and F U F' drops it into the front-left slot, lifting the bad F2L edge stuck there out good.",
        },
        {
          label: "Joined on the right: flip nothing",
          moves: "U R U' R'",
          slot: "FR",
          note: "Leaves every edge as it was. Take it when the edge at the front of the top layer and the edge in the slot are both good, or aren't F2L edges.",
        },
        {
          label: "Joined on the right: flip two",
          moves: "R' F R F'",
          slot: "FR",
          note: "Same pair, same slot, same length, but it flips the edge at the front of the top layer and the edge in the slot. Set it up with R' U R U' F R' F' R: the back-right edge waits at the front with orange on top, which is bad. U R U' R' leaves it bad; the sledgehammer turns it good, and the last pair goes in with R and U.",
        },
      ],
      checkpoint:
        "Before each insert you know how many bad F2L edges are left, and which of two equal inserts leaves fewer.",
    },
    {
      id: "fastf2l-back-slots-first",
      title: "Back slots first, front slots last",
      takeaway:
        "Unless a pair is free, put the back pairs in first, so the last pairs, which have the least room, go into the slots in front of you.",
      minutes: 5,
      body: [
        "Every pair you insert takes a slot away, so the last pairs of a solve have the least room: no empty slot to keyhole through or to pair with a spare R or L turn, and fewer ways to avoid a rotation. Which slots those last pairs go into therefore matters, and the front ones are cheaper. A front slot is in view and takes R U R' or L' U' L from your normal grip; a back slot means reaching round with R' or L, or rotating.",
        "So when a pair could go in at the front or the back for about the same cost, put it in at the back. Early on, both front slots are still open as workspace, and that's when back pairs are easiest: an empty front-right slot is what lets R U R' L U' L' put in a back-left pair, the trick from Use the slots you have not filled. And once both back slots are full, the last two pairs' pieces can only be in the top layer or the front slots, all where you're already looking.",
        "Feliks Zemdegs reasons the same way in his reconstructions. In one 5.80 solve he notes that things would be a little easier because the two pairs solved first would end up in the back two slots. In a 10.21 solve he says he should probably have put a pair straight into the back slot, but rotated to do it with R and U instead. Jayden McNeill lists filling a better slot for lookahead as one of five reasons to prefer one solution over another.",
        "The rules, in order. Free pairs still come first: a pair the cross left joined, or one that's a single insert away, beats any plan. Otherwise, of two pairs that cost about the same, take the one for a back slot. If they still tie, take the one that leaves the next pair in view.",
        "Two limits. This only pays once the back-slot inserts from F2L from the front and Advanced F2L cases are automatic; a back-slot case you have to think about costs more than the rotation it saves. And it isn't a ban on rotations. One solver on SpeedSolving puts it this way: one or two y turns in F2L are fine as long as your lookahead survives, but a y2 is out of the question. In the same thread, the solver who asked found a rotationless sequence faster to execute, but said it hurt their lookahead.",
      ],
      checkpoint:
        "With no free pair, you choose the back-slot pair over an equal front one without stopping to think.",
    },
    {
      id: "fastf2l-stopwatch",
      title: "Let a stopwatch choose between two solutions",
      takeaway:
        "When two solutions for the same case both look reasonable, no rule picks the winner reliably; timing both, the same way, does.",
      minutes: 4,
      body: [
        "Most choices in fast F2L are trades: a rotation against an F move, seven moves against eight that flow better, a back-slot algorithm against a y and a front one. Jayden McNeill lists five things a solution using an empty slot can buy: fewer rotations, a better slot for lookahead, fewer moves, a move set your hands prefer, and a continuous flow of turns. None of them always wins, and real solutions score well on some and badly on others.",
        "Opinions about these trades disagree because hands do. On SpeedSolving, experienced solvers mostly prefer a y to F or B moves, because F and B often need a regrip; one gives the exception that when the choice is a rotation, three moves and another rotation, two F moves are better. Both can be right for different hands. What settles it for yours is how long each takes, including the moment you start looking for the next pair, and feel can't measure that.",
        "McNeill's test is an average of 25 with each solution, starting from the same grip and the same AUF every time, so that only the solution differs; he compares the fastest average of 5 inside each. SolveLab compares the whole averages of 25 instead, which one lucky run of five can't swing, and adds a step: run the two blocks back to back, then again on another day in the opposite order, so warm-up and tiredness don't favour whichever went second. A solution that wins both days has won; one that wins once is a tie, and a tie goes to the one you already use.",
        "He also says when not to bother: if one solution clearly wins on four or five of the five points, just use it. Timing earns its keep in the murky middle, where each solution has two or three points in its favour. And test again after a few weeks of using the winner, because a solution you've drilled gets faster and can overtake the one that won before.",
      ],
      checkpoint:
        "For the case you were least sure about, you have two averages of 25, from two days, and a decision.",
    },
    {
      id: "fastf2l-front-as-storage",
      title: "F, then R and U, then F': the front face as storage",
      takeaway:
        "With the front-right pair solved, an F turn parks it where R and U can't reach, so the back-right and front-left pairs can both be done with R and U before F' brings it back.",
      minutes: 5,
      body: [
        "Keyhole and pseudo-slotting both turn the bottom layer on purpose, do some work, and turn it back. SMMS (Scholey–McNeill Multi-Slotting), proposed by Jayden McNeill and George Scholey in late 2019, does the same with the front face. In its most common form it's for the last two pairs when the front-right and back-left pairs are in: it solves the back-right and front-left pairs together, opening with F, turning only R and U in between, and closing with F'.",
        "Here is why it works. With the front-right pair in, an F turn moves that pair and the front cross edge into places on the left and bottom layers that R and U never touch, so they wait there safely, and the front-right slot is left free as workspace. The same F lifts the front-left slot's two places into the top layer: the corner's to the front left, the edge's to the front. Solve the back-right pair with R and U, bring the front-left pair to those two places as a joined pair, and F' drops it in while bringing the front-right pair and the cross edge home.",
        "Edges decide whether a case works. R and U never flip an edge, so after the F the back-right edge must already be good, and the front-left edge must be bad, because the F' that drops it in flips it. The F itself flips any edge on the front face. So for edges at the right, back or left of the top layer, or in the back-right slot, judge them as they are: the front-left edge bad, the back-right edge good. An edge at the front of the top layer, or stuck in the front-left slot, counts the other way round. The SMMS wiki names an oriented front-left edge as the case that originally needed a y2; McNeill later generated algorithms for it. Those go beyond a plain F, R and U, F', so here it's the case to skip.",
        "Treat it as an opportunity, not a system. It needs a particular slot order and the right two edges, and most solves won't offer it. When one does, it can be very short: in the example below, five moves put in two pairs. Learn to check the two edges whenever you're down to the back-right and front-left pairs, and take it when it's there.",
      ],
      examples: [
        {
          label: "Two pairs in five moves",
          moves: "F R' U' R F'",
          note: "Set it up on a solved cube with F R' U R F'. The back-right corner waits above its slot, the back-right edge is stuck in the front-left slot, and the front-left pair is joined at the left of the top layer with red on top of its edge. F lifts the stuck edge to the front of the top layer. R' U' R is the ordinary back-right insert, and its U' also brings the front-left pair to the front. F' drops it in.",
        },
      ],
      checkpoint:
        "When you're down to the back-right and front-left pairs, you can say from the two edges whether F, R and U, F' will work.",
    },
  ],
  drills: [
    {
      id: "fastf2l-phase-check",
      title: "Phase-share check",
      purpose:
        "Finds out whether F2L is the part of your solve that's over its share, before you spend weeks on it.",
      rules: [
        "In one session, take an average of 12 in each of these tests: Cross, Cross + first pair, Cross + F2L, OLL + PLL, and Normal solves.",
        "Divide each test's average by your Normal solves average and compare with the sub-10 shares: 12%, 24.5%, 62% and 38%.",
        "Mark any phase more than about a tenth over its share. If the one furthest over is F2L, this pack is your next block; if it isn't, put this pack down and take that phase to its own units.",
      ],
      dose: "One session every two weeks.",
      signal:
        "The phase furthest over its share gets closer to it from one check to the next, and you always know which phase it is.",
      untimed: true,
    },
    {
      id: "fastf2l-edge-census",
      title: "Edge census",
      purpose:
        "Makes counting bad F2L edges a habit, so equal inserts get chosen by what they leave behind.",
      rules: [
        "After the cross, count the bad F2L edges out loud, and count again after each insert.",
        "When two inserts for a pair cost the same, take the one that leaves fewer bad F2L edges: an F-move insert, the sledgehammer, or a y when both remaining edges sit bad in the top layer.",
        "After each solve, note whether the last two pairs went in without F, B or a rotation.",
      ],
      dose: "Twelve slow solves, three sessions a week for two weeks.",
      signal:
        "More of your solves end with the last two pairs done without F, B or a rotation: the tally for the second week beats the first.",
      untimed: true,
    },
    {
      id: "fastf2l-back-first",
      title: "Back first, against the clock",
      purpose:
        "Finds out whether putting the back pairs in first is actually faster for you, rather than assuming it.",
      rules: [
        "Free pairs still go first. Otherwise, whenever a back pair costs about the same as a front one, take the back one, without a y2.",
        "Alternate sessions: twenty-five solves back-first, then twenty-five your normal way. The session summary compares each with the one before.",
        "Keep everything else the same: same cube, and the same time of day if you can.",
      ],
      dose: "Six sessions, three of each, over two weeks.",
      signal:
        "All three back-first sessions beat the normal sessions beside them. If they don't, the back-slot inserts aren't automatic yet: go back to No rotation for the back.",
      exerciseId: "f2l_only",
    },
    {
      id: "fastf2l-ab-duel",
      title: "A-or-B duel",
      purpose:
        "Settles a choice between two solutions for one case with times instead of opinions.",
      rules: [
        "Pick one case you have two solutions for. Set it up yourself each rep by doing one of the solutions backwards; the scramble on screen isn't needed.",
        "Start every rep from the same grip and the same AUF. Twenty-five timed reps of solution A as one session, then twenty-five of B as the next.",
        "On another day, do B first, then A.",
      ],
      dose: "Two pairs of sessions per case; one case a week.",
      signal:
        "One solution has the lower average on both days. If each wins once, it's a tie: keep the one you already use.",
      exerciseId: "last_slot",
    },
    {
      id: "fastf2l-rotation-budget",
      title: "Rotation limit, timed",
      purpose:
        "Checks that F2L with almost no rotations has become faster, not just possible, once the untimed rotation limit has done its work.",
      rules: [
        "Timed F2L with no y2 at all and at most one y or y' per solve.",
        "Write down the number of rotations you used after each solve.",
        "Compare the session's average with your last ordinary F2L test.",
      ],
      dose: "Twenty-five solves, twice a week.",
      signal:
        "The rotation-limited average matches or beats your ordinary F2L average. Still slower after three sessions means the back-slot cases aren't fluent: return to No rotation for the back.",
      exerciseId: "f2l_only",
    },
    {
      id: "fastf2l-front-storage-reps",
      title: "Front-face storage",
      purpose:
        "Teaches the edge check for F, R and U, F', so you take it when a solve offers it and leave it when it doesn't.",
      rules: [
        "Set up the five-move example with F R' U R F' and solve it with F R' U' R F', ten times, watching the front-right pair leave and come back.",
        "Then, in slow solves where the front-right and back-left pairs go in first, check the two edges before going on: front-left edge bad, back-right edge good, with an edge at the front of the top layer or in the front-left slot counting the other way round.",
        "Say yes or no, try it when it's yes, and tally three numbers: spotted, tried, came out solved.",
      ],
      dose: "Ten slow solves a week.",
      signal:
        "When you call yes, it comes out solved at least four times in five; only then use it in timed solves.",
      untimed: true,
    },
  ],
  mistakes: [
    "Working on F2L before checking that it's the phase furthest over its share.",
    "Choosing between equal inserts without counting the bad F2L edges each one leaves.",
    "Spending a y2 to fix edge orientation, when a y2 never changes which edges are good.",
    "Learning rotationless algorithms for every case and losing lookahead to them.",
    "Settling a choice between two solutions on feel, or on one day's times.",
    "Trying F, R and U, F' with a good front-left edge at the side or back of the top layer.",
  ],
  sources: [
    SOURCES.phaseShares,
    SOURCES.feliks597,
    SOURCES.feliksCommentary,
    SOURCES.feliks1021,
    SOURCES.f2lEoGuide,
    SOURCES.partialEdgeControl,
    SOURCES.emptySlots,
    SOURCES.rotationsVsLookahead,
    SOURCES.rotationVsFb,
    SOURCES.smmsWiki,
  ],
};

/** One check question per lesson, for LESSON_QUIZZES (data/training/quizzes.ts). */
export const F2L_AT_THE_FAST_END_QUIZZES: Record<string, LessonQuiz[]> = {
  "fastf2l-is-it-f2l": [
    {
      question:
        "At a 10-second average, your cross and first pair take 3.2 seconds, your cross and F2L 6.3 and your last layer 3.7. Where should the next block of practice go?",
      options: [
        "The later pairs, since F2L is most of the solve",
        "The last layer, since 3.7 seconds is a lot for it",
        "The cross and first pair, about 30% over their share",
        "Nothing much: every phase total is close to its share",
      ],
      answer: 2,
      why: "3.2 of 10 seconds is 32%, against 24.5% for sub-10 solvers: about 30% over, far past the tenth that counts. The cross and F2L are 63% and the last layer 37%, both on share, so the later pairs are quick. The leak is inspection and the first pair.",
    },
  ],
  "fastf2l-orient-the-rest": [
    {
      question:
        "The front-left pair is ready to go in with F U F', and a bad F2L edge is stuck in the front-left slot. What happens to that edge?",
      options: [
        "It stays bad, because F U F' only flips the edge it inserts",
        "It comes out onto the top layer, flipped good",
        "It moves to the front-right slot, still bad",
        "It stays in the slot, so the pair can't go in",
      ],
      answer: 1,
      why: "F U F' flips exactly two edges: the one it puts into the slot and the one it lifts out. The F carries the stuck edge to the front of the top layer and the U moves it off the front, so the F' doesn't flip it back: it ends up good, in the top layer.",
    },
  ],
  "fastf2l-back-slots-first": [
    {
      question:
        "No pair is free, and two pairs would each take about four moves: one for the front-right slot, one for the back-left. Which goes in first?",
      options: [
        "Front-right, so you can see what you're doing",
        "Back-left, so the last pairs end up at the front",
        "Either: at equal cost the order makes no difference",
        "Front-right, since R U R' is the fastest insert",
      ],
      answer: 1,
      why: "The last pairs have the least room and the fewest choices, so give them the slots that are cheapest to reach and easiest to see: the front ones. Doing the back pair while the front slots are still open also leaves you workspace for it.",
    },
  ],
  "fastf2l-stopwatch": [
    {
      question:
        "Solution A is two moves shorter; solution B has no regrip. After 25 of each, A wins on Monday, and B wins on Thursday when you ran them in the other order. What now?",
      options: [
        "Use A: fewer moves is the tiebreak at this level",
        "Use B: no regrip always wins in the end",
        "Call it a tie and keep the one you already use",
        "Pick the one that felt smoother during the test",
      ],
      answer: 2,
      why: "A solution that wins in both orders has really won; one that wins once may only be riding on warm-up or tiredness. A tie goes to the solution you already know, since switching costs practice for no measured gain.",
    },
  ],
  "fastf2l-front-as-storage": [
    {
      question:
        "You're down to the back-right and front-left pairs. The front-left edge sits at the back of the top layer and is good. Why won't F, R and U, F' solve it?",
      options: [
        "After the F, R and U can't reach the back of the top layer",
        "R and U never flip it, and it must be bad for F'",
        "The F turn would knock the back-left pair out of its slot",
        "SMMS only works when the front-right slot is still empty",
      ],
      answer: 1,
      why: "An edge at the back of the top layer isn't touched by the F, and R and U never change an edge's orientation. The F' flips the front-left edge as it drops it in, so it has to be bad until then. A good one is the case that originally needed a y2; the algorithms McNeill later generated for it go beyond a plain F, R and U, F'.",
    },
  ],
};
