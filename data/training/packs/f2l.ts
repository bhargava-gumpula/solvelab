import { SOURCES } from "../sources";
import type { AspectPack } from "../types";

export const f2lEfficiency: AspectPack = {
  id: "f2l-efficiency",
  aspectId: "f2l",
  title: "F2L in fewer moves",
  summary: "What a good pair solution looks like, and the three ideas that shorten the bad ones.",
  levels: ["sub60", "sub45", "sub30", "sub25"],
  why: "F2L is about half of every solve, and most people's F2L is long rather than slow. A pair solved in eleven moves with a rotation, when seven would have done, costs about a second — and it happens four times a solve.",
  lessons: [
    {
      id: "f2l-what-a-pair-is",
      title: "A pair is joined, then dropped",
      takeaway:
        "Every F2L case is the same two steps. Learning it as 41 algorithms hides that and makes it worse to use.",
      minutes: 4,
      body: [
        "This pack describes the cube held the way you solve it: white cross on the bottom, yellow on top. The top layer is the yellow one, and the four slots are the corner-and-edge gaps around the white cross. The z2 or x2 you did in inspection to get there is not an F2L rotation; the rotations worth cutting are the ones you make once F2L has started.",
        "F2L looks like a list of cases and is really one idea repeated: get the corner and its edge next to each other in the top layer so the pair is formed, then turn the pair into its slot. Everything else is a variation on getting them next to each other.",
        "There are three shapes worth knowing by name. The pair is already joined in the top layer, one top turn from its slot, so one trigger drops it in. The corner and edge are both in the top layer but not joined, so a move takes one out of the way, a U turn lines them up, and the same move brings it back joined. Or one of them is already in the slot wrong, so you take it out first — which turns the case into one of the other two.",
        "Learn it this way round and you get two things you do not get from memorising: you can solve a case you have never seen, and you can see partway through a solution that a shorter one exists. Learn it as algorithms and you get neither, and you learn it more slowly.",
        "It is normal for your times to get worse for a week or two when you switch from a beginner second layer to F2L. Everyone's do. The move-count saving is roughly twenty moves a solve, so it pays back quickly.",
      ],
      checkpoint: "You can solve a pair you do not recognise, slowly, without looking anything up.",
    },
    {
      id: "f2l-move-count",
      title: "Seven or eight moves, most of the time",
      takeaway:
        "Know the number for each case. If your solution is four moves longer than the good one, that is a second every time it comes up.",
      minutes: 4,
      body: [
        "Most F2L cases have a solution in seven or eight moves; the easiest are three, and the genuinely awkward ones reach nine or ten. If a case regularly takes you eleven or twelve, you are using a solution that works rather than the one that is good.",
        "The usual culprit is solving in one trigger too many: pairing the pieces the long way round, or inserting into the wrong slot and taking it out again. A useful target from fast solvers is two or three triggers per case — a trigger being a short, fingertrickable unit like R U R' or F' U' F.",
        "Efficiency is not only about the count. A nine-move solution that runs off your fingers can beat a seven-move one that needs two regrips. When you have a choice between solutions, pick the one your hands do without stopping.",
        "Counting is the way in. Pick one case you know you are slow on, count the moves you actually make, and compare it with a published solution for that case. The gap is usually obvious once you look.",
      ],
      checkpoint: "You can name two cases where you were using a needlessly long solution.",
    },
    {
      id: "f2l-rotations",
      title: "Stop turning the cube",
      takeaway:
        "A rotation costs about two moves of time and resets everything your eyes were tracking.",
      minutes: 4,
      body: [
        "Rotations are worse than their move count suggests. The hands pause, the grip changes, and — the expensive part — every piece you were tracking is now somewhere else from your point of view, so lookahead starts again from nothing.",
        "The fix is learning to solve pairs into slots other than the front-right one. The back slots feel foreign at first and then stop being foreign. Left-hand insertions are worth the same effort: if every awkward case makes you rotate to bring it to the right, you are paying twice.",
        "Count your rotations for a session. More than one or two in an F2L is a habit rather than a necessity. When you find yourself rotating, ask what you would do if you were not allowed to, and you will usually find the answer exists.",
      ],
      checkpoint:
        "Your F2L has one or two rotations at most, never a y2, and the front-left slot never needs one.",
    },
    {
      id: "f2l-empty-slots",
      title: "Use the slots you have not filled",
      takeaway:
        "An empty slot is a free workspace. Ignoring it is what makes awkward cases awkward.",
      minutes: 5,
      body: [
        "While F2L is in progress there are unfilled slots, and anything you put in one can be taken back out without cost. That turns several long cases into short ones.",
        "Keyhole is the plainest version. Say the corner is already correct in its slot but its edge is still in the top layer, and another slot is empty. Turn D so the empty slot's corner spot comes under this one (a quarter turn for a neighbouring slot, a half turn for the one diagonally opposite), which carries the placed corner out of the way; put the edge in with a short insert; then turn D back. With the edge home and the corner on top it works the other way round: the D turn brings the corner's spot under the empty slot, the corner goes in there, and D comes back. Neither needs any pairing. With no free slot at all, use the standard solution for the case instead; the shortest ones are seven or eight moves.",
        "The second use is avoiding rotations. A case that would need you to turn the cube to solve it at the front will often go in cleanly using the empty slot on the other side, at the same move count and with no rotation.",
        "The third is move count outright: solving a pair by routing it through the empty slot can replace a nine-move solution with a six-move one. A commonly cited example is doing R U R' L U' L' in place of the longer U2 L U L' U2 L U' L'.",
        "Pseudo-slotting is the advanced version: with the bottom layer turned on purpose, a corner and an edge from two different pairs go into one slot together, and turning the bottom back finishes both. Worth knowing it exists long before you use it.",
      ],
      checkpoint: "You notice which slots are empty before choosing how to solve a pair.",
    },
  ],
  drills: [
    {
      id: "f2l-case-audit",
      title: "Audit your worst cases",
      purpose:
        "Finds the specific cases costing you time. Most people have three or four bad ones and cannot name them.",
      rules: [
        "Solve F2L slowly, and each time a pair takes noticeably longer than the others, stop and write down what the case was.",
        "After twenty solves you will have a list, and it will be shorter than you expect.",
        "Look up a good solution for each one and compare it with what you were doing.",
      ],
      dose: "Twenty solves, then the comparison. Once.",
      signal: "You have a written list of three to five cases, with a better solution for each.",
    },
    {
      id: "f2l-no-rotations",
      title: "Rotation limit",
      purpose:
        "Breaks the habit of turning the cube before every pair. Taking most of the escape routes away is the whole drill.",
      rules: [
        "Solve F2L with no y2 at all and at most one y or y' per solve.",
        "Untimed. Some cases will take a while to work out from where they sit, which is the point.",
        "If you cannot see a way without the extra rotation, note the case and look it up afterwards.",
      ],
      dose: "Ten solves a session, twice a week, for two or three weeks.",
      signal: "Your ordinary solves settle at one rotation or none without you trying.",
    },
    {
      id: "f2l-keyhole-hunt",
      title: "Keyhole hunt",
      purpose:
        "Builds the habit of looking at the empty slots, which is where the short solutions hide.",
      rules: [
        "Solve the cross, then before each pair, look at which slots are empty and ask whether one helps.",
        "Specifically look for the case where one piece of a pair is already correctly placed — that is the keyhole case.",
        "Take the empty-slot solution even when it is not obviously shorter, so the pattern becomes familiar.",
      ],
      dose: "Fifteen untimed solves.",
      signal: "You start spotting keyhole cases during normal solves without looking for them.",
    },
  ],
  mistakes: [
    "Learning F2L as 41 algorithms, which is slower to learn and leaves you stuck on cases you have not seen.",
    "Rotating to bring every case to the front-right slot.",
    "Using a solution that works rather than the good one, for years, because it is never checked.",
    "Solving pairs in the order you spot them, when a different order leaves an easier cube.",
  ],
  sources: [
    SOURCES.jpermF2l,
    SOURCES.badmephistoF2l,
    SOURCES.emptySlots,
    SOURCES.keyhole,
    SOURCES.pseudoslotting,
  ],
};

export const pairRecognition: AspectPack = {
  id: "pair-recognition",
  aspectId: "pair_speed",
  title: "Seeing a pair instantly",
  summary: "Recognising a case from any angle, so the solution arrives with the sighting.",
  levels: ["sub60", "sub20"],
  why: "If a single pair takes you a long time even when there is nothing else to look for, the delay is recognition, not hands. You are working out the case each time instead of recognising it.",
  lessons: [
    {
      id: "pair-both-pieces",
      title: "Find both pieces, not one and then the other",
      takeaway:
        "Searching for a corner and then hunting its edge doubles the work. Look for pairs.",
      minutes: 3,
      body: [
        "The common habit is to spot a corner, then start looking for the matching edge. That is two searches, and the second one happens while you are already committed.",
        "Faster solvers scan for pairs: two pieces that go together, seen at the same time. On a cube with three slots left, the pieces you can see are few enough that this is realistic — you are looking for a corner with a particular edge near it, not scanning the whole cube twice.",
        "It helps to know which pair you want before you look. The pieces in the top layer are the ones you can act on; the ones buried in slots need taking out first. Scan the top layer first for both halves of any pair, and only then consider the slots.",
      ],
    },
    {
      id: "pair-all-angles",
      title: "The same case from four sides",
      takeaway:
        "A case in the back-left slot is the same case. If it does not look like it to you, that is the thing to fix.",
      minutes: 4,
      body: [
        "Most people learn F2L cases at the front-right slot and can only recognise them there. The result is a rotation every time a case appears elsewhere, and a pause while the case is mentally rotated into the familiar view.",
        "The fix is dull and effective: practise the same case in each of the four slots until it reads the same. The underlying case is defined by where the corner and edge are relative to each other and to their slot, not by which way you are holding the cube.",
        "This is one of the clearest differences between a twenty-second solver and a twelve-second one. It is not talent, it is having done the reps in all four positions.",
      ],
      checkpoint:
        "You can name a case in the back-left slot as quickly as one at the front right, without turning the cube to look.",
    },
    {
      id: "pair-ergonomics",
      title: "Pick the solution your hands like",
      takeaway: "Between two solutions of the same length, the one with no regrip wins every time.",
      minutes: 3,
      body: [
        "Recognition is only useful if it produces a solution you can execute smoothly. Two solutions of the same length can differ by half a second because one of them needs you to change your grip halfway through.",
        "The general preference: R and U moves are cheap, F and B moves cost a grip change, and anything that makes you regrip mid-sequence is worth avoiding unless it saves several moves.",
        "This is worth applying to your existing repertoire. If you have a case you always fumble, it is often not that you are bad at it — it is that the solution you learned is awkward for the hands and a better one exists.",
      ],
    },
  ],
  drills: [
    {
      id: "pair-single-slot",
      title: "One pair, over and over",
      purpose:
        "Isolates recognition from lookahead. With nothing else on the cube to find, the only thing left is how fast you read the case.",
      rules: [
        "Use a scramble that leaves only the last slot unsolved.",
        "Solve that pair, reset, repeat.",
        "Watch the gap between seeing and starting. That gap is the thing being trained.",
      ],
      dose: "Twelve attempts a session.",
      signal:
        "The pause between the scramble appearing and your hands moving shrinks towards nothing.",
      exerciseId: "last_slot",
    },
    {
      id: "pair-four-slots",
      title: "Same case, four slots",
      purpose: "Removes the front-right bias directly, which nothing else does.",
      rules: [
        "Pick one F2L case. Set it up in the front-right slot and solve it.",
        "Set the same case up in the front-left, back-right and back-left slots and solve it there — without rotating.",
        "Work through your slower cases one at a time.",
      ],
      dose: "Three cases a session, all four slots each.",
      signal: "The back slots stop feeling like different cases.",
    },
    {
      id: "pair-name-it",
      title: "Name before you turn",
      purpose:
        "Forces recognition to complete before execution starts, which is what makes it become automatic.",
      rules: [
        "Before solving each pair, say out loud what the case is — 'corner in the slot, edge on top', or whatever your own words are.",
        "Only then start moving.",
        "Untimed. Speaking is slower than thinking; the point is that you have to have decided.",
      ],
      dose: "Ten solves.",
      signal: "You find yourself naming cases before you have consciously looked.",
    },
  ],
  mistakes: [
    "Finding a corner first and then hunting its edge.",
    "Only ever practising cases in the front-right slot.",
    "Keeping an awkward solution for a case because it is the one you learned.",
    "Treating a slow pair as a speed problem when the pause is before the first move.",
  ],
  sources: [SOURCES.jpermF2l, SOURCES.badmephistoF2l, SOURCES.getFaster],
};

export const lookahead: AspectPack = {
  id: "lookahead",
  aspectId: "lookahead",
  title: "Lookahead, properly",
  summary: "The three stages of seeing ahead, and the one drill that actually builds them.",
  levels: ["sub45", "sub30", "sub25", "sub20", "sub15"],
  why: "You can solve each pair quickly and still have a slow F2L, because between the pairs you stop. Four pauses of half a second is two seconds, and turning faster makes them longer, not shorter.",
  lessons: [
    {
      id: "lookahead-three-stages",
      title: "Spotting, tracking, knowing",
      takeaway:
        "Lookahead is three distinct skills learned in order, not one thing you either have or do not.",
      minutes: 5,
      body: [
        "The clearest description of lookahead splits it into three stages, and knowing which one you are on tells you what to practise.",
        "Spotting is the beginner stage: you solve the pair you are looking at, then look around for the next one. There is a pause between every pair by construction. Nothing is wrong with you; this is where everyone starts.",
        "Tracking is the middle stage: while your hands solve the current pair, your eyes follow the pieces of the next one as the moves push them around. When the current pair finishes you already know where the next one is, so there is no pause.",
        "Knowing is the last stage: you do not watch the next pair, because you already know where your moves will leave it. You have done this case enough times to predict the result rather than observe it. Fast solvers use a mixture of knowing and tracking, not one or the other.",
        "The order matters. You cannot track while you are still working out how to solve the current pair, because the attention is already spent. Confidence with the pairs themselves is the prerequisite for everything here.",
        "The courses spread the stages out on purpose. Sub-30 works on spotting: finding the next pair quickly, with slow solves where the cube never stops. Sub-20 works on tracking, and Sub-15 keeps it going while you cut rotations. Knowing starts in Sub-12, once the pairs themselves take no thought.",
      ],
      checkpoint: "You can say which of the three stages you are on right now.",
    },
    {
      id: "lookahead-slow-solves",
      title: "Slow solves, and why they feel wrong",
      takeaway:
        "Turn at about half speed with one rule: the cube never stops. Slower turning with no pauses is faster than fast turning with pauses.",
      minutes: 5,
      body: [
        "The drill that builds lookahead is the slow solve, and it is the most recommended and least popular practice in cubing, because it feels like going backwards.",
        "The method: turn at roughly half your normal speed — one to two turns per second during F2L — with a single non-negotiable rule. The cube never stops moving. If you have to pause, you were turning too fast; slow down further until you do not.",
        "That rule is the whole drill. Turning slowly is not the point; turning continuously is. A pause means your eyes did not get where they needed to be in time, and the fix is to give them more time, not to try harder.",
        "It works because it changes what your attention is doing. At full speed, all your attention goes to executing. At half speed, executing is easy and your eyes are free — and the rule makes you use them, because there is no other way to keep the cube moving.",
        "Expect your timed solves to get worse for a session or two. Everyone reports this. People who keep it up for two or three weeks generally report a clear difference, and pause-free F2L in the range of two to three months. Add speed back only for as long as the no-pause rule survives.",
      ],
      checkpoint: "You can do a whole F2L at half speed without the cube ever stopping.",
    },
    {
      id: "lookahead-what-to-look-at",
      title: "Where your eyes should be",
      takeaway: "Not on the pair you are solving. You already know what that one is doing.",
      minutes: 4,
      body: [
        "The single most useful instruction: do not watch the pair you are inserting. You worked out its solution before you started, so watching it tells you nothing.",
        "Instead, as you begin a pair, move your eyes to the two faces you can see that are not involved, and look for pieces of the next pair. You are trying to catch two pieces that go together.",
        "If tracking both pieces is too much at first, track only the corner. Corners are easier to follow because they are at the intersections and their colours are distinctive. Add the edge once the corner is comfortable — this halving of the task is the standard way through.",
        "Rotations are the enemy of this. Every y turn moves everything relative to you and your tracking resets. This is the practical reason rotationless F2L matters so much: not the two moves, but the two moves plus the lost thread.",
      ],
    },
    {
      id: "lookahead-both-pieces",
      title: "The whole pair, with the cube held still",
      takeaway:
        "Follow the corner and its edge, and keep rotations out so the thread doesn't break.",
      minutes: 4,
      body: [
        "In the Sub-20 course you followed the next pair's corner while the current pair went in. The step now is the whole pair: the corner and its edge, so that when the insert ends you already know the case, not just where one piece is.",
        "Find both pieces before you start the current pair, then keep them in view as the moves carry them. A turn that doesn't touch a piece leaves it where it is, so you only have to update your picture on the turns that move it. It is the same rule you use to follow a pair through the cross in inspection.",
        "This is where cutting rotations pays twice. A y turn costs its own time, and it also moves every piece you were following, so you start looking again. Solving a back slot from where you're already holding the cube keeps the thread unbroken.",
        "When you lose track, notice which move did it. It is usually one of a few: a regrip, a rotation, or a top turn you made without thinking.",
      ],
      checkpoint:
        "In most solves you know the next pair's case, corner and edge both, before the current insert ends.",
    },
    {
      id: "lookahead-knowing",
      title: "Knowing where the next pair will be",
      takeaway:
        "At the last stage you do not watch the next pair move. Before you turn, you already know where your moves will leave it.",
      minutes: 5,
      body: [
        "Tracking still needs your eyes on the next pair while your hands work. Knowing removes that: before you start the current pair, you can say where its moves will leave the next pair's corner and edge. Your eyes are then free for the pair after that, or for the last layer. This is the stage to work on once you are under about fifteen seconds and heading for twelve.",
        "It is less mysterious than it sounds, because F2L is built from the same few triggers and a trigger always does the same thing to the pieces it touches. On a solved cube, R U R' takes the edge at the back of the top layer down into the front-right slot: the U turn carries it round to the right and the R' pulls it down. The corner at the top front-left ends up at the top back-left, moved by the U turn alone, because neither R move reaches the left side. Know a handful of facts like these and most of the prediction is recall.",
        "Build them away from solving first. Hold a solved cube, pick a piece, and say where it will be after R U R' before you turn; then turn and check. Lengthen the sequence a move or two at a time until you can follow a piece through seven or eight moves, which is a whole pair solution. It is the one-piece tracking exercise from cross planning, carried on until it covers an F2L pair.",
        "Then use it on real pairs. At the start of F2L, plan two pairs, the second from where the first pair's moves will leave its pieces, and do both without looking. The drill below sets this up. When the second pair comes out wrong, one of your predictions was off, and you can usually find the move.",
        "Keep it in proportion. Fast solvers mix knowing and tracking, and nobody knows the result of every case. In a real solve, knowing one pair ahead is the aim; planning further than that tends to cost more than it saves when a prediction turns out wrong.",
      ],
      checkpoint:
        "Before you insert a pair, you can say where the next pair's corner will be once it is in.",
    },
  ],
  drills: [
    {
      id: "lookahead-slow-solve",
      title: "The slow solve",
      purpose:
        "This is the drill. Everything else on this list supports it. The rule forces your eyes to do work that full-speed solving lets them skip.",
      rules: [
        "Untimed. Turn at about half speed through the whole solve.",
        "One rule: the cube never stops moving during F2L. If it stops, slow down.",
        "Do not watch the pair you are inserting: glance round for the next pair's corner and edge, so you know roughly where they are when the insert ends.",
        "If finding both is too hard, look for just the corner.",
      ],
      dose: "Fifteen to twenty slow solves a session, for two to three weeks.",
      signal:
        "You can hold the no-pause rule at gradually higher speeds. Your F2L test time falls while your single-pair time stays the same — that difference is the pauses.",
      exerciseId: "slow_turning_f2l",
    },
    {
      id: "lookahead-follow-the-corner",
      title: "Follow the next corner",
      purpose:
        "Turns spotting into tracking: you keep the next pair's corner in sight while the moves carry it, so you know where it lands.",
      rules: [
        "Turn at a pace where the cube never stops moving during F2L.",
        "As each pair goes in, pick the next pair's corner and keep your eyes on it while the insert moves it. Say where it ends up before the insert finishes.",
        "Once the corner is easy, follow its edge as well.",
      ],
      dose: "Fifteen solves a session, for two weeks.",
      signal: "You name where the corner landed before you would have had to look for it.",
    },
    {
      id: "lookahead-follow-the-pair",
      title: "Follow the whole pair",
      purpose:
        "Takes tracking from one piece to the pair, so the next case is decided before you get there.",
      rules: [
        "Turn at a pace where F2L never stops, and use no y rotations.",
        "As each pair goes in, keep both pieces of the next pair in view and name the case (for example: corner on top, edge in its slot) before the insert ends.",
        "If you lose a piece, say which move lost it, then slow down a little.",
      ],
      dose: "Fifteen solves a session, for two weeks.",
      signal: "You start each pair without looking for either piece.",
    },
    {
      id: "lookahead-metronome",
      title: "Metronome F2L",
      purpose:
        "Makes pauses audible. You cannot argue with a beat you missed, and it stops you unconsciously speeding up.",
      rules: [
        "Set a metronome to about two beats a second. One turn per beat.",
        "Solve F2L in time with it. Missing a beat is the same as pausing.",
        "Raise the tempo by small steps only once you can hold the current one for a whole F2L.",
      ],
      dose: "Ten solves a session.",
      signal: "The tempo you can hold cleanly creeps upward week by week.",
    },
    {
      id: "lookahead-blind-pair",
      title: "Blind pair",
      purpose:
        "Builds the 'knowing' stage directly: it forces prediction rather than observation, because there is nothing to observe.",
      rules: [
        "Solve the cross. Find a pair and work out its solution. Find a second pair before you start.",
        "Close your eyes. Solve the first pair. Predict where the second pair's pieces are now.",
        "Open your eyes and check. Repeat down the solve.",
      ],
      dose: "Five solves a session. It is tiring; a small dose is fine.",
      signal: "Your predictions go from vague to specific, and then to correct.",
    },
    {
      id: "lookahead-two-pairs-blind",
      title: "Two pairs, eyes closed",
      purpose:
        "Tests knowing directly. The second pair has to be planned from where the first pair's moves will leave it, because there is nothing to look at.",
      rules: [
        "Solve the cross. Pick two pairs and plan both solutions, the second from where the first pair's moves will put its pieces.",
        "Close your eyes and solve both pairs.",
        "Open them and check both slots. If the second one is wrong, find the move in the first pair that you mispredicted.",
        "Start with two pairs whose pieces are all in the top layer, and move to harder ones as the easy ones come out right.",
      ],
      dose: "Five to ten attempts a session. It is tiring, so stop when the planning gets sloppy.",
      signal:
        "Both slots come out right most of the time, and in normal solves the next pair is where you expected when you look for it.",
    },
  ],
  mistakes: [
    "Doing slow solves without the no-pause rule, which is just solving slowly.",
    "Turning faster to fix pauses, which makes them longer.",
    "Watching the pair you are inserting.",
    "Giving up after two days because the timed average got worse. It is supposed to, briefly.",
  ],
  sources: [
    SOURCES.lookaheadFramework,
    SOURCES.cuberpalLookahead,
    SOURCES.cubefreakLookahead,
    SOURCES.slowF2l,
    SOURCES.subTen,
  ],
};

export const lastPairIntoOll: AspectPack = {
  id: "last-pair-into-oll",
  aspectId: "f2l_to_oll",
  title: "The last pair into OLL",
  summary: "The easiest pause in the solve to remove, and the one most people never notice.",
  levels: ["sub30", "sub25", "sub20"],
  why: "The last pair is the one where you relax: F2L is nearly done, there is nothing left to find, and the eyes idle. Then the pair finishes and you look at the top face for the first time, which costs you most of a second.",
  lessons: [
    {
      id: "lastpair-free-attention",
      title: "The last pair is free thinking time",
      takeaway:
        "During the last pair there is nothing left to track. That attention should be reading OLL.",
      minutes: 3,
      body: [
        "Through F2L your eyes are busy finding the next pair. On the last pair there is no next pair, so for the first time in the solve your attention has nothing to do — and by default, it does nothing.",
        "That is the pause. It is not a hard pause to remove, because the information you need is already in front of you: the top face is visible throughout the insertion, and most of the last-layer orientation is already determined before your last pair goes in.",
        "The habit to build is simply looking up. As the last pair goes in, read the top face. By the time the pair is seated you should know your OLL case, or at least which family it is in.",
      ],
      checkpoint: "You know the OLL case before the last pair finishes, most solves.",
    },
    {
      id: "lastpair-partial-read",
      title: "Reading it partly is still worth it",
      takeaway:
        "Knowing 'it is a dot case' before you finish is nearly as good as knowing exactly which one.",
      minutes: 3,
      body: [
        "Full OLL recognition during the last pair is hard, because your last pair's moves change the top face. Partial recognition is much easier and captures most of the benefit.",
        "The shapes group naturally. How many top-face stickers are pointing up — none, two, four — tells you which family you are in, and that narrows the case enough that the final read after the insertion is instant rather than a search.",
        "If you orient edges separately, this is easier again: you only need to see whether the edges are oriented, which is a two-second glance you can do on the last pair without any effort.",
      ],
    },
    {
      id: "lastpair-edge-control",
      title: "Pick the insert that fixes edges",
      takeaway:
        "Some last pairs go in two ways at the same length. Choosing the one that leaves more top edges facing up keeps you out of the dot OLLs at no cost.",
      minutes: 4,
      body: [
        "Some last-pair cases have two good inserts of the same length. Both put the pair in its slot, but they leave the top layer differently, and one of the differences is how many top edges end up with yellow facing up. Choosing between them for that reason is called edge control. At this level the aim is small and worth having: mostly, not getting a dot OLL, where no edge faces up and the algorithms are among the longest.",
        "The case to start with: the last pair already joined on the right of the top layer, the corner right above its slot with white facing you, and the edge beside it on the right with green on top. U R U' R' puts it in. So does the sledgehammer, R' F R F'. Both are four moves and leave the first two layers solved, but they differ by two flipped top edges: when one would leave a dot, the other leaves two edges up, and when one would leave all four up, the other leaves two.",
        "For this case there is a one-glance rule. Look at the top edge at the front. If it shows yellow on top, do U R U' R'; if it does not, do the sledgehammer. That never leaves a dot, and it gives you all four edges up whenever either insert could. The front edge is the only one you need to look at to choose.",
        "Learn it on this case, and perhaps one or two others you meet often, and stop there. This is partial edge control. The full versions are VHLS, which orients all four top edges while inserting a last pair that is already joined, and ZBLS, which does the same from any last-pair case. Both are large algorithm sets and not where your time should go yet.",
        "It pays off later as well. COLL and ZBLL only apply when all four top edges face up after F2L, and Winter Variation only when the three top edges you can see already face up before the last insert. Left to chance, the edges come out facing up after F2L about one solve in eight. On the case above, choosing by the front edge doubles that to one in four, which is why edge control comes before COLL and ZBLL rather than after.",
      ],
      checkpoint:
        "On the joined case above, you choose between U R U' R' and the sledgehammer from the front edge without slowing down.",
    },
    {
      id: "lastpair-influence",
      title: "Influencing the last layer, later",
      takeaway:
        "There are systems that choose your last pair's solution to control the OLL you get. Know they exist; they start to pay once full OLL and PLL are solid, around fifteen seconds.",
      minutes: 3,
      body: [
        "Beyond simply reading the case, there are methods that make the case you get better. Winter Variation is one, but it only applies in one situation: the last pair already joined in the top layer, ready for a U R U' R' insert, with the top edges already oriented. Then it orients the corners during the insert, so PLL comes next. VHLS and ZBLS do a similar job for the edges, and edge control is the small, free version of those.",
        "These are real and worth learning eventually, but they are big: the payoff only exists once your ordinary last pair and last layer are already quick, and they add recognition work in a place where you currently have spare attention. Once full OLL and PLL are solid, around fifteen seconds for most people, that trade starts to make sense.",
        "The reason to mention it now is that it changes what 'good' looks like. The end point is not reading the case quickly; it is choosing the case. Reading it quickly is the step on the way.",
      ],
    },
  ],
  drills: [
    {
      id: "lastpair-call-it",
      title: "Call the OLL",
      purpose:
        "Turns reading the top face into something you have to do, rather than something you might do if you remember.",
      rules: [
        "Solve to the last pair. Before inserting it, say what OLL you expect — the exact case, or the family.",
        "Insert the pair and check.",
        "Being wrong is fine at first. Being silent is not.",
      ],
      dose: "Twenty solves a session, untimed.",
      signal: "Your calls get more specific, then correct, then automatic.",
    },
    {
      id: "lastpair-ls-oll",
      title: "Last slot straight into OLL",
      purpose:
        "Measures the join itself. Practising the pair and the OLL separately hides exactly the thing that is slow.",
      rules: [
        "Use a scramble that leaves the last slot and the last layer.",
        "Solve the pair and the OLL as one continuous thing. No stopping between them.",
        "Compare against your single-pair and OLL times. The extra is the join.",
      ],
      dose: "Ten attempts a session.",
      signal: "Pair time plus OLL time starts to equal your combined time.",
      exerciseId: "ls_oll",
    },
  ],
  mistakes: [
    "Letting the eyes rest during the last pair because F2L is 'done'.",
    "Trying to read the exact OLL case before the pair is in, giving up, and reading nothing.",
    "Learning Winter Variation or similar before the plain version of this is smooth.",
  ],
  sources: [
    SOURCES.getFaster,
    SOURCES.subTen,
    SOURCES.ollAlgs,
    SOURCES.edgeControlThread,
    SOURCES.partialEdgeControl,
    SOURCES.vhlsWiki,
  ],
};
