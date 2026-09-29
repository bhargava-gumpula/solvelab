import { SOURCES } from "../sources";
import type { LevelPack } from "../types";

/*
 * Packs added with the Learning Hub, where the courses had gaps: a first
 * taste of lookahead for the Sub-60 course, rotation-free F2L and edge
 * orientation for the 30 → 15 s stretch, getting unstuck at 15, and the last
 * layer for people chasing sub-10. Every move sequence quoted with a slot is
 * checked by a unit test to touch only that slot and the top layer.
 */

export const firstLookahead: LevelPack = {
  id: "first-lookahead",
  title: "Your first lookahead",
  summary:
    "Finding the next piece while your hands finish this one, on the method you already know.",
  levels: ["sub120"],
  why: "At around two minutes, most of a solve is spent stopped: finish a step, look around the cube, find the next piece, start again. Nobody fixes that by turning faster. It shrinks when your eyes start work on the next piece before your hands have finished the current one, and that habit can start on the beginner method, long before F2L.",
  lessons: [
    {
      id: "first-look-while-turning",
      title: "Look while you turn",
      takeaway: "Your eyes and your hands can work on different pieces at the same time.",
      minutes: 4,
      body: [
        "Watch a two-minute solve and you'll see the same rhythm over and over: a burst of turning, then the cube held still while the solver hunts for the next piece. The hunts add up to most of the time. The turning is not the slow part.",
        "The fix is to start the hunt early. When you know the moves for the piece you're placing — a corner going in with R U R' U', say — your hands can do them without being watched. Use that second to look at the top layer for the next piece you'll need.",
        "It feels wrong at first, because it seems safer to watch your hands. But the moves you know by heart don't need watching, and every piece you find during a trigger is a stop you don't have to make.",
      ],
      checkpoint:
        "While inserting a first-layer corner, you can name where the next corner is before the insert finishes.",
    },
    {
      id: "first-look-slow-down",
      title: "Slow down so you never stop",
      takeaway: "A steady slow pace with no stops beats fast bursts with long searches.",
      minutes: 3,
      body: [
        "If you try to look ahead at your normal speed, you'll find you can't — there isn't time. That's the signal to turn slower, not to give up on looking. Pick a pace where your eyes can keep up: slow enough that the cube never stops moving.",
        "Strangely, these slow solves are often not much slower overall, and sometimes faster, because the long searches disappear. Once looking ahead is comfortable at a slow pace, speed it up a little at a time.",
        "Think of it as a new habit with its own practice, like learning to type without looking at the keys. Slow and correct first; fast comes from repeating it, not from forcing it.",
      ],
      checkpoint: "You can do one full solve at a slow pace where the cube never stops turning.",
    },
    {
      id: "first-look-where",
      title: "Where to look",
      takeaway: "The pieces you need next are nearly always in the top layer, so scan the top.",
      minutes: 3,
      body: [
        "When you solve the first layer and then the middle layer, the piece you need next is almost always in the top layer, because that's where pieces go when they're not yet solved. So you don't have to search the whole cube. Scan the top face and its side stickers.",
        "Look for colours, not positions. If the next corner you want is white, green and red, scan the top for those three colours together. It's quicker to spot a colour you're hunting for than to check each piece in turn.",
        "When the piece is stuck lower down, in the wrong slot, you'll need a move to bring it up first. That's fine, but it's the exception. Train your eyes to go to the top layer first.",
      ],
    },
  ],
  drills: [
    {
      id: "first-look-call",
      title: "Call the next piece",
      purpose: "Makes your eyes move on before your hands finish, which is the whole skill.",
      rules: [
        "Solve the first layer. As you insert each corner, say out loud where the next corner is.",
        "If you have to stop and search, say 'stop' and count it.",
        "Do the same for the middle-layer edges.",
      ],
      dose: "Five solves a day for a week.",
      signal:
        "The number of stops per solve falls, and you often know the next piece before you need it.",
    },
    {
      id: "first-look-never-stop",
      title: "The never-stop solve",
      purpose: "Teaches the slow, steady pace where looking ahead is possible at all.",
      rules: [
        "Turn slowly enough that the cube never stops moving, from the first move to the last.",
        "If you stop, slow down further on the next solve.",
        "Time them, but only to watch the time fall as the pace rises.",
      ],
      dose: "Three solves, twice a day.",
      signal: "Your never-stop solves come within ten seconds of your normal ones, then beat them.",
    },
  ],
  mistakes: [
    "Trying to look ahead at full speed and deciding it doesn't work.",
    "Watching your hands do moves you already know by heart.",
    "Searching the whole cube instead of the top layer.",
    "Turning faster to make up for the time lost searching.",
  ],
  sources: [SOURCES.cubefreakLookahead, SOURCES.subMinute, SOURCES.lookaheadFramework],
};

export const f2lFromTheFront: LevelPack = {
  id: "f2l-from-the-front",
  title: "F2L from the front",
  summary: "Every slot solved without rotating the cube, and when a rotation is still fine.",
  levels: ["sub30", "sub25"],
  why: "A rotation is only two moves' worth of turning, but it moves every piece you were tracking to a new place. Your eyes have to find everything again, and that pause is what costs time. Solving back slots and awkward pairs from where you're already holding the cube keeps your lookahead intact.",
  lessons: [
    {
      id: "front-rotation-cost",
      title: "What a rotation really costs",
      takeaway: "The turn is cheap; losing track of every piece is not.",
      minutes: 4,
      body: [
        "Turning the whole cube takes a fraction of a second. The expensive part comes after: every piece you were watching is now somewhere else, and you have to find the next pair again. That's why a solve with a few rotations often feels choppy even when the moves are fast.",
        "Data from reconstructions of top solvers bears this out for the cross, where crosses with rotations were several times slower than crosses of the same length without. In F2L the picture is more mixed: the fastest solvers do rotate, but mostly at moments where it doesn't interrupt what they're looking at.",
        "So the goal isn't to ban rotations. It's to stop rotating in the middle of looking: to know the moves for back slots and awkward pairs from the front, and to rotate only when it's genuinely the shorter, calmer option.",
      ],
      checkpoint:
        "You can say which of your last five solves had a rotation that broke your lookahead.",
    },
    {
      id: "front-back-slots",
      title: "Back slots without turning",
      takeaway:
        "Back-right inserts are the front ones mirrored, with every turn reversed; the back-left slot uses L.",
      minutes: 5,
      body: [
        "The simplest back-slot inserts mirror the front ones, and mirroring front to back reverses every turn. R U R' at the front becomes R' U' R at the back, and R U' R' becomes R' U R: the same shape, with R' lifting the back-right slot instead of R lifting the front one. On the left, L U L' does the same for the back-left slot.",
        "At first you'll have to think about which way the pair must be facing. Set up each case slowly: put a pair in the back-right slot, undo it with R' U R, and look at where the pieces end up. That's the case R' U' R solves. Do the same for the other back-slot inserts until you recognise them on sight.",
        "There are also neater tricks for back slots, like f R' f', which uses a wide front turn to reach the back-right slot. Learn the simple mirrors first; they cover most cases and they're easy to execute at speed.",
      ],
      examples: [
        {
          label: "Back-right insert",
          moves: "R' U' R",
          slot: "BR",
          note: "The back-right mirror of R U R'. R' lifts the slot and brings the corner beside its edge, U' swings the pair over the slot, R puts it down.",
        },
        {
          label: "Back-right insert, other way round",
          moves: "R' U R",
          slot: "BR",
          note: "The back-right mirror of R U' R'.",
        },
        {
          label: "Back-left insert",
          moves: "L U L'",
          slot: "BL",
          note: "The same idea on the left side of the back.",
        },
        {
          label: "Back-right with a wide move",
          moves: "f R' f'",
          slot: "BR",
          note: "Reaches the back-right slot with a wide F turn instead of a rotation. Worth learning once the simple mirrors are automatic.",
        },
      ],
      checkpoint: "You can insert a ready pair into either back slot without rotating.",
    },
    {
      id: "front-f-moves",
      title: "F moves for awkward front pairs",
      takeaway: "A single F or F' often saves a rotation and several moves.",
      minutes: 4,
      body: [
        "Some pairs are easy to solve if you're allowed to turn the front face, and awkward if you insist on R and U. F' U F puts a pair into the front-right slot from a position that would otherwise need a rotation; F U F' does the same on the front-left.",
        "The sledgehammer, R' F R F', is another useful tool: it solves a pair into the front-right slot from a state that would take far more moves with R and U alone. Many solvers already know it from OLL.",
        "F moves are slightly harder to turn quickly than R and U, so don't reach for them by default. Use them where they replace a rotation or a long sequence, and practise them until they're as smooth as the rest.",
      ],
      examples: [
        {
          label: "F-move insert, front-right",
          moves: "F' U F",
          slot: "FR",
          note: "Three moves, no rotation, for a pair that R and U would make awkward.",
        },
        {
          label: "F-move insert, front-left",
          moves: "F U F'",
          slot: "FL",
          note: "The left-hand version.",
        },
        {
          label: "Sledgehammer",
          moves: "R' F R F'",
          slot: "FR",
          note: "A familiar trigger doing a new job: solving a front-right pair.",
        },
        {
          label: "Across the cube",
          moves: "R2 u R2 u' R2",
          note: "Swaps the edges of the front-right and back-left slots and leaves the other two slots alone. The corners don't travel with them: the back-left corner stays put, and the front-right slot's corner trades places with the top corner above it. Useful when your front-right edge is stuck back-left with green facing the back, and its corner waits above the slot with white facing up.",
        },
      ],
    },
  ],
  drills: [
    {
      id: "front-no-rotation",
      title: "No rotations",
      purpose: "Forces you to find the front-facing solution for back slots and awkward pairs.",
      rules: [
        "Solve F2L without a single cube rotation.",
        "If a pair seems impossible, slow down and try a back-slot insert or an F move.",
        "Note the cases that made you want to rotate.",
      ],
      dose: "Twelve solves, three times a week.",
      signal:
        "Your list of 'wanted to rotate' cases shortens, and your normal solves have fewer rotations without trying.",
      exerciseId: "f2l_only",
    },
    {
      id: "front-back-slot-reps",
      title: "Back-slot reps",
      purpose: "Makes the back-slot inserts as automatic as the front ones.",
      rules: [
        "Put a pair in the back-right slot and take it out with R' U' R.",
        "Put it back with R' U R, looking at the pair, not your hands.",
        "Repeat for the back-left with L U' L' and L U L'.",
      ],
      dose: "Two minutes each side before every session.",
      signal: "You recognise back-slot cases as quickly as front ones.",
    },
  ],
  mistakes: [
    "Banning every rotation, even the ones that are genuinely shorter.",
    "Rotating in the middle of tracking a pair.",
    "Learning clever back-slot tricks before the simple mirrors are automatic.",
    "Reaching for F moves when R and U would do.",
  ],
  sources: [SOURCES.advancedF2lTricks, SOURCES.reconStats, SOURCES.f2lAllSlots, SOURCES.emptySlots],
};

export const goodAndBadEdges: LevelPack = {
  id: "good-and-bad-edges",
  title: "Good edges, bad edges",
  summary: "Seeing at a glance which F2L edges will go in easily, and which will fight you.",
  levels: ["sub20"],
  why: "Some F2L edges can be solved with R, L and U alone; others can't, whatever you do with those faces. Most solvers discover this case by case, as pairs that 'always feel awkward'. Learning to see it in one glance tells you which pair to solve next and when an F move or a different approach will save you time.",
  lessons: [
    {
      id: "edges-what-good-means",
      title: "What 'good' means",
      takeaway: "A good edge can be solved with R, L, U and D; a bad one needs an F or B turn.",
      minutes: 4,
      body: [
        "Turning R, L, U or D never flips an edge relative to the front and back. Turning F or B a quarter turn flips all four edges on that face. That's the whole idea behind edge orientation: every edge is either good, meaning it can be solved using R, L, U and D, or bad, meaning something has to flip it first.",
        "In a scrambled cube, about half the edges start bad, and the number of bad edges is always even. Your cross and F2L moves change which ones are bad whenever you use F or B, or rotate the cube.",
        "This matters for F2L because a pair with a bad edge can't be inserted with R and U alone, however you pair it. That's why some pairs always seem to need a rotation or an F move: the edge is bad relative to the way you're holding the cube.",
      ],
      checkpoint: "You can explain why R U R' never fixes a bad edge.",
    },
    {
      id: "edges-spotting",
      title: "Seeing it at a glance",
      takeaway: "For an F2L edge on top, look at its top sticker: front or back colour is good.",
      minutes: 5,
      body: [
        "For an F2L edge in the top layer, look only at the sticker on top. If it's the colour of your front or back centre, the edge is good. If it's the colour of your left or right centre, it's bad. You don't need to look at the side sticker at all.",
        "For an edge in the middle layer, look at the sticker facing front or back instead. If that sticker is the left or right colour, the edge is bad; if it's the front or back colour, it's good. Last-layer edges follow the same rule, which reduces to something you already know: yellow on top is good.",
        "This rule is about how you're holding the cube right now. Rotate the cube a quarter turn and the front and back colours change, so edges that were bad can become good. That's the real reason a rotation sometimes makes an awkward pair easy.",
      ],
      checkpoint: "Given any top-layer F2L edge, you can call it good or bad in under a second.",
    },
    {
      id: "edges-using-it",
      title: "What to do with a bad edge",
      takeaway:
        "Prefer pairs with good edges, and fix a bad one with a single F move or a rotation.",
      minutes: 4,
      body: [
        "When you have a choice between two pairs, the one with a good edge is usually the shorter, smoother solve. Checking the edge first is a quick way to choose, and it's the same check pseudoslotting relies on.",
        "When you must solve a pair with a bad edge, you have three honest options: an F or B move that flips it, such as F' U F into the front-right slot; a rotation that makes it good relative to your new front; or leaving it for later, when another pair's moves may flip it for you.",
        "Some solvers go further and control the last-layer edges too, flipping them during the last pair so that OLL becomes easier. That's a bigger project, covered in the last-layer pack. For now, just learning to see good and bad edges will make your pair choices better.",
      ],
      examples: [
        {
          label: "Flipping with an F move",
          moves: "F' U F",
          slot: "FR",
          note: "An F-move insert: the F turn flips the edge that R and U couldn't fix.",
        },
      ],
    },
  ],
  drills: [
    {
      id: "edges-call-it",
      title: "Good or bad?",
      purpose: "Makes edge orientation a glance rather than a thought.",
      rules: [
        "After the cross, before solving anything, point at each F2L edge in the top layer and say good or bad.",
        "Check yourself by trying the pair with R and U only.",
        "Then solve normally.",
      ],
      dose: "Ten solves a day for a week.",
      signal: "You call every edge right without hesitating.",
      exerciseId: "f2l_only",
    },
    {
      id: "edges-choose-good",
      title: "Good edges first",
      purpose: "Uses edge orientation to choose which pair to solve next.",
      rules: [
        "Whenever you have two pairs to choose from, solve the one with the good edge first.",
        "If both are bad, solve the one that needs a single F move.",
        "Count rotations per solve.",
      ],
      dose: "Twelve solves.",
      signal: "You rotate less, and fewer pairs feel awkward.",
      exerciseId: "f2l_only",
    },
  ],
  mistakes: [
    "Trying different R and U sequences on a pair whose edge is bad.",
    "Checking both stickers of every edge instead of just the top one.",
    "Forgetting that a rotation changes which edges are good.",
    "Jumping into full edge control before you can see edge orientation at a glance.",
  ],
  sources: [
    SOURCES.edgeOrientationWiki,
    SOURCES.pseudoslotting,
    SOURCES.multislotting,
    SOURCES.keyhole,
  ],
};

export const stuckAtFifteen: LevelPack = {
  id: "stuck-at-fifteen",
  title: "Stuck at 15",
  summary:
    "Why progress stops around 15 seconds, and how to find the leak that's holding you there.",
  levels: ["sub20"],
  why: "Getting to 15 seconds is mostly learning things: full PLL, F2L, a decent cross. After that, the big lessons are done and the remaining time is spread across small leaks, each worth a few tenths of a second. More normal solves repeat those leaks faithfully. Finding the biggest one and working on it on purpose is what breaks the plateau.",
  lessons: [
    {
      id: "fifteen-whats-left",
      title: "What's left at 15",
      takeaway: "At 15 seconds the big lessons are learned; what's left is several small leaks.",
      minutes: 4,
      body: [
        "Below about 20 seconds, most people improve by adding knowledge: full PLL, intuitive F2L, a planned cross. By 15, those are done, and it can feel as if nothing else will help. Solves get faster in the good sessions and slower in the bad ones, and the average stays put.",
        "What's usually left is a handful of small leaks. Pauses between F2L pairs. A cross that stops at the cross, so the first pair starts with a search. A few last-layer cases that take twice as long as the others. Lockups and regrips in the middle of algorithms. Each one is worth a few tenths of a second.",
        "The experienced advice on this is remarkably consistent: at this level, it's F2L lookahead and efficiency, planning the cross and first pair, and the last-layer cases you're slow at, rather than new algorithm sets. Full OLL helps, but it rarely breaks a plateau on its own.",
      ],
      checkpoint: "You can name the three biggest places your own solves lose time.",
    },
    {
      id: "fifteen-find-the-leak",
      title: "Find the biggest leak",
      takeaway: "Measure the parts; the one furthest behind its goal is where to start.",
      minutes: 5,
      body: [
        "Guessing is unreliable, because the leaks you notice are not always the biggest. A slow PLL is memorable; half a second of pausing spread over four pairs is not. That's why this app times each part of the solve on its own and compares it with what a solver at your goal usually does.",
        "Take the skill tests, then look at your profile. The part furthest behind its goal is usually the right place to start, especially if it's something that happens every solve, like the F2L pauses, rather than something occasional, like one rare PLL.",
        "If you'd rather check by hand, film ten solves and count: how long between finishing the cross and starting the first pair, how many times the cube stops in F2L, and how long each last-layer case takes. The numbers will surprise you.",
      ],
      checkpoint: "You have one measured weakness to work on, not a list of ten.",
    },
    {
      id: "fifteen-two-weeks",
      title: "Two weeks on one thing",
      takeaway: "Pick one leak, drill it for two weeks, then retest before choosing the next.",
      minutes: 4,
      body: [
        "Plateaus often survive because practice keeps changing. A lookahead drill on Monday, algorithms on Tuesday, normal solves the rest of the week: nothing gets enough repetition to become a new habit.",
        "Pick the one leak you measured and give it most of your practice for two weeks, with the right drill for it. Keep some normal solves in every session so the new habit gets used in real solves, not just in the drill.",
        "Then retest that part. Averages bounce around from day to day, so compare over the whole two weeks, not one session. If the number moved, keep going or move to the next leak. If it didn't, change the drill, not the goal.",
      ],
      checkpoint: "You've written down one focus, its drill, and the date you'll retest.",
    },
  ],
  drills: [
    {
      id: "fifteen-leak-audit",
      title: "The leak audit",
      purpose: "Turns 'I'm stuck' into a number for each part of your solve.",
      rules: [
        "Take the core skill tests in the Learning Hub, one sitting per day if needed.",
        "Open your profile and write down the part furthest behind its goal.",
        "Choose the pack for that part and its first drill.",
      ],
      dose: "Once, then again every two weeks.",
      signal: "You know exactly what you're working on and why.",
    },
    {
      id: "fifteen-one-focus",
      title: "One focus, two weeks",
      purpose: "Gives one habit enough repetition to replace the old one.",
      rules: [
        "Spend about two-thirds of each session on the drill for your chosen leak.",
        "Finish with twelve normal solves, trying to use the new habit.",
        "Don't change focus until the two weeks are up and you've retested.",
      ],
      dose: "Every session for two weeks.",
      signal:
        "The retest for that part improves, and your normal average follows a week or two later.",
    },
  ],
  mistakes: [
    "Learning a big new algorithm set to break a plateau caused by pauses.",
    "Changing focus every session.",
    "Judging progress on one good or bad day.",
    "Doing hundreds of normal solves and hoping the average moves.",
  ],
  sources: [
    SOURCES.sub15Thread,
    SOURCES.deliberatePractice,
    SOURCES.practiceTips,
    SOURCES.solveSplits,
  ],
};

export const lastLayerAtTheTop: LevelPack = {
  id: "last-layer-at-the-top",
  title: "The last layer at the top",
  summary: "Skips, oriented edges and COLL: what's worth chasing when every tenth counts.",
  levels: ["sub12"],
  why: "Below 12 seconds the last layer is around a quarter of the solve, and small gains there are real. But it's also where a lot of effort goes into things that barely move the average. Knowing the actual odds and costs keeps that effort pointed at what pays.",
  lessons: [
    {
      id: "top-skips-are-maths",
      title: "Skips are maths",
      takeaway: "A PLL skip comes once in 72 solves; chasing skips barely moves an average.",
      minutes: 4,
      body: [
        "After a normal OLL, the chance that the last layer is already solved apart from a turn — a PLL skip — is 1 in 72. An OLL skip is 1 in 216, and skipping the whole last layer is 1 in 15,552. These are fixed by the number of possible cases, not by luck you can train.",
        "That puts skips in perspective. A PLL skip saves about a second, once every 72 solves: roughly a hundredth of a second per solve on average. It feels huge when it happens, which is why skips get so much attention, but they barely move an average of 100.",
        "What does move the average is making every case a little faster and making the common cases reliable. The next two lessons are about the tools that change the odds legitimately: solving corners and edges more cleverly, not hoping for skips.",
      ],
      checkpoint: "You can work out roughly how much a one-in-72 skip is worth per solve.",
    },
    {
      id: "top-coll",
      title: "Oriented edges, then COLL",
      takeaway: "When the edges are oriented, COLL leaves only an edge PLL, with a 1 in 12 skip.",
      minutes: 5,
      body: [
        "When all four last-layer edges are already oriented after F2L, you're in one of the seven corner-orientation cases of OLL, the ones like Sune and Antisune. You can solve them with OLL and then PLL as usual. Or you can use COLL, which orients and places the corners together in one algorithm.",
        "After COLL, only the edges can be out of place, so the PLL is always a U perm, an H perm, a Z perm or nothing. The chance of nothing is 1 in 12, and the rest are the fastest PLLs there are. COLL is 40 cases, which is why it's often the first set people learn after full OLL and PLL.",
        "The algorithm bank in this app has COLL with verified algorithms and pictures. Learn it by corner case: the Sune family first, since it comes up most.",
      ],
      checkpoint: "You can explain why a COLL always leaves an edge-only PLL.",
    },
    {
      id: "top-edge-control",
      title: "Edge control, honestly",
      takeaway:
        "Flipping last-layer edges during the last pair is possible, but full systems rarely pay.",
      minutes: 4,
      body: [
        "Edge control means inserting the last F2L pair in a way that also orients the last-layer edges, so that you always land in an easier OLL. Full systems exist: ZBLS does it for every last-pair case, and a smaller system called VHLS handles the cases where the last pair is already joined and ready to insert.",
        "They're usually not worth it for a CFOP solver. ZBLS is well over a hundred algorithms, many of them awkward, and experienced solvers generally advise learning full OLL instead. The saving over a good full OLL is small.",
        "A few simple cases are worth knowing, though: when the last pair is already made and one short alternative insert happens to leave all edges oriented, taking it gives you an easier OLL for free. Treat it as a bonus, never as a system to learn before full OLL and PLL are fast.",
      ],
    },
  ],
  drills: [
    {
      id: "top-oll-only-edges",
      title: "Oriented-edge audit",
      purpose:
        "Shows how often you actually land in a corner-only OLL, so you know what COLL is worth to you.",
      rules: [
        "Over 50 solves, tally how often all four last-layer edges are oriented after F2L.",
        "For those, note whether your OLL and PLL together were faster than a second and a half.",
        "Decide from the tally whether COLL is your next project.",
      ],
      dose: "50 solves, once.",
      signal: "You have a clear number for how often COLL would apply in your own solves.",
    },
    {
      id: "top-coll-sune",
      title: "Sune family COLL",
      purpose: "Starts COLL where it comes up most.",
      rules: [
        "Learn the Sune and Antisune COLL cases from the algorithm bank, a few at a time.",
        "Drill recognition from the bank's pictures before execution.",
        "Use them in solves only once recognition is instant.",
      ],
      dose: "Three new cases a week.",
      signal: "Sune-family last layers become one algorithm plus a U perm or a skip.",
      exerciseId: "oll_pll_only",
    },
  ],
  mistakes: [
    "Structuring practice around getting skips.",
    "Learning a large last-slot system before OLL and PLL are fast.",
    "Learning COLL without the recognition to use it at speed.",
    "Judging a new algorithm set on a few lucky solves.",
  ],
  sources: [SOURCES.llHierarchy, SOURCES.algSets, SOURCES.vhlsWiki, SOURCES.edgeControlThread],
};

export const pastTheFirstPair: LevelPack = {
  id: "past-the-first-pair",
  title: "Seeing past the first pair",
  summary: "Using the end of inspection to know where your second pair will be.",
  levels: ["sub12"],
  why: "Near sub-10, a planned cross and first pair are the starting point, not an advantage. The next pause in the solve comes straight after that first pair, when the search for the second begins. Knowing where the second pair's pieces will be before you start removes it.",
  lessons: [
    {
      id: "past-why",
      title: "Why inspection keeps paying",
      takeaway: "Every pause you remove is a bigger share of a faster solve.",
      minutes: 4,
      body: [
        "At twenty seconds, a half-second pause is a small fraction of the solve. At ten, the same pause is five per cent of it. That's why the faster you get, the more of your improvement comes from removing pauses rather than turning faster.",
        "The standard advice for going sub-10 already includes planning the cross in eight moves or fewer and knowing your first pair. After that, the earliest pause left in most solves is the moment the first pair goes in and you look for the second.",
        "Inspection can remove that pause too. Not by planning the second pair's moves — that's too much for fifteen seconds — but by knowing where its pieces are and where your first moves will leave them.",
      ],
      checkpoint: "You can say which pair you'll solve second in at least some of your solves.",
    },
    {
      id: "past-track",
      title: "Track one piece, don't plan it",
      takeaway:
        "Follow the second pair's corner through your plan; that's enough to start it without a search.",
      minutes: 5,
      body: [
        "Planning a second pair in full is unrealistic in inspection. Tracking one piece of it isn't. Pick the second pair's corner and follow it through the cross and first-pair moves you've planned, the same way you track pieces while planning a cross.",
        "Choose a corner your plan barely touches if you can: one in the top layer on the side away from your first pair. A piece your moves don't disturb is free to track, because it will still be where you saw it.",
        "When the first pair goes in, your eyes go straight to where that corner is, and its edge is usually found in the same glance. The search that used to take half a second becomes a look.",
      ],
      checkpoint:
        "After executing cross and first pair, you know where your chosen corner is without looking for it.",
    },
    {
      id: "past-practise",
      title: "Build it without the clock first",
      takeaway: "Learn it with unlimited inspection, then squeeze it back into fifteen seconds.",
      minutes: 4,
      body: [
        "Like planning the cross, this skill grows fastest without time pressure. Take unlimited inspection, plan the cross and first pair, then find the second pair's corner and predict where it will end up. Execute, and check whether you were right.",
        "Once you're usually right, bring the limit back to fifteen seconds. Your hit rate will drop, and that's fine: on scrambles where there's no time left, the old habit of searching after the first pair is still there as a fallback.",
        "Blindfolded checks are the strongest version of the drill: plan, close your eyes, do the cross and first pair, and say where the corner is before opening them. It's hard, and it's exactly the skill that separates planning from hoping.",
      ],
    },
  ],
  drills: [
    {
      id: "past-blind",
      title: "Blind cross and pair",
      purpose: "Proves the plan is really in your head, not being finished during the solve.",
      rules: [
        "Plan the cross and first pair, then close your eyes.",
        "Execute both with your eyes closed.",
        "Before opening them, say where the second pair's corner is. Then check.",
      ],
      dose: "Ten scrambles a session.",
      signal:
        "Most of your blind cross-and-pairs come out solved, and your corner calls are usually right.",
      exerciseId: "cross_first_pair",
    },
    {
      id: "past-call-second",
      title: "Call the second pair",
      purpose: "Makes looking past the first pair part of every inspection.",
      rules: [
        "In inspection, after the cross and first pair, pick the second pair's corner.",
        "Say where it will be once the first pair is in.",
        "Solve, and note whether the second pair started without a search.",
      ],
      dose: "Twelve solves a session for two weeks.",
      signal: "The pause after your first pair disappears in more and more solves.",
    },
  ],
  mistakes: [
    "Trying to plan the second pair's moves instead of tracking one piece.",
    "Tracking a piece your plan moves around, when a quieter one was available.",
    "Going straight to fifteen seconds before it works with unlimited time.",
    "Letting the extra planning make the cross itself less certain.",
  ],
  sources: [SOURCES.crossPlusPair, SOURCES.subTen, SOURCES.sub10Thread, SOURCES.extendedCross],
};

export const speedYouCanUse: LevelPack = {
  id: "speed-you-can-use",
  title: "Turning speed you can use",
  summary:
    "The gap between how fast your hands turn and how fast your solves are, and how to close it.",
  levels: ["sub15"],
  why: "Most solvers at this level can turn a known sequence far faster than they turn during a solve. The difference is time spent not turning: looking, deciding, regripping. Raising your top speed doesn't touch that time, so it helps less than it feels like it should.",
  lessons: [
    {
      id: "speed-two-tps",
      title: "Two kinds of turning speed",
      takeaway:
        "Burst speed is how fast your hands go; solve speed includes every pause. The gap is thinking time.",
      minutes: 4,
      body: [
        "There are two numbers worth separating. Burst speed is how fast you turn a sequence you know cold: the turning speed test in this app measures it. Solve speed is the moves in a whole solve divided by its time, pauses and all.",
        "Suppose your burst speed is nine turns a second and a solve takes 55 moves. Turning alone would take about six seconds. If the solve took twelve, nearly six seconds of it was spent not turning: looking, choosing, regripping.",
        "That's why the fastest route to faster solves at this level is rarely faster hands. It's shrinking the time between turns, and the bigger your gap between the two numbers, the more there is to gain.",
      ],
      checkpoint: "You know roughly how your burst speed compares with your solve speed.",
    },
    {
      id: "speed-raise-floor",
      title: "Raise the floor, not the ceiling",
      takeaway: "A steady F2L at a pace you can hold beats bursts separated by searches.",
      minutes: 4,
      body: [
        "Experienced solvers describe a steady F2L speed as a milestone: around six turns a second through F2L, held without stopping, is often quoted for sub-10. The important word is held. Six turns a second with no pauses is faster than nine with a stop between every pair.",
        "The way to build it is the metronome: pick a pace where F2L never stops, and raise it only when a whole set of solves goes by without a pause. You're raising the slowest part of your solve, not the fastest.",
        "When a pause does come back at a higher pace, drop back. The pace you can hold without stopping is your real F2L speed, and it's the number that moves your average.",
      ],
      checkpoint: "You have a metronome pace at which your F2L never stops.",
    },
    {
      id: "speed-algorithms",
      title: "Algorithms at full speed",
      takeaway:
        "Practise algorithms from the grip they really start from, with a second fingertrick for awkward starts.",
      minutes: 4,
      body: [
        "An algorithm drilled from a perfect starting grip isn't the algorithm you do in a solve, where it starts from wherever your hands were after the last pair. That difference is a regrip, and regrips are where much of the gap between burst and solve speed hides.",
        "One well-known way to practise this is doing last slot and last layer together, from real scrambles, so every algorithm starts from a real position. Another is learning a second fingertrick for your most common algorithms, so you can take whichever one your hands are already set up for.",
        "Keep it calm. Top solvers consistently say turning speed comes from quiet hands and a stable cube, not from force. An algorithm that locks up at full speed is slower than the same algorithm done cleanly a little slower.",
      ],
    },
  ],
  drills: [
    {
      id: "speed-gap",
      title: "Find your gap",
      purpose: "Puts a number on how much of your solve is spent not turning.",
      rules: [
        "Take the turning speed test for your burst speed.",
        "Film three normal solves and count their moves.",
        "Divide moves by time for each, and compare with your burst speed.",
      ],
      dose: "Once, then every month.",
      signal: "Your solve speed climbs towards your burst speed over the months.",
      exerciseId: "tps_test",
    },
    {
      id: "speed-metronome-ladder",
      title: "Metronome ladder",
      purpose: "Raises the pace you can hold without pausing, which is the one that counts.",
      rules: [
        "Set a metronome to a pace where your F2L never stops, one turn per beat.",
        "When five F2Ls in a row go by with no pause, raise it a little.",
        "If a pause comes back, drop back to the last pace.",
      ],
      dose: "Ten minutes a session.",
      signal: "Your no-pause pace creeps up week by week.",
      exerciseId: "f2l_only",
    },
  ],
  mistakes: [
    "Chasing a faster burst speed while the pauses stay the same.",
    "Drilling algorithms only from a perfect starting grip.",
    "Turning harder instead of more calmly.",
    "Raising the metronome pace before the pauses are gone.",
  ],
  sources: [SOURCES.turningSpeed, SOURCES.sub10Thread, SOURCES.limits, SOURCES.reconStats],
};

export const practisingNearTen: LevelPack = {
  id: "practising-near-ten",
  title: "Practising near ten",
  summary:
    "Measuring progress when the gains are tenths, and structuring practice around one skill at a time.",
  levels: ["sub10"],
  why: "Close to ten seconds, the improvements that are left are small, and your times vary by more than they improve from week to week. Practice that worked at twenty — lots of solves, judged by how they feel — can go on for months without moving anything. How you measure and how you structure practice matter more than how much you do.",
  lessons: [
    {
      id: "near-measure",
      title: "Measure over hundreds",
      takeaway:
        "Day-to-day swings are bigger than real progress; judge by averages of 100 or more.",
      minutes: 4,
      body: [
        "If your solves vary by about a second either way, an average of twelve can easily move by a third of a second from one day to the next with no change in skill at all. At this level that's the size of a real improvement, so short averages can't tell you whether practice is working.",
        "Averages get steadier the more solves they include: roughly, the wobble shrinks with the square root of the number of solves. With a spread of about a second, an average of 100 is typically within a tenth or so of your true level, which is fine enough to see real change.",
        "So keep a running average of 100 and check it weekly, not after each session. And compare like with like: warmed up, the same cube, the same time of day where you can.",
      ],
      checkpoint: "You know your average of 100 and what it was a month ago.",
    },
    {
      id: "near-structure",
      title: "One skill per block",
      takeaway:
        "Hours without a focus stop working near sub-10; blocks aimed at one skill still do.",
      minutes: 4,
      body: [
        "A common story at this level: a year of heavy practice and almost nothing to show for it. It's rarely a lack of effort. It's that normal solves repeat existing habits, and near ten seconds the habits are the limit.",
        "What works instead is practice aimed at one skill at a time: an F2L-only block with a rule attached, a trainer session on your slowest last-layer cases, inspection drills with your eyes closed. Each block has a purpose and a measure, like the drills in this app.",
        "Keep normal solves in every session, at the end, so the skill you just drilled gets used for real. Then give it weeks, not days, before judging it by your average of 100.",
      ],
      checkpoint: "Your last session had one named skill and a drill for it.",
    },
    {
      id: "near-warm-up",
      title: "Warm up before you measure",
      takeaway:
        "Your first solves of a session are usually not your real level; warm up, then time.",
      minutes: 3,
      body: [
        "Many fast solvers notice that their first few solves of a session are slower and less consistent than the rest. Measuring those as if they were your level drags every average down and hides improvement.",
        "A short warm-up helps: a minute or two of algorithm reps, then a few untimed solves, before anything that counts. It also makes your averages comparable from day to day, which is the whole point of measuring.",
        "Competitions are the exception that proves the rule: there's often no warm-up before the first attempt. If you compete, it's worth sometimes practising a cold first solve on purpose, so it's not a surprise.",
      ],
    },
  ],
  drills: [
    {
      id: "near-weekly-ao100",
      title: "The weekly average of 100",
      purpose: "Gives you a measure steady enough to see tenths of improvement.",
      rules: [
        "Once a week, warmed up, do 100 normal solves across the day.",
        "Write down the average and the median.",
        "Compare with last week's only as part of a month-long trend.",
      ],
      dose: "Once a week.",
      signal: "The trend over a month moves, even when single weeks don't.",
    },
    {
      id: "near-focused-block",
      title: "The focused block",
      purpose: "Turns practice time into work on the skill that's actually limiting you.",
      rules: [
        "Pick the part of your profile furthest behind its goal.",
        "Spend twenty minutes on that part's drill, with its rule.",
        "Finish with twelve normal solves.",
      ],
      dose: "Every session, same focus for two weeks.",
      signal: "The retest for that part improves before your overall average does.",
    },
  ],
  mistakes: [
    "Judging progress by an average of 12 or a single session.",
    "Measuring before warming up.",
    "Long sessions of normal solves with no focus.",
    "Changing focus before the weeks are up.",
  ],
  sources: [
    SOURCES.practiceTips,
    SOURCES.deliberatePractice,
    SOURCES.practiceSession,
    SOURCES.sub10Thread,
  ],
};
