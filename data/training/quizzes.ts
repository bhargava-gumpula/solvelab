import type { LessonQuiz } from "./types";

/**
 * A check question for every lesson, keyed by lesson id (pack lessons and the
 * method lessons alike). Each one asks the reader to use the idea, not to
 * recognise the wording, and explains the answer either way. A unit test
 * checks every key is a real lesson and every lesson has a question.
 */
export const LESSON_QUIZZES: Record<string, LessonQuiz[]> = {
  // A cross worth eight moves
  "cross-bottom": [
    {
      question: "Why is a cross solved on top slower, even if the cross itself is just as fast?",
      options: [
        "It takes more moves, since every edge has to come up first",
        "You flip before F2L, and can't see the slots while you build it",
        "Top-face turns use the weaker fingers, so each move is slower",
        "You spend inspection turning the cube over instead of planning",
      ],
      answer: 1,
      why: "The cross takes the same moves either way. The cost is the z2 or x2 flip afterwards, plus losing the view of the slots — and of pairs forming — while you build it.",
    },
  ],
  "cross-move-count": [
    {
      question: "Your cross took 12 moves. What does that tell you?",
      options: [
        "Nothing much: some scrambles need twelve or more moves",
        "A shorter one existed: any cross can be done in eight or fewer",
        "The scramble was a hard one; most crosses take ten to twelve moves",
        "You should work on turning faster rather than on moves",
      ],
      answer: 1,
      why: "Every cross can be solved in eight moves or fewer, so twelve means a shorter solution was there. That's what makes the cross easy to self-check: just count.",
    },
  ],
  "cross-pairing-edges": [
    {
      question:
        "Two cross edges sit next to each other on the bottom with their colours correctly adjacent, but both in the wrong place. What's the efficient move?",
      options: [
        "Take both out and put each one home with its own moves",
        "Leave them; one D turn puts both home once the others are in",
        "Lift both to the top, then drop them in with one turn",
        "Fix the one nearest its spot, then bring the other to it",
      ],
      answer: 1,
      why: "Edges that are already right relative to each other are free: a single D turn places both. Solving them one at a time throws that away.",
    },
  ],
  // Using all fifteen seconds
  "inspection-what-it-is": [
    {
      question: "What's the real goal of inspection?",
      options: [
        "To look over every face so nothing surprises you mid-solve",
        "To start with nothing left to decide about the cross",
        "To find the hardest F2L pair so you can get it out of the way",
        "To settle your nerves so the first moves come out smoothly",
      ],
      answer: 1,
      why: "Thinking during inspection is free; thinking during the solve costs time. The aim is to arrive at the first move with the cross already decided.",
    },
  ],
  "inspection-ladder": [
    {
      question: "Which rung of the planning ladder stops most people, and why?",
      options: [
        "Finding all four edges, because they hide on the far faces",
        "Planning the second edge, as you must picture a cube you can't see",
        "Planning all four at once, as it takes all fifteen seconds",
        "Planning the first edge, as it often needs four or more moves",
      ],
      answer: 1,
      why: "Planning the second edge means holding the cube state after the first edge in your head. It's the first rung that needs imagination, and everything above it is the same skill repeated.",
    },
  ],
  "inspection-tracking": [
    {
      question: "What's a good way to practise the skill underneath cross planning?",
      options: [
        "Do cross-only timed solves and try to beat your best time each day",
        "Eyes closed, follow one piece of a solved cube through R U R'",
        "Learn a set of cross algorithms for the common edge positions",
        "Solve the cross on top first, where you can watch each edge",
      ],
      answer: 1,
      why: "Planning is tracking pieces through moves you haven't made yet. Practising that directly, away from solving, builds it faster — and it transfers to F2L lookahead.",
    },
  ],
  "inspection-next-pair": [
    {
      question:
        "Your cross plan reliably takes eight seconds of inspection. What should you do with the rest?",
      options: [
        "Go over each cross edge once more",
        "Find which pair you'll solve first",
        "Plan a shorter version of the cross",
        "Look ahead for a last-layer skip",
      ],
      answer: 1,
      why: "Once the cross is dependable, the next best use of inspection is knowing your first pair. It removes the pause at the start of F2L, one of the costliest in the solve.",
    },
  ],
  "inspection-cross-plus-one": [
    {
      question:
        "Once your cross is planned in inspection, what does this lesson have you work out about your first pair?",
      options: [
        "A full plan for the second pair's moves too",
        "An x-cross, found by searching until one appears",
        "Where its corner and edge end up after the cross",
        "Nothing more: the pair is easy to find later",
      ],
      answer: 2,
      why: "Cross moves that turn through the pair's corner or edge carry them somewhere else. Following both through the cross lets you start the pair without searching. Take an x-cross only when the scramble offers one.",
    },
  ],
  // The join after the cross
  "join-why-it-exists": [
    {
      question: "Where does the pause after the cross come from?",
      options: [
        "Regripping after the cross, which takes your hands a moment",
        "Watching the cross finish, so the pair search starts from nothing",
        "The last cross moves are hard and need your full attention",
        "F2L cases are much harder to recognise than cross edges",
      ],
      answer: 1,
      why: "The last cross moves are easy and need no watching. If you spend them watching anyway, you start F2L with no information and have to search.",
    },
  ],
  "join-first-pair": [
    {
      question:
        "You've planned your cross but can't find a whole first pair in the time left. What's the next best thing?",
      options: [
        "Give up on the first pair",
        "Find just the corner",
        "Re-plan the cross",
        "Use the time to relax",
      ],
      answer: 1,
      why: "Half the information removes most of the pause. Once you know the corner and its slot, the edge is quick to find.",
    },
  ],
  "join-xcross": [
    {
      question: "What's the right way into x-crosses?",
      options: [
        "Force one on every solve until spotting them becomes automatic",
        "Make plain crosses reliable, then notice when one is on offer",
        "Learn x-cross algorithms for the most common scramble patterns",
        "Plan the pair first each solve, then build the cross around it",
      ],
      answer: 1,
      why: "An x-cross is planning a cross while tracking two extra pieces. Without reliable cross planning, forcing it makes your normal crosses worse. Noticing first builds the recognition.",
    },
  ],
  // F2L in fewer moves
  "f2l-what-a-pair-is": [
    {
      question: "What's the idea behind most F2L cases?",
      options: [
        "Learn each of the 41 cases as its own algorithm",
        "Join the corner and edge on top, then drop the pair in",
        "Place the corner first, then bring its edge after it",
        "Rotate so every pair goes in at the front right",
      ],
      answer: 1,
      why: "Most cases are 'free any stuck piece, join the pair on top, then insert'. A few go in another way: in one three-move case, R U R' joins the pair as it drops it in, and later keyhole puts the corner and edge in one at a time through an empty slot. Learning the moves rather than 41 names lets you solve cases you've never seen and spot shorter solutions.",
    },
  ],
  "f2l-families": [
    {
      question:
        "The corner of your pair is on top with its white sticker facing up. What comes first?",
      options: [
        "Insert it straight away with R U R'",
        "Turn it with a trigger that has a U2",
        "Take the edge out of its slot first",
        "Rotate the cube until white faces you",
      ],
      answer: 1,
      why: "With white facing up the corner can't join its edge yet. A trigger with a U2, like the R U2 R' that starts R U2 R' U' R U R', turns it so white faces a side; then a top turn and a three-move insert finish.",
    },
  ],
  "f2l-move-count": [
    {
      question: "A case regularly takes you 12 moves. What's most likely?",
      options: [
        "It's a stuck-piece case, and those take twelve or more",
        "A working solution, not a good one: most take seven or eight",
        "Nothing odd: twelve moves is normal for a pair before sub-20",
        "It's a mirror case, and mirrors take a few moves more",
      ],
      answer: 1,
      why: "Most F2L cases have seven- or eight-move solutions. Twelve usually means an extra trigger: pairing the long way round, or using the wrong slot.",
    },
  ],
  "f2l-rotations": [
    {
      question: "Why does a rotation cost more than its move count suggests?",
      options: [
        "Competition rules count every rotation as two moves",
        "Everything you were tracking moves, so lookahead restarts",
        "Turning the whole cube takes far longer than turning one face",
        "Rotations loosen the cube, so the next turns catch more",
      ],
      answer: 1,
      why: "The turn itself is cheap. Losing track of every piece you were following is what costs the time.",
    },
  ],
  "f2l-empty-slots": [
    {
      question:
        "The corner is already in its slot, the edge is in the top layer, and a slot next to it is empty. What helps most?",
      options: [
        "Borrow the empty slot: turn D, insert the edge, turn D back",
        "Take the corner out of the slot and pair it with the edge",
        "Rotate the cube until the case looks like one you know",
        "Leave it, solve another pair, and hope it fixes itself",
      ],
      answer: 0,
      why: "Keyhole borrows an empty slot as workspace: turning D (a quarter turn for the slot next door, a half turn for the one diagonally opposite) moves the placed corner aside, a short insert puts the edge in, and turning D back brings the corner home, with no pairing. With no free slot at all, use the standard solution, which is about eight moves.",
    },
  ],
  // Seeing a pair instantly
  "pair-both-pieces": [
    {
      question: "What's faster than finding a corner and then hunting for its edge?",
      options: [
        "Finding the edge first, since edges are quicker to spot",
        "Scanning the top layer for both pieces of a pair at once",
        "Checking the slots first, since stuck pieces cost most",
        "Turning the top until a ready-made pair comes into view",
      ],
      answer: 1,
      why: "Corner-then-edge is two searches, the second while you're already committed. Looking for pairs does it in one.",
    },
  ],
  "pair-all-angles": [
    {
      question:
        "You know a case at the front right, but at the back left you have to turn the cube before you can even tell what it is. What's the fix?",
      options: [
        "Keep turning to look: a rotation only costs two moves",
        "Practise it in all four slots until each reads the same",
        "Learn a separate back-left algorithm for each of those cases",
        "Leave that slot until last and fill the other three first",
      ],
      answer: 1,
      why: "The case is defined by where the pieces are relative to each other and their slot, not by how you hold the cube. Reps in all four positions make it read the same. Turning the cube to insert at a back slot is fine at this stage; turning it just to see the case is the habit to lose.",
    },
  ],
  "pair-ergonomics": [
    {
      question:
        "Two solutions have the same move count. One needs a regrip halfway. Which should you use?",
      options: [
        "The one with the regrip — it's more efficient",
        "The one your hands can do without stopping",
        "Whichever you learned first",
        "Alternate between them",
      ],
      answer: 1,
      why: "A regrip mid-sequence can cost half a second. At equal length, the one that runs off your fingers wins.",
    },
  ],
  // Lookahead, properly
  "lookahead-three-stages": [
    {
      question:
        "You solve a pair, then look around for the next one. Which stage of lookahead is that?",
      options: ["Knowing", "Tracking", "Spotting", "Planning"],
      answer: 2,
      why: "Spotting is solving what you see, then looking for the next. Tracking follows the next pair during this one; knowing predicts where your moves will leave it.",
    },
  ],
  "lookahead-slow-solves": [
    {
      question: "During a slow solve the cube stops for a moment. What should you do?",
      options: [
        "Try harder to look ahead, keeping the same speed",
        "Turn slower still, until the cube never stops",
        "Speed up afterwards to win back the lost time",
        "Carry on: one short pause in a solve is fine",
      ],
      answer: 1,
      why: "A pause means your eyes didn't get there in time. The fix is more time — a slower pace — not more effort. The rule 'never stop' is the whole drill.",
    },
  ],
  "lookahead-what-to-look-at": [
    {
      question: "While you insert a pair, where should your eyes be?",
      options: [
        "On the pair you're inserting, to check it goes in",
        "On the faces not involved, looking for the next pair",
        "On your hands, to keep the turns clean",
        "On the cross, to check it hasn't broken",
      ],
      answer: 1,
      why: "You already know what the current pair is doing. Watching it tells you nothing; looking for the next one is what removes the pause.",
    },
  ],
  "lookahead-both-pieces": [
    {
      question:
        "You can follow the next pair's corner while this pair goes in. What's the next step?",
      options: [
        "Turn faster, so there's less time to lose track",
        "Follow its edge too, so you know the whole case",
        "Add a y rotation so both pieces are easier to see",
        "Start following the corner of the pair after it",
      ],
      answer: 1,
      why: "With both pieces followed, the next case is known before you get there. A rotation moves everything you were following, so keep the cube still.",
    },
  ],
  "lookahead-knowing": [
    {
      question:
        "On a solved cube you do R U R'. Where does the edge that started at the back of the top layer end up?",
      options: [
        "On the right of the top layer",
        "In the back-right slot",
        "Still at the back of the top layer",
        "In the front-right slot",
      ],
      answer: 3,
      why: "The first R doesn't touch it, the U turn carries it round to the right, and the R' pulls it down into the front-right slot. After just R U it would still be on the right of the top layer.",
    },
  ],
  // The last pair into OLL
  "lastpair-free-attention": [
    {
      question: "Why is the last F2L pair the best moment to read OLL?",
      options: [
        "The insert can't change the top, so the case is final",
        "Your eyes have no next pair to find, and the top is in view",
        "The OLL case is fixed once the cross is done",
        "Its insert always turns every top edge to face up",
      ],
      answer: 1,
      why: "On the last pair there's nothing left to track, and the top face is in view. Using that free attention removes the pause before OLL.",
    },
  ],
  "lastpair-partial-read": [
    {
      question:
        "You can't read the exact OLL during the last pair. Is a partial read still worth it?",
      options: [
        "No: a partial read doesn't save time, so wait for the pair",
        "Yes: the edge shape is a first cut, leaving less to read after",
        "On 2-look OLL, yes; with full OLL a partial read is wasted",
        "Only with Winter Variation, which reads the case for you",
      ],
      answer: 1,
      why: "The edge shape (dot, line, L or cross) doesn't name the case on its own: it leaves 8 dots, 15 lines, 27 Ls or 7 with every edge up. But it is the first cut, so once the pair is in, only the named shape and one sticker on the side are left to read. Every look you take during the insert is one you don't take after it.",
    },
  ],
  "lastpair-edge-control": [
    {
      question:
        "Your last pair is joined on the right of the top layer: the corner above its slot with white facing you, the edge on its right with green up. The top edge at the front does not show yellow on top. Which insert should you choose?",
      options: [
        "U R U' R', the plain insert",
        "The sledgehammer, R' F R F'",
        "Either: the front edge doesn't decide it",
        "Neither: split the pair and re-pair it",
      ],
      answer: 1,
      why: "Both inserts are four moves and leave the first two layers solved, but they differ by two flipped top edges. When the front edge isn't facing up, the sledgehammer never leaves a dot OLL, and it gives all four edges up whenever either insert could.",
    },
  ],
  "lastpair-influence": [
    {
      question:
        "When do systems that control your last layer from the last pair (like Winter Variation) start to make sense?",
      options: [
        "As soon as your intuitive F2L works without pauses",
        "Once full OLL and PLL are solid, around fifteen seconds",
        "Only near sub-10, once everything else in the solve is done",
        "Before full PLL, so there are fewer cases to learn overall",
      ],
      answer: 1,
      why: "They add recognition work and only pay once your ordinary last pair and last layer are quick, which for most people means full OLL and PLL are solid, around fifteen seconds. Winter Variation also needs its own situation: the last pair joined in the top layer, ready for a U R U' R' insert, with the top edges already facing up.",
    },
  ],
  // Faster OLL
  "oll-by-shape": [
    {
      question: "What makes OLL recognition fast?",
      options: [
        "Knowing each case by its number, then its algorithm",
        "The edge shape, then the named shape, then one sticker",
        "Comparing the top against all 57 pictures, one by one",
        "Turning the cube until the case matches its picture",
      ],
      answer: 1,
      why: "The edge shape (dot, line, L or cross) is only the first cut: it leaves 8 dots, 15 lines, 27 Ls or 7 with every edge up. Inside a line or an L, the named shape (P, W, fish, lightning bolt, knight move and so on) narrows it to a few, often a mirror pair, and one sticker on the side decides. Three quick looks instead of a comparison against 57.",
    },
  ],
  "oll-angle": [
    {
      question:
        "You rotate the cube during OLL until the case looks like its picture. What's the better habit?",
      options: [
        "Read it from any side, then turn the top to line it up",
        "Keep rotating, but faster, so it costs less of the solve",
        "Learn a separate algorithm for each of the four angles",
        "Rotate once before OLL starts, so both reads share it",
      ],
      answer: 0,
      why: "Both 2-look reads work from any side: the edge shape first, then how many corners face up. The angle only decides which way to turn the top before you start, and a top turn is a flick where a rotation is a regrip. For the odd case where that turn is awkward, a second algorithm from that angle can be worth learning.",
    },
  ],
  "oll-lockups": [
    {
      question: "An algorithm keeps locking up on a good cube. What's the usual cause?",
      options: [
        "The cube's tension is too loose for fast turns",
        "Each turn starts before the last one has finished",
        "The algorithm is a poor one and needs replacing",
        "You're turning too slowly to keep a rhythm",
      ],
      answer: 1,
      why: "On a decent cube, lockups on ordinary triggers almost always mean inaccurate turning. Slow, clean reps raise the speed at which it stays clean.",
    },
  ],
  // Learning OLL without drowning
  "oll-when": [
    {
      question: "Around what average does full OLL usually become worth learning?",
      options: [
        "Around 45 seconds, alongside full PLL",
        "Around 20 seconds, once full PLL is done",
        "Only once you already average sub-10",
        "Before full PLL, since OLL comes first in the solve",
      ],
      answer: 1,
      why: "Until you're close to 20 seconds there's a cheaper second elsewhere, above all full PLL, which comes first. Around 20 it's an option, learned in small groups from the 2-look cases; in the Sub-15 course it's expected, once the second look is the biggest leak in your last layer.",
    },
  ],
  "oll-groups": [
    {
      question: "Which OLL cases are the best place to start learning full OLL?",
      options: [
        "The seven you already know from 2-look, made faster",
        "The eight dot cases, since they come up most often",
        "Cases 1 to 10, in number order",
        "Whichever cases have the longest algorithms",
      ],
      answer: 0,
      why: "The seven cases with every edge oriented are the 2-look corner cases you already recognise and solve, so start by making them fast or swapping in better algorithms. Then add short cases built from triggers you know. Leave the dots for last: easy to spot, but the eight are harder to tell apart and long to execute. They aren't rarer; most come up 1 time in 54, like most other OLLs.",
    },
  ],
  "oll-retention": [
    {
      question: "An OLL is fast in a trainer but slow in real solves. What's missing?",
      options: [
        "More trainer reps, until it's fast without thinking",
        "Using it in real solves, where it turns up unannounced",
        "A different algorithm that feels more comfortable",
        "Nothing: once it's fast in a trainer, it's learned",
      ],
      answer: 1,
      why: "A case isn't learned until it's fast when it appears at the end of an F2L you were concentrating on. After drilling, do normal solves and watch for it.",
    },
  ],
  // Reading PLL while OLL finishes
  "pll-two-sided": [
    {
      question: "How many adjacent faces do you need to tell every PLL apart?",
      options: ["One", "Two", "Three", "All four"],
      answer: 1,
      why: "Every PLL is distinguishable from two adjacent sides using headlights, blocks and bars. Needing a third means turning the cube for information you already had.",
    },
  ],
  "pll-during-oll": [
    {
      question: "When should your eyes leave the top face during OLL?",
      options: [
        "Once the OLL is finished and the top is all yellow",
        "As you start the last trigger of the algorithm",
        "Halfway through, as soon as the top edges face up",
        "Never: keep watching the top so you can fix mistakes",
      ],
      answer: 1,
      why: "A learned algorithm doesn't need watching. Moving your eyes to the side stickers during its last trigger usually gets you the PLL family early.",
    },
  ],
  // Faster PLL
  "pll-target": [
    {
      question:
        "Nineteen of your PLLs take about a second and two take three. What should you work on?",
      options: [
        "All 21 cases, a bit faster each",
        "Those two slow cases specifically",
        "Full OLL, to cut the pause before PLL",
        "Your turning speed across the board",
      ],
      answer: 1,
      why: "The spread matters more than the mean. Two slow cases come up often enough to hurt, and they bring a pause with them.",
    },
  ],
  "pll-algorithm-choice": [
    {
      question: "A 13-move algorithm with a regrip, or a 15-move one you can do in one grip?",
      options: [
        "The 13-move one: fewer moves is always faster",
        "The 15-move one, since it runs without a pause",
        "The 13-move one, and practise the regrip until it's smooth",
        "Either: two moves apart, they end up the same speed",
      ],
      answer: 1,
      why: "Last-layer speed is about grips and triggers more than length. A clean rhythm beats a shorter sequence with a pause in it.",
    },
  ],
  "pll-under-pressure": [
    {
      question: "At a competition, which fingertricks should you use?",
      options: [
        "Your fastest variants, since every tenth counts there",
        "The standard, repeatable movements you always use",
        "Whatever you learned most recently, while it's fresh",
        "Deliberately slower ones, so nothing can go wrong",
      ],
      answer: 1,
      why: "Unusual fingertricks are the first thing to fail when you're nervous, and a popped or misaligned layer costs more than the tenth they'd save.",
    },
  ],
  // Learning full PLL
  "pll-why-first": [
    {
      question: "Why learn full PLL before full OLL?",
      options: [
        "PLL algorithms are shorter, and full OLL only works once PLL is known",
        "Fewer cases, each seen more often, and it trains side-sticker reading",
        "It has more cases, so it takes longer and needs an earlier start",
        "OLL is mostly skipped by fast solvers, who use COLL instead",
      ],
      answer: 1,
      why: "21 cases against 57, and each case comes up about three times as often: most PLLs 1 solve in 18, most OLLs 1 in 54. So the reps arrive faster, and the side-sticker reading carries over to reading the cube in F2L.",
    },
  ],
  "pll-order": [
    {
      question: "How should you learn the G perms?",
      options: [
        "One at a time, a few months apart",
        "All four together as a set",
        "Skip them, since they come up rarely",
        "Before anything else in PLL",
      ],
      answer: 1,
      why: "They're four variations on one idea. Learning them together is what makes them distinguishable; spreading them out guarantees confusion.",
    },
  ],
  "pll-recognition-first": [
    {
      question:
        "You can execute a case in one second but need two to identify it. How long is that PLL?",
      options: ["One second", "About three seconds", "Two seconds", "It depends on the cube"],
      answer: 1,
      why: "Recognition time counts. That's why time spent learning what a case looks like pays more than memorising another algorithm.",
    },
  ],
  // Practice that actually moves the average
  "practice-two-kinds": [
    {
      question:
        "You do a hundred timed solves a day and your average hasn't moved in months. What's missing?",
      options: [
        "Even more timed solves, done at full speed",
        "Deliberate work on one specific weakness",
        "A newer, faster cube that turns more easily",
        "Longer sessions with fewer breaks between",
      ],
      answer: 1,
      why: "Timed solves make existing skills automatic; they rarely add new ones. A plateau with lots of practice usually means the deliberate half is missing.",
    },
  ],
  "practice-session-shape": [
    {
      question: "What's wrong with a session that works on lookahead, then OLL, then the cross?",
      options: [
        "Nothing: variety keeps each part of the solve improving",
        "It works on nothing: keep one focus for several sessions",
        "The order is wrong: the cross should always come first",
        "It's too short: each part needs a full hour of its own",
      ],
      answer: 1,
      why: "Skills take longer than a session to move. Keeping one focus for several sessions gives it enough repetition.",
    },
  ],
  "practice-plateau": [
    {
      question:
        "You got fast by learning algorithms, and now you've plateaued while still learning algorithms. What's the likely fix?",
      options: [
        "Learn a bigger set, like ZBLL, which usually keeps gains coming",
        "Change what you practise: the limit is often lookahead now",
        "Practise more hours at the same things until it breaks",
        "Buy a faster cube, since your algorithms are now fine",
      ],
      answer: 1,
      why: "A genuine plateau usually means the thing limiting you has changed but your practice hasn't. Consistent F2L pauses are the most common real answer.",
    },
  ],
  "practice-measure": [
    {
      question: "Which number best tells you whether you're improving?",
      options: [
        "Your best single from the last week",
        "Your average of 50 or your median",
        "Your worst solve of each session",
        "How many solves you do in a day",
      ],
      answer: 1,
      why: "A best single is luck. Averages over many solves and the median move when you actually improve.",
    },
  ],
  // Fewer disasters
  "consistency-where-the-spread-is": [
    {
      question: "What are the usual causes of a solve that's half again as slow as normal?",
      options: [
        "A hard scramble, a long cross, or skipping your warm-up",
        "A half-known case, a lockup, or freezing on something new",
        "Turning too slowly, getting tired, or a stiff, dry cube",
        "Random chance: slow solves like that are just noise",
      ],
      answer: 1,
      why: "There are few candidates, and each is fixable: reps for the half-known case, calmer turning for lockups, recognition work for the freezes.",
    },
  ],
  "consistency-recovery": [
    {
      question: "You lock up in the middle of F2L. What's the best reaction?",
      options: [
        "Speed up to win the time back",
        "Finish at your normal pace",
        "Restart the solve",
        "Slow right down",
      ],
      answer: 1,
      why: "Rushing after a mistake causes another one. The lost second is gone; finishing calmly stops it becoming six.",
    },
  ],
  "consistency-pressure": [
    {
      question: "If you compete, what's the best way to practise for it?",
      options: [
        "Lots of fast singles, so you peak for the one solve that counts",
        "Full inspection, averages of five, ideally someone watching",
        "Slow solves only, ideally the week before, so nothing goes wrong",
        "Only algorithm drills, so every case is automatic under stress",
      ],
      answer: 1,
      why: "Solving under pressure is a separate skill that closes with exposure. Practising the conditions, not just the solves, is what builds it.",
    },
  ],
  // Hands that do not get in the way
  "turning-what-a-fingertrick-is": [
    {
      question: "Where does a finger trick's saving actually come from?",
      options: [
        "Fingers move faster than arms, so each turn is quicker",
        "The cube stays put, so the next turn can start at once",
        "It cuts moves, since a flick can do two layers at once",
        "It lets you turn harder without the cube catching",
      ],
      answer: 1,
      why: "Keeping the cube in place is what saves time: no repositioning, and nothing for your eyes to find again.",
    },
  ],
  "turning-regrips": [
    {
      question: "What's the most reliable way to find your own regrips?",
      options: [
        "Count them in your head while solving",
        "Film a solve and watch it at quarter speed",
        "Ask someone to listen for pauses as you solve",
        "Use a smart cube that logs every turn you make",
      ],
      answer: 1,
      why: "Slow-motion video shows repositioning you have no memory of — and most of it comes from the solution you chose, not from necessity.",
    },
  ],
  "turning-calm": [
    {
      question: "How should you raise your turning speed?",
      options: [
        "Turn as hard as you can until the speed becomes normal",
        "Stay at your fastest clean speed and let it creep up",
        "Get a cube with stronger magnets so turns finish sooner",
        "Drill algorithms faster than feels clean, to stretch you",
      ],
      answer: 1,
      why: "Past a low threshold, force causes lockups that cost more than they gain. Practising above your clean speed trains inaccuracy.",
    },
  ],
  "turning-both-hands": [
    {
      question: "What's the point of a session with no R moves allowed?",
      options: [
        "To become fully ambidextrous, the way top solvers are",
        "To build enough left hand that you stop rotating to avoid it",
        "To slow you down, so it doubles as a lookahead drill too",
        "To rest your right hand and prevent strain from overusing it",
      ],
      answer: 1,
      why: "You don't need perfect ambidexterity — just enough left hand that awkward cases stop costing a rotation.",
    },
  ],
  "turning-full-sets": [
    {
      question:
        "When a move in a new algorithm can be done as a push or a pull, which should you try first?",
      options: [
        "The pull: it usually keeps your thumb free for the next move",
        "Whichever one your fingers happened to do first",
        "Neither: rotate so the move becomes an R turn",
        "The push: it is usually quicker and more comfortable",
      ],
      answer: 3,
      why: "A push is a finger curling in and driving the layer. Pushes are usually quicker and more comfortable than pulls, so try the push first and use a pull only where the push would cost a regrip. Leaving it to whatever your fingers happened to do is the habit the lesson warns against, because it sticks.",
    },
  ],
  // Know the beginner method cold
  "cold-seven-steps": [
    {
      question: "Why check the cube at the end of each step?",
      options: [
        "The method only works if you pause between the steps",
        "To fix a mistake now, not find it in the last layer",
        "To slow down, since beginners make fewer mistakes that way",
        "To practise y rotations for later, when F2L needs them",
      ],
      answer: 1,
      why: "Knowing what each step leaves solved lets you catch a mistake when it happens — and tells you exactly which step to practise.",
    },
  ],
  "cold-triggers": [
    {
      question: "An algorithm is eleven moves long. What's the easiest way to remember it?",
      options: [
        "Say the letters in order until you can recite them",
        "Break it into two or three familiar triggers",
        "Watch a video of it until the moves look familiar",
        "Learn it one move a day so nothing gets mixed up",
      ],
      answer: 1,
      why: "Long algorithms are short, familiar chunks like R U R' U' joined together. Three chunks are far easier than eleven letters.",
    },
  ],
  "cold-no-daisy": [
    {
      question: "What's the cost of the daisy?",
      options: [
        "It needs an extra algorithm that beginners find hard",
        "About double the cross moves, and a habit to drop later",
        "Nothing much: fast solvers still use it in competition",
        "It leaves the cross on top, so you must flip before F2L",
      ],
      answer: 1,
      why: "The daisy is a fine first step but slow. Every later method builds the cross straight on the bottom, so switching early is cheaper.",
    },
  ],
  // Setting up your cube
  "setup-tension": [
    {
      question: "How should you change tension?",
      options: [
        "Tighten just the face that feels loose until it's right",
        "Small, equal steps on all six centres, then solve on it",
        "As loose as it goes, since looser always turns faster",
        "A full turn on every centre, then test it straight away",
      ],
      answer: 1,
      why: "Uneven tension makes faces turn differently, which is worse than either extreme. Small equal changes, judged over real solves, are the way.",
    },
  ],
  "setup-lube": [
    {
      question: "Your freshly lubed cube feels sluggish. What's most likely?",
      options: [
        "You used too much, or it hasn't settled yet",
        "It needs more lube to spread through the core",
        "The lube damaged the plastic and it needs replacing",
        "The magnets are weakened by the lube's oils",
      ],
      answer: 0,
      why: "One or two drops is usually enough, and fresh lube often feels slow before it settles. Judge it after a proper session.",
    },
  ],
  "setup-magnets": [
    {
      question: "Why change only one thing about your cube at a time?",
      options: [
        "It's cheaper, since each change can cost a new part",
        "Otherwise you can't tell which change helped",
        "The cube can break if you change two things at once",
        "Competition rules only allow one change a week",
      ],
      answer: 1,
      why: "Tension, lube and magnets affect each other. Changing them together leaves you guessing; one change and a week of solving tells you.",
    },
  ],
  // Making the switch to F2L
  "switch-expect-slower": [
    {
      question: "A week after switching to F2L your times are worse. What should you do?",
      options: [
        "Switch back to layer-by-layer until F2L feels natural",
        "Keep going: a week or two of slower times is normal",
        "Learn all 41 algorithms at once so there's less to think about",
        "Time every solve so you can see the damage clearly",
      ],
      answer: 1,
      why: "Almost everyone gets slower first. The move saving is large and the old method has nowhere left to go.",
    },
  ],
  "switch-when-algorithms": [
    {
      question: "When should you start learning F2L cases as algorithms?",
      options: [
        "Before you try intuitive F2L, so there's less for you to work out later on",
        "Once intuitive F2L is fluent (the Sub-20 course), and only for cases that stay slow",
        "Never: every F2L case should stay intuitive, even at sub-10 and beyond",
        "Straight away, all 41 cases at once, so they're out of the way early on",
      ],
      answer: 1,
      why: "Algorithms without understanding leave you stuck on anything you haven't memorised. Add them one or two at a time for the cases intuition handles badly; the first worth learning by heart are the five with both pieces stuck in the slot.",
    },
  ],
  // 2-look OLL
  "oll2-one-cue": [
    {
      question: "What's the fastest way to recognise a 2-look corner case?",
      options: [
        "Compare the whole top face with all seven pictures",
        "How many corners face up, then where one sticker points",
        "Try the likeliest algorithm and see whether it works",
        "Turn the cube until it matches the picture you know",
      ],
      answer: 1,
      why: "A single deliberate cue per case is faster than comparing whole pictures, and it holds up when you're nervous.",
    },
  ],
  // 2-look PLL
  "pll2-edges": [
    {
      question: "The corners are done and one side is completely one colour. What case is it?",
      options: [
        "An H perm: two pairs of opposite edges swap across",
        "A U perm: three edges cycle, so hold the bar at the back",
        "A Z perm: two pairs of neighbouring edges swap places",
        "Nothing left but one turn of the top to line it up",
      ],
      answer: 1,
      why: "A solved bar means three edges need to cycle: one of the U perms. No solved side means edges swapping in pairs: H or Z.",
    },
  ],
  "pll2-auf": [
    {
      question: "Which full-PLL cases are worth adding first after 2-look?",
      options: [
        "The G perms, learning one each time it comes up",
        "The A perms, then the J perms: both quick to pick up",
        "The N perms, to get the hardest ones out of the way",
        "The rarest ones, so none of them can catch you out",
      ],
      answer: 1,
      why: "Most PLL cases come up about equally often, and 2-look needs two algorithms for most of them, so each new case saves about the same. Start with the A perms and then the J perms because they're quick to pick up, and leave the G perms until you can learn all four together.",
    },
  ],
  // Choosing the next pair
  "choice-skip-bad": [
    {
      question:
        "Both pieces of the pair you were about to solve are stuck in slots. What should you do?",
      options: [
        "Solve it anyway, since it's the one you planned next",
        "Look for another pair first; it may free the stuck ones",
        "Rotate so the stuck slot is at the front right, then solve it",
        "Take both out at once; they'll usually pair up on top",
      ],
      answer: 1,
      why: "A good pair averages about seven moves: an easy one on top takes three to seven, but a pair stuck in its slot takes nine to eleven even with a good solution. Declining the expensive one is a free efficiency gain.",
    },
  ],
  "choice-free-pairs": [
    {
      question:
        "A corner and its edge are already joined in the top layer. When should you solve that pair?",
      options: [
        "Last, since it will probably still be joined later",
        "Whenever you see it — it's nearly free",
        "Only if it's in front of you, not at the back",
        "Straight after the hardest pair is done",
      ],
      answer: 1,
      why: "Free pairs cost almost nothing and leave fewer pieces to search through next.",
    },
  ],
  "choice-flow": [
    {
      question: "Choosing the best pair takes you a full second. What should you do instead?",
      options: [
        "Keep choosing: the best pair saves more than it costs",
        "Take the pair you see, and choose during the previous insert",
        "Plan every remaining pair at once before starting any",
        "Rotate to see all four slots, then pick the best one",
      ],
      answer: 1,
      why: "A pause to find the perfect pair costs more than it saves. The choice should happen during the previous insertion, where it costs nothing.",
    },
  ],
  // When a piece is stuck in a slot
  "stuck-three-kinds": [
    {
      question:
        "One piece of your pair is stuck in a slot. What's the efficient way to take it out?",
      options: [
        "Whichever way is quickest, then pair it once it's on top",
        "With a move that leaves it next to its partner",
        "Rotate so the slot is at the front right, then lift it",
        "Leave it until last, when it will come out by itself",
      ],
      answer: 1,
      why: "Extracting in a way that already sets up the pair turns an eleven-move case into a seven- or eight-move one.",
    },
  ],
  "stuck-other-slots": [
    {
      question:
        "A piece you need is in another pair's slot, and that pair is nearly ready. What should you do?",
      options: [
        "Take your piece out first, then solve that pair",
        "Solve that pair first: it brings your piece out",
        "Rotate so that slot is at the front right first",
        "Leave both until the other two slots are full",
      ],
      answer: 1,
      why: "Solving the other pair extracts your piece as a side effect, at no extra cost.",
    },
  ],
  // The turn before, and the turn after
  "auf-after": [
    {
      question: "How can you know a PLL's final U turn before starting it?",
      options: [
        "Guess, then correct it after the algorithm",
        "Learn a reference sticker for each case",
        "Watch the last move and react to it",
        "You can't: it only shows once it's done",
      ],
      answer: 1,
      why: "One sticker on the front or right face tells you the final turn before you start. Some upfront work per case, then it's free forever.",
    },
  ],
  "auf-before": [
    {
      question: "Which habit is faster for the turn before a case?",
      options: [
        "Turn the top until it looks familiar, then recognise",
        "Recognise from wherever it is, then do the smallest turn",
        "Always do a U first, then look at the case",
        "Rotate the whole cube to the angle you learned",
      ],
      answer: 1,
      why: "Recognising from any angle and choosing the smallest turn — or an alternative algorithm that needs none — removes the searching turn.",
    },
  ],
  "auf-fingers": [
    {
      question: "How should you do the final turn of an algorithm?",
      options: [
        "Always with the right index, for consistency",
        "With whichever finger is already in place",
        "With a regrip first, so the turn is controlled",
        "With a double flick, since it's the fastest",
      ],
      answer: 1,
      why: "Different algorithms leave your hands in different places. Using the finger that's already set up removes a small regrip from nearly every solve.",
    },
  ],
  // Where 20 seconds goes
  "budget-shape": [
    {
      question: "In a typical sub-20 solve, which part is more than half the time?",
      options: ["The cross", "F2L", "OLL", "PLL"],
      answer: 1,
      why: "Roughly two seconds of cross, ten or eleven of F2L, six of last layer. A small F2L gain is worth more than a large gain anywhere else.",
    },
  ],
  "budget-overspend": [
    {
      question: "At around 20 seconds, where does the most time usually leak?",
      options: [
        "Executing OLL and PLL slowly",
        "Pauses between F2L pairs",
        "Planning the cross",
        "Slow turning in general",
      ],
      answer: 1,
      why: "Half a second between each of four pairs is two seconds — the difference between 22 and 20. Last-layer recognition comes next; the cross is usually smallest.",
    },
  ],
  "budget-measure": [
    {
      question: "Why measure instead of guessing where your time goes?",
      options: [
        "People underestimate their last layer and overestimate pauses",
        "Pauses don't feel like time, so people underestimate them",
        "Guesses are usually right, but numbers are more motivating",
        "Only measured times count towards the sub-20 goal",
      ],
      answer: 1,
      why: "Pauses don't feel like time passing, so guesses point at the wrong part. The tests time each part on its own.",
    },
  ],
  // Going colour neutral
  "cn-what-it-buys": [
    {
      question: "What does colour neutrality actually buy you?",
      options: [
        "Choice: the shortest cross, or one with an easy first pair",
        "Faster turning, once every colour feels familiar",
        "Better last-layer recognition from seeing more colours",
        "Nothing a timer can measure; it's about comfort",
      ],
      answer: 0,
      why: "Choosing from six crosses saves about one move per cross on average, and crosses of four moves or fewer come up about five times as often; Feliks Zemdegs measured roughly 0.25 s a solve. The cost is real too: months to switch fully, a slower patch while pairs look unfamiliar, and more to decide in inspection.",
    },
  ],
  "cn-dual-first": [
    {
      question: "When you add yellow crosses, what takes the practice?",
      options: [
        "The yellow cross itself, as its edges look unfamiliar",
        "F2L, because every pair goes in the opposite-side slot",
        "OLL, since the last layer is now white instead of yellow",
        "PLL, since every case must be relearned with white on top",
      ],
      answer: 1,
      why: "The yellow cross itself comes quickly. Hold yellow on the bottom with green in front and orange sits on the left, so the side colours run in mirrored order and every pair swaps sides: one that goes front-right on a white cross goes front-left on a yellow one. That flip is what takes practice, usually a week or two to a few weeks rather than the months of a full switch.",
    },
  ],
  "cn-pairs": [
    {
      question: "After switching cross colours, which part stays slow longest?",
      options: [
        "Planning the cross",
        "F2L pair recognition",
        "PLL recognition",
        "Executing the last layer",
      ],
      answer: 1,
      why: "The cross adapts quickly, but around a yellow cross the side colours run in mirrored order, so every pair belongs in the slot on the other side from where your white-cross habit sends it. That takes reps in ordinary solving.",
    },
  ],
  // Cutting filler moves
  "filler-cancel": [
    {
      question: "You do U, then immediately U2. What was that really?",
      options: ["Three quarter turns", "A single U'", "Nothing", "A U2"],
      answer: 1,
      why: "U then U2 is three quarter turns the same way, which is one U'. Two turns of the same face in a row are one turn done in two pieces.",
    },
  ],
  "filler-merge": [
    {
      question:
        "Your last F2L insert ends with R', and the OLL after it will need a top turn to line up. Where's the saving?",
      options: [
        "None: the insert and the OLL are separate steps",
        "Turn the top for the OLL first, then insert the pair",
        "Decide the turn during the insert, so it follows R' at once",
        "Rotate the cube to the case's angle instead of turning the top",
      ],
      answer: 2,
      why: "An insert usually ends on a side turn like R', so there's no top turn in it to merge with, and turning the top first would carry the pair away from its slot. The saving is deciding early: read the case and the turn it needs while the pair goes in, and the lining-up turn follows at once instead of after a look.",
    },
  ],
  "filler-rotations": [
    {
      question: "You rotate y to reach a slot, then y' to come back. What does that cost?",
      options: [
        "Nothing much, since the two rotations cancel out",
        "Two resets of what you were tracking, for one pair",
        "Just the time of two moves, about a fifth of a second",
        "A +2 penalty if a judge sees it in competition",
      ],
      answer: 1,
      why: "The rotations cancel as moves but not as attention. Back-slot and left-hand inserts avoid both.",
    },
  ],
  // Solving two pairs at once
  "multi-family": [
    {
      question: "Why do pseudo-slotting and multislotting come after lookahead?",
      options: [
        "They build on keyhole, which itself needs full lookahead",
        "Without lookahead, finding the pieces they need is a pause",
        "They need an algorithm for every case, learned after F2L",
        "Their extra moves scatter the pairs you were tracking",
      ],
      answer: 1,
      why: "Both use information about pieces outside the current pair, and without lookahead finding it costs more than the trick saves. Keyhole is different: it needs only the pair you're solving and one empty slot, so you should already be using it from the Sub-30 course.",
    },
  ],
  "multi-pseudo": [
    {
      question:
        "Why can a corner and an edge from two different pairs go into one slot together when pseudo-slotting?",
      options: [
        "A bottom turn moves the corners' homes but not the middle-layer edges",
        "The corner and edge share a colour, so they join like a normal pair",
        "Any corner fits any slot as long as its white sticker faces down",
        "The middle layer turns with the bottom, so both homes line up",
      ],
      answer: 0,
      why: "Turning the bottom carries its corners round while the middle-layer edges stay put, so one pair's corner home can sit under another pair's slot. One insert places both, and turning the bottom back sends the corner home.",
    },
  ],
  "multi-example": [
    {
      question: "In the simplest multislot, what do two extra moves buy?",
      options: [
        "Nothing: the two left turns just cancel each other out",
        "When the pieces sit right, a second pair lined up too",
        "When the edges sit right, an OLL skip about half the time",
        "Every time, the front-left pair goes in with the first",
      ],
      answer: 1,
      why: "In L' R U R' L, turning the left face out of the way and back costs two moves. With the front-left slot still empty and the second pair's pieces in the right places, those turns can pair it while R U R' inserts the first, saving four to six moves of pairing. Most of the time the pieces aren't placed for it, which is why you take it when you see it.",
    },
  ],
  "multi-limits": [
    {
      question: "What's the sensible way to use multislotting?",
      options: [
        "Plan a multislot on every insert until it becomes automatic",
        "Keep keyhole automatic; take easy ones you notice, don't hunt",
        "Skip keyhole and go straight to full multislotting",
        "Plan it only in inspection, since F2L is too fast for it",
      ],
      answer: 1,
      why: "Full multislotting needs you to see too much, too fast. Even top solvers mostly use plain inserts; the fast part is the flow.",
    },
  ],
  // X-cross, properly
  "xc-payoff": [
    {
      question: "What must be reliable before x-crosses make sense?",
      options: [
        "Colour neutrality, so every scramble offers one",
        "Planning a plain cross fully in inspection",
        "Keyhole, so the pair can go in with the cross",
        "Pause-free lookahead through the whole of F2L",
      ],
      answer: 1,
      why: "An x-cross is a full cross plan plus tracking two more pieces. Without the first, the second won't fit in fifteen seconds.",
    },
  ],
  "xc-ladder": [
    {
      question: "How should you start practising x-crosses?",
      options: [
        "At full speed, with the usual fifteen-second inspection",
        "With no time limit: corner, corner and edge, then the join",
        "By memorising x-cross solutions for common scrambles",
        "Only on easy scrambles, then harder ones as you improve",
      ],
      answer: 1,
      why: "Time pressure stops you seeing what an x-cross looks like. Learn the shapes untimed, then bring the limit back.",
    },
  ],
  "xc-shapes": [
    {
      question: "Which scrambles most often hand you an x-cross?",
      options: [
        "Two cross edges already solved, or a very short cross",
        "A joined pair, or a corner on the bottom near its slot",
        "A corner in the top layer with its white sticker up",
        "None in particular, since x-crosses turn up at random",
      ],
      answer: 1,
      why: "A joined pair or a corner near home can often be carried in by the cross moves themselves.",
    },
  ],
  // Which algorithm sets are worth it
  "sets-principle": [
    {
      question: "How should you judge whether an algorithm set is worth learning?",
      options: [
        "How many cases it has: the more, the bigger the gain",
        "Time saved per solve, divided by the algorithms to learn",
        "Whether the fastest solvers use it in competition",
        "How often its cases come up, however many there are",
      ],
      answer: 1,
      why: "Speed per algorithm. And the honest comparison is always against another month of F2L work.",
    },
  ],
  "sets-small": [
    {
      question: "What does COLL leave you with?",
      options: [
        "Only a corner permutation, like an A or E perm",
        "Only an edge permutation: a U, H or Z perm, or a skip",
        "Edges to orient, then any one of the 21 PLL cases",
        "Nothing: COLL always finishes the whole last layer",
      ],
      answer: 1,
      why: "COLL orients and places the corners together when edges are already oriented, so only the edges can be out of place.",
    },
  ],
  "sets-large": [
    {
      question: "If you're curious about ZBLL, what's the standard first step?",
      options: [
        "Learn all of it, about 470 cases, in order",
        "Learn COLL first, then add ZBLL a group at a time",
        "Learn OLLCP first, since ZBLL is built on it",
        "Learn VLS, then pick up ZBLL cases as they appear",
      ],
      answer: 1,
      why: "ZBLL is about 470 cases, or 493 counting the PLLs, and COLL is a subset of the same idea. Build on it a group at a time, and stop adding cases when new ones stop coming up often enough to matter.",
    },
  ],
  // Reconstructing your own solves
  "recon-two-numbers": [
    {
      question:
        "Solve A: 60 moves at 10 turns per second. Solve B: 40 moves at 8. Which is faster?",
      options: ["A — 6 seconds", "B — 5 seconds", "They're equal", "Can't tell"],
      answer: 1,
      why: "Time is moves divided by turns per second: 60/10 = 6 s, 40/8 = 5 s. The slower-turning solve wins by being more efficient.",
    },
  ],
  "recon-how": [
    {
      question:
        "Reconstructions usually count moves in STM, where a turn of any one layer is one move. How many moves is M U2 M'?",
      options: ["Five", "Three", "Six", "Four"],
      answer: 1,
      why: "In STM (slice turn metric) a half turn like U2 is one move and so is each slice. HTM (half turn metric) also counts U2 as one but a slice as two, the outer turns it stands for, so it gives five; counting quarter turns gives six. Say which metric you used whenever you compare move counts.",
    },
  ],
  "recon-what-to-look-for": [
    {
      question: "Your reconstruction shows a pair that took 12 moves. What does that suggest?",
      options: [
        "Nothing much: a normal pair usually takes ten to twelve moves",
        "A shorter one likely existed: most take eight moves or fewer",
        "The move count is fine; the fix is turning faster through it",
        "It was a stuck-piece case, and those always need twelve or more",
      ],
      answer: 1,
      why: "A good pair averages about seven moves and most take eight or fewer; even a pair stuck in its slot needs only nine to eleven. A twelve-move pair is worth looking up.",
    },
  ],
  "recon-fast-solvers": [
    {
      question:
        "When you compare your solves with a faster solver's reconstructions, which difference is worth the most?",
      options: [
        "One clever move of theirs you've never seen before",
        "How much faster their hands turn at every step of the solve",
        "Which scrambles they were given, since easy ones explain it",
        "A gap that repeats solve after solve, like more moves a pair",
      ],
      answer: 3,
      why: "Compare step by step: moves per pair, pauses, rotations, cross choice and last-pair insert. A difference that turns up in solve after solve is worth far more than one clever move.",
    },
  ],
  // Competing well
  "comp-procedure": [
    {
      question: "You start your solve 16 seconds into inspection. What happens?",
      options: ["Nothing", "A two-second penalty", "A DNF", "The attempt is restarted"],
      answer: 1,
      why: "Starting between 15 and 17 seconds costs two seconds; after 17 the attempt is a DNF.",
    },
  ],
  "comp-prepare": [
    {
      question: "What's the single most useful preparation for a competition?",
      options: [
        "Learning some new algorithms so you have more options",
        "Planning the cross inside real fifteen-second inspection",
        "Buying a new cube and breaking it in the week before",
        "Lots of fast singles, so you peak for your best attempt",
      ],
      answer: 1,
      why: "Competitions punish going over time, and nerves make you plan less than you think. Practising real inspection prepares for both.",
    },
  ],
  "comp-nerves": [
    {
      question: "Your first competition average is 10% slower than at home. What does that mean?",
      options: [
        "Your practice average was never as good as it looked",
        "It's the expected result for a first competition",
        "Your cube's setup doesn't suit competition conditions",
        "You should practise harder before you compete again",
      ],
      answer: 1,
      why: "Five to twenty per cent slower is normal at first. Knowing that takes much of the pressure off.",
    },
  ],
  // Your first lookahead
  "first-look-while-turning": [
    {
      question: "While your hands do a trigger you know by heart, what should your eyes do?",
      options: [
        "Watch your hands so the trigger stays clean",
        "Look around for the next piece you'll need",
        "Check the pair you're inserting goes in right",
        "Rest, ready for the search after the trigger",
      ],
      answer: 1,
      why: "Moves you know don't need watching. Every piece you find during a trigger is a stop you don't have to make.",
    },
  ],
  "first-look-slow-down": [
    {
      question: "You try to look ahead but there's no time at your normal speed. What now?",
      options: [
        "Give up on lookahead until your turning is faster",
        "Turn slower, at a pace where the cube never stops",
        "Turn faster, so the searches have more time left",
        "Only look ahead on easy solves until it clicks",
      ],
      answer: 1,
      why: "No time to look is the signal to slow down. Slow, continuous solves are often not much slower overall, because the long searches disappear.",
    },
  ],
  "first-look-where": [
    {
      question: "When F2L starts, where should you look first for a pair?",
      options: [
        "The slots, then the top layer",
        "The top layer, then the slots",
        "Every face in turn, front first",
        "The front slots, where pairs go in",
      ],
      answer: 1,
      why: "Pairs with both pieces on top need no moves to free them, so they're usually the quickest. About half the pieces start in the slots, though, so look there when the top has nothing ready.",
    },
  ],
  // F2L from the front
  "front-rotation-cost": [
    {
      question: "What's the real goal with rotations in F2L?",
      options: [
        "Cut every rotation, since the fastest solvers never rotate",
        "Stop rotating mid-look; rotate only when it's truly better",
        "Rotate before each pair so it always starts at the front",
        "Swap every y and y' for a y2, which is easier to track",
      ],
      answer: 1,
      why: "The fastest solvers still rotate sometimes. What costs time is rotating while you're tracking pieces, which resets your lookahead.",
    },
  ],
  "front-back-slots": [
    {
      question: "A front-right pair goes in with R U R'. What's the back-right equivalent?",
      options: ["R' U R", "L' U' L", "R' U' R", "R U' R'"],
      answer: 2,
      why: "Mirroring from front to back reverses every turn, so R U R' becomes R' U' R. R' U R is the back version of R U' R', which inserts a different case.",
    },
  ],
  "front-f-moves": [
    {
      question: "When is an F move the right choice in F2L?",
      options: [
        "Whenever it's possible, since F moves are shorter",
        "When it replaces a rotation or a long R/U sequence",
        "Never: R and U alone can solve every F2L pair",
        "Only in the cross, where F turns are expected",
      ],
      answer: 1,
      why: "F moves are slightly harder to turn fast, so use them where they save a rotation or several moves, not by default.",
    },
  ],
  // Good edges, bad edges
  "edges-what-good-means": [
    {
      question: "A pair's edge is bad. What's true?",
      options: [
        "The right R and U sequence will still solve it, just longer",
        "Only an F or B quarter turn, or a rotation, can fix it",
        "It can only be inserted into one of the two back slots",
        "An R2 or U2 will flip it, since half turns flip edges",
      ],
      answer: 1,
      why: "R, L, U and D never flip edges, so a bad edge stays bad under them. Only an F or B quarter turn, or changing your front with a rotation, fixes it.",
    },
  ],
  "edges-spotting": [
    {
      question: "An F2L edge on top has the right centre's colour on its top sticker. Good or bad?",
      options: ["Good", "Bad", "Depends on the side sticker", "Depends on the slot"],
      answer: 1,
      why: "For a top-layer F2L edge, only the top sticker matters: front or back colour means good, left or right colour means bad.",
    },
  ],
  "edges-using-it": [
    {
      question: "Two pairs are ready: one with a good edge, one with a bad edge. Which first?",
      options: [
        "The bad one, while there's still room to fix it",
        "The good one: it's usually shorter and smoother",
        "Whichever sits at the front, which usually avoids a rotation",
        "Neither: rotate first so both edges become good",
      ],
      answer: 1,
      why: "The good-edge pair usually goes in with R and U alone. The bad one may even be fixed by the moves of other pairs later.",
    },
  ],
  // Stuck at 15
  "fifteen-whats-left": [
    {
      question: "At 15 seconds, what usually breaks a plateau?",
      options: [
        "Learning a big new set, like ZBLL or full edge control",
        "Fixing small leaks, like pauses and slow last-layer cases",
        "A faster cube with stronger magnets and lighter turning",
        "Many more solves at full speed, to force the average down",
      ],
      answer: 1,
      why: "By 15 the big lessons are learned. What's left is several small leaks, and experienced advice points at F2L lookahead and efficiency before new sets. The one set that does belong here is full OLL: if your last layer still takes about six seconds because OLL is two-look, it's the standard fix.",
    },
  ],
  "fifteen-find-the-leak": [
    {
      question: "Why measure your leaks instead of trusting what feels slow?",
      options: [
        "Feelings are always wrong, so trust only the timer",
        "A slow PLL is memorable; pauses spread over pairs aren't",
        "Measuring is quicker than thinking back over solves",
        "It isn't needed: the slowest part always feels slowest",
      ],
      answer: 1,
      why: "Half a second of pausing over four pairs costs more than one rare slow PLL, but it's the PLL you remember. Timing each part shows the truth.",
    },
  ],
  "fifteen-two-weeks": [
    {
      question: "How long should you stick with one focus before judging it?",
      options: [
        "One session, then pick the next",
        "About two weeks, then retest",
        "A day or two, then switch",
        "Until your next personal best",
      ],
      answer: 1,
      why: "Habits need repetition, and averages bounce day to day. Two weeks on one thing, then a retest, gives a fair verdict.",
    },
  ],
  // The last layer at the top
  "top-skips-are-maths": [
    {
      question:
        "A PLL skip comes once in 72 solves and saves about a second. Roughly what's it worth per solve?",
      options: [
        "A full second every time",
        "About a hundredth of a second",
        "About a tenth of a second",
        "Nothing at all, since it's luck",
      ],
      answer: 1,
      why: "One second divided by 72 solves is about 0.014 s per solve. Skips feel huge but barely move an average.",
    },
  ],
  "top-coll": [
    {
      question: "After a COLL, what's the chance of a PLL skip?",
      options: ["1 in 72", "1 in 12", "1 in 4", "1 in 216"],
      answer: 1,
      why: "With the corners solved, only the edges can be out of place: 12 possible arrangements, one of which is solved.",
    },
  ],
  "top-edge-control": [
    {
      question: "Should a CFOP solver learn full ZBLS for edge control?",
      options: [
        "Yes, before full OLL, since it replaces most of it",
        "Usually not: it's huge and saves little over full OLL",
        "Yes: nearly every sub-10 solver uses it",
        "No: edge control of any kind is never worth it",
      ],
      answer: 1,
      why: "Full edge-control systems are big and often awkward, and the saving over a good full OLL is small, which is why experienced solvers put the time into OLL instead. A few free cases on a joined last pair are worth taking; the whole system isn't.",
    },
  ],
  // Method lessons: your first solve
  "beginner-know-cube": [
    {
      question: "Can a move ever put a corner where an edge was?",
      options: [
        "Yes: some algorithms swap a corner with an edge",
        "No: corners stay corners and edges stay edges",
        "Only with slice moves, which move the middle layer",
        "Only with wide moves, which turn two layers at once",
      ],
      answer: 1,
      why: "Corners have three colours and edges two. Turns move pieces around, but never change a piece's type.",
    },
  ],
  "beginner-notation": [
    {
      question: "What does R' mean?",
      options: [
        "Turn the right face a half turn, whichever way is easier",
        "Turn the right face anticlockwise, as seen looking at it",
        "Turn the whole cube the way R turns, but backwards",
        "Turn the left face instead, since the prime mirrors it",
      ],
      answer: 1,
      why: "A prime means anticlockwise, judged looking straight at that face. R2 would be a half turn.",
    },
    {
      question:
        "You've just applied a scramble holding white on top and green in front. What do you do before planning the cross?",
      options: [
        "Plan it straight away and build the cross on top",
        "Turn the cube round with y2 so a new side faces you",
        "Do a z2, so white goes down and green stays in front",
        "Do an x2, so white goes down and green stays in front",
      ],
      answer: 2,
      why: "White on top is only how scrambles are applied. z2 is a whole-cube half turn around the front face, so green stays facing you while white goes down; you then plan and build the cross on the bottom and keep yellow on top for the rest of the solve.",
    },
  ],
  "beginner-first-layer": [
    {
      question: "When is the first layer really finished?",
      options: [
        "When the white face is all white, whatever colours the sides show",
        "When the white face is solved and each side's bottom row matches its centre",
        "When the cross is finished and all four white corners are in the bottom layer",
        "When the white face is solved and each side's top row matches its centre",
      ],
      answer: 1,
      why: "An all-white face can still have its side colours wrong. Check each side's bottom row against its centre before moving on.",
    },
  ],
  "beginner-first-solve": [
    {
      question: "From a yellow dot, what gives you the yellow cross on the beginner method?",
      options: [
        "F R U R' U' F' from any angle, repeated until the cross appears",
        "The Sune, repeated until all four of the yellow edges face up",
        "Top turns until each yellow edge lines up with its centre",
        "F R U R' U' F', with the L at back-left or the line left-to-right",
      ],
      answer: 3,
      why: "Each go moves one stage, dot to L, L to line, line to cross, but only from the right hold: before each go, turn the top so the L sits at back-left or the line runs left to right. From a dot any angle works. Repeating it without re-holding can go round in circles and never reach the cross.",
    },
    {
      question: "No side of the top layer shows headlights. What next?",
      options: [
        "The T perm, with any side held on the left",
        "The Y perm, with the cube held any way",
        "The Sune, repeated until headlights appear",
        "The Ua perm, with a finished side at the back",
      ],
      answer: 1,
      why: "No headlights means two corners are swapped diagonally. The Y perm fixes that from any angle, and then every side shows headlights.",
    },
  ],
  // Method lessons: CFOP foundation
  "cfop-cross": [
    {
      question: "You've just switched to CFOP. What should your 15 seconds of inspection aim for?",
      options: [
        "Plan the whole cross, then track your first pair",
        "Look for an x-cross first, then plan the cross around it",
        "Find all four white edges and plan at least the first two",
        "Plan the cross on top, then turn the cube over to start",
      ],
      answer: 2,
      why: "After the z2, find all four white edges and plan as much of the cross on the bottom as you can, at least the first two edges. Planning the whole cross is the Sub-30 course's goal; tracking the first pair and x-crosses come later still, and the cross never goes on top.",
    },
  ],
  "cfop-f2l": [
    {
      question: "Is every F2L case 'join the pair on top, then insert'?",
      options: [
        "Yes: every case joins the pair in the top layer before it goes in",
        "Nearly: most do, but a few join as they go in, like R U R'",
        "No: each of the 41 cases is its own algorithm to memorise",
        "No: the corner always goes in first, and the edge follows it",
      ],
      answer: 1,
      why: "Free, pair, insert covers most cases, which is why you learn the motion rather than 41 names. A few skip the separate join: in the three-move case, the R and U turns bring the corner and edge together just as R' drops them in. Later you'll also meet keyhole, which puts them in one at a time through an empty slot.",
    },
    {
      question: "Which three ideas cover almost every intuitive F2L case?",
      options: [
        "Insert the corner, bring its edge down after it, then check",
        "Free stuck pieces, pair them with top turns, drop the pair in",
        "Rotate the slot to the front, spot the case, do its algorithm",
        "Find the edge, flip it with an F move, then insert both",
      ],
      answer: 1,
      why: "Free the pieces, pair them in the top layer, insert the pair. Nearly every case you'll meet is a version of those three, so learn the motion, not 41 names.",
    },
  ],
  "cfop-2look-oll": [
    {
      question:
        "You're in the Sub-45 course, using 2-look OLL and 2-look PLL. Which full set should you learn next?",
      options: [
        "Full OLL, then full PLL after it",
        "Full PLL, staying on 2-look OLL",
        "COLL, before either of the full sets",
        "Both full sets at once, in small groups",
      ],
      answer: 1,
      why: "Full PLL comes first: start it in the Sub-45 course if you like and have it finished by the end of Sub-30, staying on 2-look OLL meanwhile. Full OLL follows around sub-20, optional there and expected by Sub-15.",
    },
    {
      question: "In the first step of 2-look OLL, what do you look at?",
      options: [
        "The four corners, and how many show yellow on top",
        "Only the four edges, and whether their yellow faces up",
        "Where each edge belongs, so they end up in place",
        "The side stickers, looking for pairs of headlights",
      ],
      answer: 1,
      why: "Step one makes the top cross from the edges alone: dot, L, line or cross. Corners come in step two, and positions are PLL's job.",
    },
    {
      question: "Why learn Sune and Antisune before the other corner cases?",
      options: [
        "They come up far more often than any of the other five cases",
        "You need both of them before you can learn any PLL algorithms",
        "They mirror each other, and repeating one solves any corner case",
        "They're the hardest corner cases, so they need the most practice",
      ],
      answer: 2,
      why: "It isn't how often they turn up: six of the seven corner cases are equally likely (4 in 27 each) and H is half as likely. Sune and Antisune are short, seven moves on one easy R U R' rhythm, and each is the other's mirror image. Until you know a case's own algorithm, repeating Sune, with the right turn of the top before each go, finishes any corner case in three goes or fewer.",
    },
  ],
  "cfop-2look-pll": [
    {
      question: "In 2-look PLL, which comes first?",
      options: ["Edges", "Corners", "Either", "The final U turn"],
      answer: 1,
      why: "Corners first (headlights or not), then edges with U, H or Z perms, then the final turn.",
    },
    {
      question: "There are no headlights on any side. What does that mean for the corners?",
      options: [
        "Two neighbouring corners swap: do a T perm",
        "They're already solved, so go straight to the edges",
        "Three corners cycle: do an A perm",
        "Two diagonal corners swap: do a Y perm",
      ],
      answer: 3,
      why: "Headlights on one side mean two neighbouring corners swap: hold them on the left for the T perm. None anywhere means a diagonal swap, which the Y perm fixes, and matching corners on every side mean the corners are done. With four edge algorithms that's six for 2-look PLL, sixteen with 2-look OLL. Some guides use A perms and an E perm here instead.",
    },
  ],
  // Method lessons: refine the details
  "advanced-first-pair": [
    {
      question: "What does finding your first pair in inspection remove?",
      options: [
        "A few moves from the cross itself",
        "The pause right after the cross",
        "The need to look ahead during F2L",
        "Nothing you could measure on a timer",
      ],
      answer: 1,
      why: "If you already know the first pair when the cross finishes, there's no search, so no pause.",
    },
  ],
  "advanced-rotations": [
    {
      question: "In one whole F2L (all four pairs), when do rotations become too many?",
      options: ["More than four", "More than two", "Any rotation at all", "More than eight"],
      answer: 1,
      why: "Aim for one or two y or y' turns in the whole F2L and never a y2; back-slot and left-hand inserts and empty slots cover the rest, and never rotate while you're tracking a piece. Rotations start to matter near sub-20; before that, lookahead comes first.",
    },
  ],
  "advanced-lookahead": [
    {
      question: "Why turn slower on purpose to build lookahead?",
      options: [
        "It rests your hands, so they're fresh for fast solves",
        "It gives your eyes time to get ahead of your hands",
        "Slower turns are more accurate, so you need fewer moves",
        "It trains your fingers to find each trigger by feel",
      ],
      answer: 1,
      why: "Your eyes need time to find the next pair. Slow turning gives it, and the habit then carries into faster solves.",
    },
  ],
  "advanced-last-layer": [
    {
      question: "When do sets like COLL and ZBLL start to help?",
      options: [
        "Right after the beginner method, to skip 2-look",
        "As soon as full PLL is learned, before full OLL",
        "After full OLL and PLL, once F2L is smooth",
        "Before full PLL, so you never need to learn it",
      ],
      answer: 2,
      why: "They start from a last layer whose edges already face up after F2L, which happens about 1 solve in 8 without edge control, so they're optional extras for the fast end. Full PLL, then full OLL, come first, and while F2L is still the leak they add little.",
    },
  ],
  // Seeing past the first pair
  "past-why": [
    {
      question: "Why does removing a half-second pause matter more at 10 seconds than at 20?",
      options: [
        "It doesn't: half a second is half a second at any speed",
        "It's a bigger share of the solve: 5% rather than 2.5%",
        "Pauses get longer as you get faster, so there's more",
        "At ten seconds, judges count long pauses against you",
      ],
      answer: 1,
      why: "The same pause is a larger fraction of a faster solve, which is why removing pauses becomes most of the improvement near sub-10.",
    },
  ],
  "past-track": [
    {
      question: "In inspection, what's the realistic way to prepare the second pair?",
      options: [
        "Plan its full solution along with the first pair",
        "Follow the corner through your planned moves",
        "Leave it until the first pair is in, then search",
        "Build it into the cross as a second x-cross pair",
      ],
      answer: 1,
      why: "Fully planning a second pair rarely fits in inspection for most solvers, and knowing where its corner will be removes the search anyway. Fuller second-pair plans come later, and only on friendly scrambles.",
    },
  ],
  "past-practise": [
    {
      question: "How should you start practising second-pair tracking?",
      options: [
        "Straight away with the full fifteen-second limit",
        "With unlimited inspection, checking after each go",
        "In real competition rounds, where it matters most",
        "By memorising a few scrambles and their solutions",
      ],
      answer: 1,
      why: "Like cross planning, it grows fastest without time pressure; bring the limit back once your predictions are usually right.",
    },
  ],
  // Turning speed you can use
  "speed-two-tps": [
    {
      question:
        "You turn 9 moves a second in bursts. A 55-move solve takes 12 s. Roughly how much of it was spent not turning?",
      options: ["About 1 second", "About 6 seconds", "About 3 seconds", "None"],
      answer: 1,
      why: "55 moves at 9 a second is about 6 seconds of turning, so about 6 of the 12 seconds went on looking, deciding and regripping.",
    },
  ],
  "speed-raise-floor": [
    {
      question:
        "Which F2L is faster: 6 turns a second with no pauses, or 9 with a stop between every pair?",
      options: [
        "9 with stops, usually: the hands are faster",
        "6 with no pauses, usually",
        "They're about equal either way",
        "It depends mostly on the cube",
      ],
      answer: 1,
      why: "Pauses cost more than the speed gains. The pace you can hold without stopping is the one that moves your average.",
    },
  ],
  "speed-algorithms": [
    {
      question: "Why practise last slot and last layer together from real scrambles?",
      options: [
        "It doubles the reps, so each algorithm is learned faster",
        "Each algorithm starts from the grip a solve really leaves",
        "It trains your recognition of the full set of ZBLL cases",
        "It builds burst speed, since the algorithms run back to back",
      ],
      answer: 1,
      why: "In a solve, an algorithm starts wherever your hands were after the last pair. Drilling from that position removes the regrip.",
    },
  ],
  // Practising near ten
  "near-targets": [
    {
      question: "In the commonly quoted shape of a sub-10 solve, what takes about six seconds?",
      options: [
        "The cross and F2L together",
        "The last layer, OLL and PLL together",
        "F2L alone, not counting the cross",
        "Everything in the solve apart from the final AUF",
      ],
      answer: 0,
      why: "The quoted shape is about six seconds for the cross and F2L together and under four for the last layer. These are examples from people who got there, not rules, and they show which part of your solve is furthest off.",
    },
  ],
  "near-efficiency-or-tps": [
    {
      question:
        "According to the lesson, when is raising your turning speed the right thing to train?",
      options: [
        "Straight away, since the fastest solvers turn over twelve times a second",
        "As soon as your pairs start taking more moves than they should",
        "Once you know your next moves and the pauses are gone",
        "Only after switching to the efficiency-first style of the top solvers",
      ],
      answer: 2,
      why: "Faster hands on a solve you are still working out only reach the next pause sooner. Check a reconstruction first: too many moves means work on efficiency, long gaps mean lookahead. Train raw speed only when both look clean.",
    },
  ],
  "near-measure": [
    {
      question:
        "Your solves vary by about a second. Which average can show a real one-tenth improvement?",
      options: [
        "An average of 5 each morning",
        "An average of 12 from one session",
        "An average of 100 or more",
        "Your best single of the week",
      ],
      answer: 2,
      why: "Averages steady roughly with the square root of the number of solves. Short averages swing by more than a tenth from day to day with no change in skill.",
    },
  ],
  "near-structure": [
    {
      question:
        "After a year of heavy practice your average hasn't moved. What's the most likely fix?",
      options: [
        "Even more normal solves, until the habits finally shift",
        "Blocks aimed at one skill, each with a drill and a measure",
        "Switching method, since CFOP can't take you further",
        "Turning drills, since your hands are what's slow",
      ],
      answer: 1,
      why: "Normal solves repeat existing habits, and near ten seconds those habits are the limit. Focused blocks change them.",
    },
  ],
  "near-warm-up": [
    {
      question: "Why warm up before timing solves you'll judge yourself by?",
      options: [
        "Mostly to avoid hand injuries from turning fast while cold",
        "Early solves are slower, so timing them hides your level",
        "WCA rules expect a warm-up before any timed attempt",
        "It warms the lube, so the cube turns faster for later solves",
      ],
      answer: 1,
      why: "A few warm-up minutes make your averages comparable from day to day, which is the whole point of measuring.",
    },
  ],
  // Advanced F2L cases
  "adv-why-algorithms": [
    {
      question: "You average about 20 seconds. Which memorised F2L cases are worth learning first?",
      options: [
        "The ones with both pieces stuck in the slot",
        "All 41 cases, working down the list",
        "Back-slot versions of cases you rotate for",
        "None of them until you average sub-12",
      ],
      answer: 0,
      why: "Stuck pieces are where feel wastes the most: often more than ten moves, sometimes with a rotation. Their algorithms are nine to eleven moves with no rotation, so they're worth learning around sub-20, well before the rest.",
    },
  ],
  "adv-stuck-in-slot": [
    {
      question:
        "Both pieces are stuck in the front-right slot, and the edge's green sticker faces you. What does that tell you?",
      options: [
        "The edge is flipped, and the corner may well be home",
        "The edge is right, so the corner must be twisted",
        "The corner is home, and the edge is flipped",
        "The pair can only come out with a rotation",
      ],
      answer: 1,
      why: "Green facing you means the edge is right. The corner can't also be home, or the pair would already be solved, so white faces you or faces right: one of the two R and U cases to learn first.",
    },
  ],
  "adv-edge-in-slot": [
    {
      question:
        "A corner sits right above its slot with white facing up. Its edge is in the slot with green facing right. What do you do?",
      options: [
        "U R U' R' three times in a row",
        "Pull the edge out and pair by feel",
        "U', the sledgehammer, then R U' R'",
        "Rotate with y' and insert from the left",
      ],
      answer: 2,
      why: "Green facing right means the edge is flipped. After a U', the sledgehammer brings the edge out with the corner attached, and a plain R U' R' puts the pair in. U R U' R' three times is for an edge that's already right.",
    },
  ],
  "adv-corner-in-slot": [
    {
      question: "Which move keeps coming up in the memorised corner-in-slot cases?",
      options: [
        "R U2 R', to turn the corner round before pairing",
        "M U M', to break up the pair on top",
        "A y' rotation, then a left-hand insert",
        "The sledgehammer, R' F R F', or its reverse",
      ],
      answer: 3,
      why: "The sledgehammer, which you may know from OLL, comes up in all three. In two it comes first, straight away or after a U': it lifts the corner out of the slot and sets it up with the edge, and a short insert finishes. In the third, a quick trigger comes first and the reverse, F R' F' R, finishes. None needs a rotation.",
    },
  ],
  "adv-white-up": [
    {
      question:
        "The corner is right above its slot with white facing up, and its edge is beside it on the right, green facing right. What's the quick solution?",
      options: [
        "R U2 R' to turn it, then pair by feel",
        "F U R U' R' F', then R U' R'",
        "M U r U' r' U' M'",
        "U R U' R' three times",
      ],
      answer: 1,
      why: "F U R U' R' F' pairs the pieces and R U' R' puts the pair in: nine moves, no rotation, and no turning the corner round first. The others are for different cases: U R U' R' three times for an edge waiting in the slot, M U r U' r' U' M' for a pair joined the wrong way.",
    },
  ],
  "adv-back-slots": [
    {
      question: "When should you start learning back-slot F2L versions?",
      options: [
        "Straight after intuitive F2L, before the front-slot cases",
        "Once front slots are fluent, for cases you rotate for",
        "Only once full OLL, PLL and COLL are all learned",
        "Never: a y2 to bring the slot round costs nothing",
      ],
      answer: 1,
      why: "A back-slot algorithm you have to think about is slower than a rotation you don't. Wait until front-slot F2L is fluent, then learn the cases you catch yourself rotating for, into the back-right slot.",
    },
  ],
  // A cross built for F2L
  "cf2l-choose-by-pairs": [
    {
      question:
        "You've found two six-move crosses and have time to compare them. How do you choose?",
      options: [
        "Take the first one you found, to save thinking",
        "Take the one with more D turns, which are easy",
        "Take the one that leaves the easier first pair",
        "Keep looking for a third cross before deciding",
      ],
      answer: 2,
      why: "They tie on move count but rarely leave the same F2L. Check where your likely first pair's corner ends up under each, and take the cross that leaves it on top and easy to reach.",
    },
  ],
  "cf2l-fingertricks": [
    {
      question:
        "One cross is six moves with a B2 and two D turns; another is seven moves of R, F and U turns. Which is likely faster?",
      options: [
        "The six-move one, since it's shorter",
        "The seven-move one, since it flows",
        "Both equal: one move is nothing",
        "Neither: rotate so B becomes F",
      ],
      answer: 1,
      why: "Move count isn't time. A B turn and a run of D turns make you regrip, and every regrip is a small stop, so a seven-move cross of easy turns often beats the six-move one.",
    },
  ],
  "cf2l-cross-and-pair": [
    {
      question: "On a friendly scramble, how much should you plan in inspection?",
      options: [
        "The cross only, then look for the first pair once it's done",
        "The cross and every pair after it, move by move",
        "As much as fits, even the parts you're unsure of",
        "The cross and first pair, plus the second pair's corner",
      ],
      answer: 3,
      why: "Plan the cross and first pair fully and the second pair only as a location. Planning further backfires: a plan you're unsure of makes you slow down to check it.",
    },
  ],
  // Predict the PLL
  "ppll-one-block": [
    {
      question:
        "During the OLL's last moves, you see a bar on the left side. Which PLLs are still possible?",
      options: [
        "Any of the 21: one side isn't enough",
        "T and A perms: three in all",
        "U, J or F perms: five in all",
        "N, V or Y perms: four in all",
      ],
      answer: 2,
      why: "Only five PLLs show a bar: Ua, Ub, Ja, Jb and F. That makes a bar the strongest clue one side can give. Headlights, by comparison, rule out eight PLLs.",
    },
  ],
  "ppll-post-auf": [
    {
      question:
        "You're about to do a T perm with the headlights on the left, and they match the front centre. What's the final turn?",
      options: ["No final turn", "U", "U'", "U2"],
      answer: 2,
      why: "The T perm leaves the headlight corners alone and ends with the whole left side in their colour. When that colour belongs to the front centre, a U' brings it round to the front.",
    },
  ],
  "ppll-second-angles": [
    {
      question: "Which PLL angles are worth a second algorithm?",
      options: [
        "All 84 angles, so no PLL ever needs a set-up turn",
        "Only angles that cost a U2 or an avoidable turn",
        "Only the rarest PLLs, since they get the least practice",
        "None: a y2 of the whole cube does the same job",
      ],
      answer: 1,
      why: "Learning all 84 angles is a poor trade. The ones worth it are the angles where your usual algorithm needs a U2 first or an avoidable last turn, such as a U perm with the solved bar in front.",
    },
  ],
};
