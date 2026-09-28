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
        "It needs more moves to solve",
        "You have to flip the cube before F2L, and you can't see the slots while you build it",
        "The top face is harder to turn",
        "Competition rules penalise it",
      ],
      answer: 1,
      why: "The cross takes the same moves either way. The cost is the x2 flip afterwards, plus losing the view of the slots — and of pairs forming — while you build it.",
    },
  ],
  "cross-move-count": [
    {
      question: "Your cross took 12 moves. What does that tell you?",
      options: [
        "Nothing — some scrambles need 12",
        "A shorter one almost certainly existed: every cross can be done in eight or fewer",
        "You should turn faster",
        "You should switch to colour neutrality",
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
        "Take both out and solve them one at a time",
        "Leave them; one D turn will put both home once the others are in",
        "Solve the other two edges on top first",
        "Flip the cube and solve them from the top",
      ],
      answer: 1,
      why: "Edges that are already right relative to each other are free: a single D turn places both. Solving them one at a time throws that away.",
    },
  ],
  "cross-colour-neutral": [
    {
      question: "What's the cheapest way to get most of colour neutrality's benefit?",
      options: [
        "Go fully neutral in one week",
        "Solve on white and yellow only (dual neutral)",
        "Switch colours every solve at random",
        "Wait until you're sub-10",
      ],
      answer: 1,
      why: "White and yellow crosses mirror each other, so dual neutrality takes days rather than weeks and captures a good share of the benefit.",
    },
  ],
  // Using all fifteen seconds
  "inspection-what-it-is": [
    {
      question: "What's the real goal of inspection?",
      options: [
        "To look at every face of the cube",
        "To start the solve with nothing left to decide about the cross",
        "To find the hardest pair",
        "To warm up your fingers",
      ],
      answer: 1,
      why: "Thinking during inspection is free; thinking during the solve costs time. The aim is to arrive at the first move with the cross already decided.",
    },
  ],
  "inspection-ladder": [
    {
      question: "Which rung of the planning ladder stops most people, and why?",
      options: [
        "Finding all four edges, because it's slow",
        "Planning the second edge, because you must imagine a cube you can't see",
        "Executing the plan, because hands are slow",
        "Planning the first edge, because it's the longest",
      ],
      answer: 1,
      why: "Planning the second edge means holding the cube state after the first edge in your head. It's the first rung that needs imagination, and everything above it is the same skill repeated.",
    },
  ],
  "inspection-tracking": [
    {
      question: "What's a good way to practise the skill underneath cross planning?",
      options: [
        "More timed solves",
        "On a solved cube, pick a piece, do a short sequence with your eyes closed, and say where it went",
        "Learn more cross algorithms",
        "Solve the cross on top",
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
        "Double-check the cross",
        "Find which pair you'll solve first",
        "Start the timer early",
        "Look for an OLL skip",
      ],
      answer: 1,
      why: "Once the cross is dependable, the next best use of inspection is knowing your first pair. It removes the pause at the start of F2L, one of the costliest in the solve.",
    },
  ],
  // The join after the cross
  "join-why-it-exists": [
    {
      question: "Where does the pause after the cross come from?",
      options: [
        "The cross takes too many moves",
        "Your eyes watch the cross finish, so the search for the first pair starts from nothing",
        "Your hands are tired",
        "F2L is harder than the cross",
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
        "Force one every solve",
        "First make plain cross planning reliable, then just notice when a pair would be solved and say yes or no",
        "Learn x-cross algorithms",
        "Skip the cross entirely",
      ],
      answer: 1,
      why: "An x-cross is planning a cross while tracking two extra pieces. Without reliable cross planning, forcing it makes your normal crosses worse. Noticing first builds the recognition.",
    },
  ],
  // F2L in fewer moves
  "f2l-what-a-pair-is": [
    {
      question: "What's the one idea behind every F2L case?",
      options: [
        "Memorise 41 algorithms",
        "Join the corner and edge in the top layer, then drop the pair into its slot",
        "Always solve the edge first",
        "Use as many rotations as needed",
      ],
      answer: 1,
      why: "Every case is 'join, then insert'. Learning it that way lets you solve cases you've never seen and spot shorter solutions.",
    },
  ],
  "f2l-move-count": [
    {
      question: "A case regularly takes you 12 moves. What's most likely?",
      options: [
        "It's one of the hardest cases",
        "You're using a solution that works, not a good one — most cases take seven or eight",
        "You need a faster cube",
        "You should rotate more",
      ],
      answer: 1,
      why: "Most F2L cases have seven- or eight-move solutions. Twelve usually means an extra trigger: pairing the long way round, or using the wrong slot.",
    },
  ],
  "f2l-rotations": [
    {
      question: "Why does a rotation cost more than its move count suggests?",
      options: [
        "Rotations are illegal in competition",
        "Every piece you were tracking moves, so your lookahead starts again",
        "Rotations wear out the cube",
        "They're slower to turn than R",
      ],
      answer: 1,
      why: "The turn itself is cheap. Losing track of every piece you were following is what costs the time.",
    },
  ],
  "f2l-empty-slots": [
    {
      question:
        "The corner is already correctly in its slot and the edge is in the top layer. What helps most?",
      options: [
        "Take the corner out and pair them",
        "Use an empty slot to move the corner aside, place the edge, and put it back (keyhole)",
        "Rotate until it looks familiar",
        "Solve a different pair and hope",
      ],
      answer: 1,
      why: "Keyhole uses a free slot as workspace. A case like this never needs more than about six moves, with no pairing at all.",
    },
  ],
  // Seeing a pair instantly
  "pair-both-pieces": [
    {
      question: "What's faster than finding a corner and then hunting for its edge?",
      options: [
        "Finding the edge first",
        "Scanning the top layer for pairs — two pieces that belong together, seen at once",
        "Solving the cross again",
        "Rotating until a pair appears",
      ],
      answer: 1,
      why: "Corner-then-edge is two searches, the second while you're already committed. Looking for pairs does it in one.",
    },
  ],
  "pair-all-angles": [
    {
      question:
        "You can solve a case at the front right, but rotate whenever it appears at the back left. What's the fix?",
      options: [
        "Keep rotating, it's only two moves",
        "Practise the same case in each of the four slots until it reads the same",
        "Learn a new algorithm for it",
        "Avoid that slot",
      ],
      answer: 1,
      why: "The case is defined by where the pieces are relative to each other and their slot, not by how you hold the cube. Reps in all four positions make it read the same.",
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
        "Try harder to look ahead at the same speed",
        "Turn slower still, until the cube never stops",
        "Speed up to make up the time",
        "Ignore it",
      ],
      answer: 1,
      why: "A pause means your eyes didn't get there in time. The fix is more time — a slower pace — not more effort. The rule 'never stop' is the whole drill.",
    },
  ],
  "lookahead-what-to-look-at": [
    {
      question: "While you insert a pair, where should your eyes be?",
      options: [
        "On the pair you're inserting, to make sure it goes in",
        "On the faces not involved, looking for the next pair",
        "On your fingers",
        "On the timer",
      ],
      answer: 1,
      why: "You already know what the current pair is doing. Watching it tells you nothing; looking for the next one is what removes the pause.",
    },
  ],
  // The last pair into OLL
  "lastpair-free-attention": [
    {
      question: "Why is the last F2L pair the best moment to read OLL?",
      options: [
        "The top face is hidden until the pair is done",
        "There's no next pair to track, so your eyes are free, and the top face is visible",
        "OLL is decided before the cross",
        "It isn't; read OLL after the pair",
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
        "No — only an exact read helps",
        "Yes — knowing the family (dot, line, L, cross) makes the final read nearly instant",
        "Only for PLL",
        "Only if you use Winter Variation",
      ],
      answer: 1,
      why: "The family narrows 57 cases to a handful, so after the insertion one glance decides it. That captures most of the benefit.",
    },
  ],
  "lastpair-influence": [
    {
      question:
        "When do systems that control your last layer from the last pair (like Winter Variation) start to make sense?",
      options: [
        "As soon as you learn F2L",
        "Around twelve seconds and below, once the normal last pair and last layer are quick",
        "Never",
        "Before learning full PLL",
      ],
      answer: 1,
      why: "They add recognition work and only pay once the ordinary last pair and last layer are fast — around twelve seconds and below.",
    },
  ],
  // Faster OLL
  "oll-by-shape": [
    {
      question: "What makes OLL recognition fast?",
      options: [
        "Memorising the case numbers",
        "Recognising the shape family first, then one corner sticker",
        "Checking all 57 pictures",
        "Only learning 2-look",
      ],
      answer: 1,
      why: "The shape (dot, line, L, cross) narrows it to a few cases and one corner sticker decides — a two-step read instead of a comparison against 57.",
    },
  ],
  "oll-angle": [
    {
      question:
        "You rotate the cube during OLL until the case looks like its picture. What's the better habit?",
      options: [
        "Learn each case from all four angles",
        "Turn faster while rotating",
        "Learn more algorithms",
        "Only practise the easy cases",
      ],
      answer: 0,
      why: "Every OLL can be recognised and executed from any angle. Drilling your slower cases from all four removes the rotation.",
    },
  ],
  "oll-lockups": [
    {
      question: "An algorithm keeps locking up on a good cube. What's the usual cause?",
      options: [
        "The cube needs replacing",
        "Turns start before the previous one finishes — turn more calmly and accurately",
        "You need a different algorithm",
        "Too little lube",
      ],
      answer: 1,
      why: "On a decent cube, lockups on ordinary triggers almost always mean inaccurate turning. Slow, clean reps raise the speed at which it stays clean.",
    },
  ],
  // Learning OLL without drowning
  "oll-when": [
    {
      question: "Around what average does full OLL usually become worth learning?",
      options: ["45 seconds", "Around 20 seconds", "Sub-10", "Before full PLL"],
      answer: 1,
      why: "Before about 20 seconds, cheaper time is available elsewhere — full PLL, pause-free F2L, a shorter cross. Around 20 and on the way to 15, OLL becomes the thing holding the last layer back.",
    },
  ],
  "oll-groups": [
    {
      question: "Which OLL cases are the best place to start learning full OLL?",
      options: [
        "The dot cases",
        "The seven cases with all edges already oriented",
        "Cases 1 to 10 in number order",
        "Whichever are longest",
      ],
      answer: 1,
      why: "You already know the edges-oriented cases from 2-look, so only the corner recognition is new. Dots are the hardest to read and come last.",
    },
  ],
  "oll-retention": [
    {
      question: "An OLL is fast in a trainer but slow in real solves. What's missing?",
      options: [
        "More trainer reps",
        "Transfer: using it in ordinary solves, where it arrives unannounced",
        "A different algorithm",
        "Nothing — it's learned",
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
        "After the OLL is completely finished",
        "As you start the last trigger of the algorithm",
        "Before starting the OLL",
        "Never — watch the whole algorithm",
      ],
      answer: 1,
      why: "A learned algorithm doesn't need watching. Moving your eyes to the side stickers during its last trigger usually gets you the PLL family early.",
    },
  ],
  "pll-auf": [
    {
      question: "When should you know the final U turn of a PLL?",
      options: [
        "After the algorithm ends",
        "Before the algorithm ends",
        "It doesn't matter",
        "Only at competitions",
      ],
      answer: 1,
      why: "The final turn is fixed by the case and the angle you started from, so it can be known in advance. Deciding at the end adds a pause at the worst moment.",
    },
  ],
  // Faster PLL
  "pll-target": [
    {
      question:
        "Nineteen of your PLLs take about a second and two take three. What should you work on?",
      options: [
        "Get every case a little faster",
        "Those two slow cases specifically",
        "Full OLL",
        "Turning speed in general",
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
        "The 15-move one, if it runs off your fingers without a pause",
        "Neither: learn a third",
        "It makes no difference",
      ],
      answer: 1,
      why: "Last-layer speed is about grips and triggers more than length. A clean rhythm beats a shorter sequence with a pause in it.",
    },
  ],
  "pll-under-pressure": [
    {
      question: "At a competition, which fingertricks should you use?",
      options: [
        "Your fanciest, fastest variants",
        "The standard, repeatable movements you always use",
        "Whatever you learned most recently",
        "Slower ones on purpose",
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
        "PLL algorithms are shorter",
        "It's a third of the size, each case comes up more often, and it trains side-sticker reading",
        "OLL isn't used by fast solvers",
        "PLL is required at competitions",
      ],
      answer: 1,
      why: "21 cases against 57, more reps per case, and recognition that transfers to reading the cube in F2L.",
    },
  ],
  "pll-order": [
    {
      question: "How should you learn the G perms?",
      options: [
        "One every few months",
        "All four together as a set",
        "Skip them — they're rare",
        "Before anything else",
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
        "More timed solves",
        "Deliberate practice: conscious work on one specific weakness",
        "A new cube",
        "Longer sessions",
      ],
      answer: 1,
      why: "Timed solves make existing skills automatic; they rarely add new ones. A plateau with lots of practice usually means the deliberate half is missing.",
    },
  ],
  "practice-session-shape": [
    {
      question: "What's wrong with a session that works on lookahead, then OLL, then the cross?",
      options: [
        "Nothing — variety is good",
        "It works on nothing: one focus for several sessions is what moves a skill",
        "It's too short",
        "The order should be reversed",
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
        "Learn a bigger algorithm set",
        "Change what you practise — the limit has moved, often to lookahead",
        "Practise longer",
        "Buy a faster cube",
      ],
      answer: 1,
      why: "A genuine plateau usually means the thing limiting you has changed but your practice hasn't. Consistent F2L pauses are the most common real answer.",
    },
  ],
  "practice-measure": [
    {
      question: "Which number best tells you whether you're improving?",
      options: [
        "Your best single",
        "Your average of 50 or your median",
        "Your worst solve",
        "Your fastest PLL",
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
        "Bad luck with the scramble, every time",
        "A half-known algorithm, a lockup, or freezing on something unfamiliar",
        "Turning too slowly",
        "The timer",
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
        "Endless singles",
        "The competition format: full inspection, averages of five, ideally with someone watching",
        "Only slow solves",
        "Only algorithm drills",
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
        "Fingers move faster than arms",
        "The cube stays still in your hands, so the next turn starts at once and your eyes lose nothing",
        "It uses fewer moves",
        "It's quieter",
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
        "Ask someone to listen",
        "Use a smart cube",
      ],
      answer: 1,
      why: "Slow-motion video shows repositioning you have no memory of — and most of it comes from the solution you chose, not from necessity.",
    },
  ],
  "turning-calm": [
    {
      question: "How should you raise your turning speed?",
      options: [
        "Turn as hard as you can every solve",
        "Find the fastest speed where your turning stays clean, stay there, and let it creep up",
        "Buy a cube with stronger magnets",
        "Only practise algorithms",
      ],
      answer: 1,
      why: "Past a low threshold, force causes lockups that cost more than they gain. Practising above your clean speed trains inaccuracy.",
    },
  ],
  "turning-both-hands": [
    {
      question: "What's the point of a session with no R moves allowed?",
      options: [
        "To become fully ambidextrous",
        "To build enough left hand that you stop rotating to avoid it",
        "To practise slow solves",
        "To make your right hand rest",
      ],
      answer: 1,
      why: "You don't need perfect ambidexterity — just enough left hand that awkward cases stop costing a rotation.",
    },
  ],
  // Know the beginner method cold
  "cold-seven-steps": [
    {
      question: "Why check the cube at the end of each step?",
      options: [
        "It's required by the method",
        "So a mistake is fixed in seconds, instead of found during the last layer and costing the solve",
        "To slow yourself down",
        "To practise rotations",
      ],
      answer: 1,
      why: "Knowing what each step leaves solved lets you catch a mistake when it happens — and tells you exactly which step to practise.",
    },
  ],
  "cold-notation": [
    {
      question: "From the front, R and L turn in opposite directions. Why?",
      options: [
        "Because L is always written backwards",
        "Clockwise is judged looking straight at the face being turned",
        "It's a mistake in most tutorials",
        "They don't — they turn the same way",
      ],
      answer: 1,
      why: "Each move is clockwise as seen from its own face. Looking from the front, the right and left faces are on opposite sides, so they appear to turn opposite ways.",
    },
  ],
  "cold-triggers": [
    {
      question: "An algorithm is eleven moves long. What's the easiest way to remember it?",
      options: [
        "Memorise the letters in order",
        "Break it into two or three familiar triggers",
        "Write it on your hand",
        "Only learn it from video",
      ],
      answer: 1,
      why: "Long algorithms are short, familiar chunks like R U R' U' joined together. Three chunks are far easier than eleven letters.",
    },
  ],
  "cold-no-daisy": [
    {
      question: "What's the cost of the daisy?",
      options: [
        "It's against the rules",
        "It roughly doubles the moves the cross takes, and it's a habit you'll have to drop later",
        "It only works on white",
        "Nothing",
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
        "Tighten one face until it feels right",
        "In small, equal steps on all six centres, then solve on it for a while",
        "As loose as possible for speed",
        "Randomly until it stops popping",
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
        "It needs more lube",
        "It needs WD-40",
        "The magnets are broken",
      ],
      answer: 0,
      why: "One or two drops is usually enough, and fresh lube often feels slow before it settles. Judge it after a proper session.",
    },
  ],
  "setup-magnets": [
    {
      question: "Why change only one thing about your cube at a time?",
      options: [
        "It's cheaper",
        "Otherwise you can't tell which change helped",
        "Cubes break if you change two things",
        "It's a competition rule",
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
        "Switch back to layer-by-layer",
        "Keep going — one to two weeks slower is normal while the new skill builds",
        "Learn all 41 algorithms at once",
        "Time every solve to track the damage",
      ],
      answer: 1,
      why: "Almost everyone gets slower first. The move saving is large and the old method has nowhere left to go.",
    },
  ],
  "switch-three-ideas": [
    {
      question: "Which three ideas cover almost every intuitive F2L case?",
      options: [
        "Cross, OLL, PLL",
        "Take a stuck piece out, line the pair up with top turns, drop it in",
        "Rotate, rotate, insert",
        "Corner first, then edge, then check",
      ],
      answer: 1,
      why: "Free the pieces, pair them in the top layer, insert the pair. Every case is a version of those three.",
    },
  ],
  "switch-when-algorithms": [
    {
      question: "When should you start learning F2L cases as algorithms?",
      options: [
        "Before you try intuitive F2L",
        "Once intuitive F2L works, and only for the cases that stay slow",
        "Never",
        "All 41 at once, as soon as possible",
      ],
      answer: 1,
      why: "Algorithms without understanding leave you stuck on anything you haven't memorised. Add them one or two at a time for the cases intuition handles badly.",
    },
  ],
  // 2-look OLL
  "oll2-two-looks": [
    {
      question: "In the first step of 2-look OLL, what do you look at?",
      options: [
        "The corners",
        "Only the four edges, and whether their top colour faces up",
        "Where the pieces belong",
        "The side stickers",
      ],
      answer: 1,
      why: "Step one makes the top cross from the edges alone: dot, L, line or cross. Corners come in step two, and positions are PLL's job.",
    },
  ],
  "oll2-sune-first": [
    {
      question: "Why learn Sune and Antisune before the other corner cases?",
      options: [
        "They're the shortest",
        "They come up far more often, and several other cases can be solved with two of them",
        "They're needed for PLL",
        "They're the hardest",
      ],
      answer: 1,
      why: "They cover the corner step most often and double as a bridge: several other cases can be done as two Sune-type algorithms while you learn them.",
    },
  ],
  "oll2-one-cue": [
    {
      question: "What's the fastest way to recognise a 2-look corner case?",
      options: [
        "Compare the whole top face with all seven pictures",
        "Use one chosen cue: how many corners face up, then where one sticker points",
        "Try algorithms until one works",
        "Rotate until it matches",
      ],
      answer: 1,
      why: "A single deliberate cue per case is faster than comparing whole pictures, and it holds up when you're nervous.",
    },
  ],
  // 2-look PLL
  "pll2-headlights": [
    {
      question: "There are no headlights on any side. What does that mean for the corners?",
      options: [
        "They're already solved",
        "They swap diagonally — one algorithm",
        "Three need to cycle",
        "The cube is broken",
      ],
      answer: 1,
      why: "Headlights on one side means an A perm (three corners cycle); none means a diagonal swap; every side means the corners are done.",
    },
  ],
  "pll2-edges": [
    {
      question: "The corners are done and one side is completely one colour. What case is it?",
      options: [
        "An H perm",
        "A U perm — three edges cycle; hold the solved bar at the back",
        "A Z perm",
        "Already solved",
      ],
      answer: 1,
      why: "A solved bar means three edges need to cycle: one of the U perms. No solved side means edges swapping in pairs: H or Z.",
    },
  ],
  "pll2-auf": [
    {
      question: "Which full-PLL cases are worth adding first after 2-look?",
      options: [
        "The G perms",
        "The common cases 2-look handles worst, starting with T and J perms",
        "The rarest ones",
        "The N perms",
      ],
      answer: 1,
      why: "Common cases that 2-look does as two algorithms give the biggest saving per case learned.",
    },
  ],
  // Choosing the next pair
  "choice-skip-bad": [
    {
      question:
        "Both pieces of the pair you were about to solve are stuck in slots. What should you do?",
      options: [
        "Solve it anyway — it's next",
        "Look for another pair; there's very often one, and solving it may free the stuck pieces",
        "Rotate the cube",
        "Restart F2L",
      ],
      answer: 1,
      why: "Stuck pairs take nine or ten moves; a pair on top takes three to seven. Declining the expensive one is a free efficiency gain.",
    },
  ],
  "choice-free-pairs": [
    {
      question:
        "A corner and its edge are already joined in the top layer. When should you solve that pair?",
      options: [
        "Last",
        "Whenever you see it — it's nearly free",
        "Only if it's in the front",
        "After the hardest pair",
      ],
      answer: 1,
      why: "Free pairs cost almost nothing and leave fewer pieces to search through next.",
    },
  ],
  "choice-flow": [
    {
      question: "Choosing the best pair takes you a full second. What should you do instead?",
      options: [
        "Keep choosing carefully",
        "Take the pair you see, and move the choosing into the previous pair's insertion",
        "Always solve the front-right slot first",
        "Solve pairs in number order",
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
        "Any way, then pair it afterwards",
        "With a move that leaves it next to its partner as it comes out",
        "Rotate the cube first",
        "Leave it until last",
      ],
      answer: 1,
      why: "Extracting in a way that already sets up the pair turns an eleven-move case into a seven- or eight-move one.",
    },
  ],
  "stuck-both": [
    {
      question: "Both pieces are in the slot, wrong. Improvise or use an algorithm?",
      options: [
        "Improvise — it's more intuitive",
        "Use an algorithm: these five cases are where memorised solutions clearly win",
        "Take both out and start again",
        "Always rotate first",
      ],
      answer: 1,
      why: "The both-in-slot cases are the worst in F2L; nine- or ten-move algorithms beat improvising. And if another pair is available, solving it first may free them.",
    },
  ],
  "stuck-other-slots": [
    {
      question:
        "A piece you need is in another pair's slot, and that pair is nearly ready. What should you do?",
      options: [
        "Extract your piece first",
        "Solve that pair first — it brings your piece out for free",
        "Rotate",
        "Leave both",
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
        "Guess and correct afterwards",
        "Learn a reference sticker for each case that shows where the layer will end up",
        "Watch the last move",
        "You can't",
      ],
      answer: 1,
      why: "One sticker on the front or right face tells you the final turn before you start. Some upfront work per case, then it's free forever.",
    },
  ],
  "auf-before": [
    {
      question: "Which habit is faster for the turn before a case?",
      options: [
        "Turn the top until the case looks familiar, then recognise",
        "Recognise from wherever it is, then do the smallest turn",
        "Always do U first",
        "Rotate the whole cube",
      ],
      answer: 1,
      why: "Recognising from any angle and choosing the smallest turn — or an alternative algorithm that needs none — removes the searching turn.",
    },
  ],
  "auf-fingers": [
    {
      question: "How should you do the final turn of an algorithm?",
      options: [
        "Always with the right index finger",
        "With whichever finger is already in place when the algorithm ends",
        "With a regrip, for control",
        "As a U2 every time",
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
      options: ["Slow execution of PLL", "Pauses between F2L pairs", "The cross", "Turning speed"],
      answer: 1,
      why: "Half a second between each of four pairs is two seconds — the difference between 22 and 20. Last-layer recognition comes next; the cross is usually smallest.",
    },
  ],
  "budget-measure": [
    {
      question: "Why measure instead of guessing where your time goes?",
      options: [
        "Guessing is fine for most people",
        "People overestimate their last layer and underestimate pauses, because pauses don't feel like time",
        "Measuring is required for sub-20",
        "Tests are faster than solves",
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
        "Faster turning",
        "Choice: the shortest cross, or the one with the easiest first pair",
        "Better OLL recognition",
        "Nothing measurable",
      ],
      answer: 1,
      why: "Its benefit is choice in inspection. The cost is mostly the decision to look at more than one colour.",
    },
  ],
  "cn-dual-first": [
    {
      question: "Why is white-and-yellow the cheap first step?",
      options: [
        "They're the most common colours",
        "Opposite crosses keep the same arrangement of side colours, so the switch is quick",
        "Competitions require it",
        "They have fewer cases",
      ],
      answer: 1,
      why: "The two crosses are opposite each other, so everything around them keeps the same arrangement. It takes days, not months.",
    },
  ],
  "cn-pairs": [
    {
      question: "After switching cross colours, which part stays slow longest?",
      options: ["The cross", "F2L pair recognition", "PLL", "Inspection"],
      answer: 1,
      why: "The cross adapts in days, but pairs were partly recognised by colour combinations, and every combination changes. Ordinary solving fixes it with reps.",
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
        "Your last F2L insert ends with a top turn and your OLL needs one to line up. What's the saving?",
      options: [
        "None",
        "Choose the insert's direction so the case comes out already aligned — one turn instead of two",
        "Do both turns faster",
        "Skip the OLL",
      ],
      answer: 1,
      why: "If you know the next step while finishing this one, the adjusting turn and the finishing turn can be the same turn.",
    },
  ],
  "filler-rotations": [
    {
      question: "You rotate y to reach a slot, then y' to come back. What does that cost?",
      options: [
        "Nothing — they cancel",
        "Two resets of what your eyes were tracking, for one pair",
        "Just two moves",
        "A penalty",
      ],
      answer: 1,
      why: "The rotations cancel as moves but not as attention. Back-slot and left-hand inserts avoid both.",
    },
  ],
  // Solving two pairs at once
  "multi-family": [
    {
      question: "Why do keyhole, pseudo-slotting and multislotting come after lookahead?",
      options: [
        "They're banned below sub-15",
        "They depend on seeing more of the cube than the pair in front of you; without lookahead they become pauses",
        "They need special cubes",
        "They're only for one-handed",
      ],
      answer: 1,
      why: "Each trick uses information about other pieces. Without lookahead, finding that information costs more than the trick saves.",
    },
  ],
  "multi-example": [
    {
      question: "In the simplest multislot, what do two extra moves buy?",
      options: [
        "Nothing",
        "A second pair lined up as a side effect — usually four to six moves of pairing saved",
        "An OLL skip",
        "A faster cross",
      ],
      answer: 1,
      why: "Turning a second face out of the way and back costs two moves but pairs up the next pair for free.",
    },
  ],
  "multi-limits": [
    {
      question: "What's the sensible way to use multislotting?",
      options: [
        "Plan it on every insert",
        "Learn keyhole well, take easy multislots when you notice them, and don't hunt",
        "Never use it",
        "Only in inspection",
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
        "Full OLL",
        "Planning a plain cross fully in inspection",
        "Colour neutrality",
        "ZBLL",
      ],
      answer: 1,
      why: "An x-cross is a full cross plan plus tracking two more pieces. Without the first, the second won't fit in fifteen seconds.",
    },
  ],
  "xc-ladder": [
    {
      question: "How should you start practising x-crosses?",
      options: [
        "At full speed with 15-second inspection",
        "With unlimited inspection, building up: corner, then corner and edge, then joining them",
        "By memorising x-cross algorithms",
        "Only on easy scrambles",
      ],
      answer: 1,
      why: "Time pressure stops you seeing what an x-cross looks like. Learn the shapes untimed, then bring the limit back.",
    },
  ],
  "xc-shapes": [
    {
      question: "Which scrambles most often hand you an x-cross?",
      options: [
        "Ones with a solved face",
        "Ones with a pair already joined, or a corner already on the bottom near its slot",
        "Ones with an OLL skip",
        "None — it's random",
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
        "By how many cases it has",
        "By how much faster it makes an average solve, divided by the algorithms to learn and keep",
        "By what top solvers use",
        "By how fun the algorithms are",
      ],
      answer: 1,
      why: "Speed per algorithm. And the honest comparison is always against another month of F2L work.",
    },
  ],
  "sets-small": [
    {
      question: "What does COLL leave you with?",
      options: [
        "An OLL",
        "Only an edge permutation — a U, H or Z perm, or a skip",
        "A corner permutation",
        "A full PLL",
      ],
      answer: 1,
      why: "COLL orients and places the corners together when edges are already oriented, so only the edges can be out of place.",
    },
  ],
  "sets-large": [
    {
      question: "If you're curious about ZBLL, what's the standard first step?",
      options: [
        "Learn all 493 cases in order",
        "Learn COLL first, then add ZBLL a group at a time",
        "Learn OLLCP",
        "Learn VLS",
      ],
      answer: 1,
      why: "COLL is a subset of the same idea. Build on it, and stop adding cases when new ones stop coming up often enough to matter.",
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
      question: "In the usual move-counting metric, how many moves is R2?",
      options: ["Two", "One", "Half", "Zero"],
      answer: 1,
      why: "The common metric counts any turn of any layer, including a half turn or a slice, as one move.",
    },
  ],
  "recon-what-to-look-for": [
    {
      question: "Your reconstruction shows a pair that took 12 moves. What does that suggest?",
      options: [
        "Nothing — pairs vary",
        "A better solution probably existed; most good pairs are seven or eight",
        "You need to turn faster",
        "It was a lucky case",
      ],
      answer: 1,
      why: "Most good pairs take seven or eight moves. A twelve-move pair is worth looking up.",
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
        "Learning new algorithms",
        "Practising with the full fifteen-second inspection, planning the cross every solve",
        "Buying a new cube",
        "Doing only singles",
      ],
      answer: 1,
      why: "Competitions punish going over time, and nerves make you plan less than you think. Practising real inspection prepares for both.",
    },
  ],
  "comp-nerves": [
    {
      question: "Your first competition average is 10% slower than at home. What does that mean?",
      options: [
        "You've got worse",
        "It's the expected result for a first competition",
        "Your cube was wrong",
        "You should stop competing",
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
        "Watch your hands",
        "Look for the next piece you'll need",
        "Close",
        "Watch the timer",
      ],
      answer: 1,
      why: "Moves you know don't need watching. Every piece you find during a trigger is a stop you don't have to make.",
    },
  ],
  "first-look-slow-down": [
    {
      question: "You try to look ahead but there's no time at your normal speed. What now?",
      options: [
        "Give up on lookahead",
        "Turn slower, at a pace where the cube never stops",
        "Turn faster to make more time",
        "Only look ahead on easy solves",
      ],
      answer: 1,
      why: "No time to look is the signal to slow down. Slow, continuous solves are often not much slower overall, because the long searches disappear.",
    },
  ],
  "first-look-where": [
    {
      question: "Where is the next piece you need usually found?",
      options: ["The bottom layer", "The top layer", "The middle layer", "Anywhere equally"],
      answer: 1,
      why: "Unsolved pieces sit in the top layer, so scan the top face and its side stickers first.",
    },
  ],
  // F2L from the front
  "front-rotation-cost": [
    {
      question: "What's the real goal with rotations in F2L?",
      options: [
        "Never rotate",
        "Stop rotating in the middle of looking; rotate only when it's genuinely the better option",
        "Rotate before every pair",
        "Only rotate with y2",
      ],
      answer: 1,
      why: "The fastest solvers still rotate sometimes. What costs time is rotating while you're tracking pieces, which resets your lookahead.",
    },
  ],
  "front-back-slots": [
    {
      question: "A front-right pair goes in with R U R'. What's the back-right equivalent?",
      options: ["R U' R'", "R' U R", "L U L'", "R2 U R2"],
      answer: 1,
      why: "R' U R has the same shape with R' lifting the back-right slot instead of the front one.",
    },
  ],
  "front-f-moves": [
    {
      question: "When is an F move the right choice in F2L?",
      options: [
        "Always — it's shorter",
        "When it replaces a rotation or a long R/U sequence",
        "Never",
        "Only in the cross",
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
        "The right R and U sequence will still solve it",
        "No sequence of R, L, U and D moves can solve it; it needs an F or B turn, or a rotation",
        "It must go in the back slots",
        "It's a cube defect",
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
        "The bad one, to get it over with",
        "The good one — it's usually shorter and smoother",
        "Whichever is at the front",
        "Neither; rotate first",
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
        "A big new algorithm set",
        "Fixing small leaks: F2L pauses, the cross-to-pair join, slow last-layer cases, lockups",
        "A new cube",
        "More solves at full speed",
      ],
      answer: 1,
      why: "By 15 the big lessons are learned. What's left is several small leaks, and experienced advice points at F2L lookahead and efficiency before new sets.",
    },
  ],
  "fifteen-find-the-leak": [
    {
      question: "Why measure your leaks instead of trusting what feels slow?",
      options: [
        "Feelings are always wrong",
        "Memorable things like a slow PLL feel big; spread-out pauses don't, even when they cost more",
        "Measuring is quicker",
        "It isn't necessary",
      ],
      answer: 1,
      why: "Half a second of pausing over four pairs costs more than one rare slow PLL, but it's the PLL you remember. Timing each part shows the truth.",
    },
  ],
  "fifteen-two-weeks": [
    {
      question: "How long should you stick with one focus before judging it?",
      options: ["One session", "About two weeks, then retest", "A day", "Until your next PB"],
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
        "A second",
        "About a hundredth of a second",
        "A tenth of a second",
        "Nothing at all",
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
        "Yes, before full OLL",
        "Usually not — it's well over a hundred algorithms and full OLL is the better investment",
        "Yes, it's required for sub-10",
        "Only for one-handed",
      ],
      answer: 1,
      why: "Full edge-control systems are big and often awkward. A few free cases are worth taking, but full OLL gives more for the effort.",
    },
  ],
  // Method lessons: your first solve
  "beginner-know-cube": [
    {
      question: "Can a move ever put a corner where an edge was?",
      options: [
        "Yes, with the right algorithm",
        "No — every move keeps corners as corners and edges as edges",
        "Only with slice moves",
        "Only on the last layer",
      ],
      answer: 1,
      why: "Corners have three colours and edges two. Turns move pieces around, but never change a piece's type.",
    },
  ],
  "beginner-notation": [
    {
      question: "What does R' mean?",
      options: [
        "Turn the right face a half turn",
        "Turn the right face a quarter turn anticlockwise, as seen looking at it",
        "Turn the whole cube right",
        "Turn the left face",
      ],
      answer: 1,
      why: "A prime means anticlockwise, judged looking straight at that face. R2 would be a half turn.",
    },
  ],
  "beginner-first-layer": [
    {
      question: "When is the first layer really finished?",
      options: [
        "When the white face is all white",
        "When the white face is solved and each side's first-row colours match their centres",
        "When the cross is done",
        "When four corners are white",
      ],
      answer: 1,
      why: "An all-white face can still have its side colours wrong. Check the row around the edge against the centres before moving on.",
    },
  ],
  "beginner-first-solve": [
    {
      question: "From a yellow dot, what gives you the yellow cross on the beginner method?",
      options: [
        "The Sune",
        "Repeating F R U R' U' F' until the cross appears",
        "Any U turn",
        "The corner algorithm",
      ],
      answer: 1,
      why: "F R U R' U' F' moves from dot to L or line to cross; from a dot it takes more than one go.",
    },
  ],
  // Method lessons: CFOP foundation
  "cfop-cross": [
    {
      question: "Your crosses often take 10 or more moves. What does the lesson suggest?",
      options: [
        "Accept it",
        "After inspection, stop and rewrite the plan before starting — most good crosses are eight moves or fewer",
        "Turn faster",
        "Switch to a daisy",
      ],
      answer: 1,
      why: "Most good crosses are eight moves or fewer. Ten or more regularly means the plan can be improved before you start.",
    },
  ],
  "cfop-f2l": [
    {
      question: "What's every F2L case, at heart?",
      options: [
        "A named algorithm to memorise",
        "Bring the corner and edge together as a pair, then insert it",
        "Solve the edge, then the corner",
        "Rotate until it looks right",
      ],
      answer: 1,
      why: "Pair, then insert. Learning the motion lets you solve cases you've never seen.",
    },
  ],
  "cfop-2look-oll": [
    {
      question: "When should you start adding full OLL cases?",
      options: [
        "Before 2-look",
        "When 2-look is automatic, one high-frequency case at a time",
        "All 57 at once",
        "Never",
      ],
      answer: 1,
      why: "Build on an automatic 2-look, and add the cases that come up most first.",
    },
  ],
  "cfop-2look-pll": [
    {
      question: "In 2-look PLL, which comes first?",
      options: ["Edges", "Corners", "Either", "The final U turn"],
      answer: 1,
      why: "Corners first (headlights or not), then edges with U, H or Z perms, then the final turn.",
    },
  ],
  // Method lessons: refine the details
  "advanced-first-pair": [
    {
      question: "What does finding your first pair in inspection remove?",
      options: [
        "The need for a cross",
        "The pause right after the cross",
        "The OLL",
        "Nothing measurable",
      ],
      answer: 1,
      why: "If you already know the first pair when the cross finishes, there's no search, so no pause.",
    },
  ],
  "advanced-rotations": [
    {
      question: "How many rotations per F2L pair is usually too many?",
      options: ["Any at all", "More than one", "More than four", "None is too many"],
      answer: 1,
      why: "More than one per pair is usually avoidable with back-slot inserts and empty slots.",
    },
  ],
  "advanced-lookahead": [
    {
      question: "Why turn slower on purpose to build lookahead?",
      options: [
        "To rest your hands",
        "Lookahead is a seeing skill; slower turning lets your eyes get ahead of your hands",
        "It's required for sub-20",
        "Slower turning locks up less",
      ],
      answer: 1,
      why: "Your eyes need time to find the next pair. Slow turning gives it, and the habit then carries into faster solves.",
    },
  ],
  "advanced-last-layer": [
    {
      question: "When do sets like COLL and ZBLL start to help?",
      options: [
        "Right after the beginner method",
        "Only once F2L is already smooth",
        "Before full PLL",
        "Never",
      ],
      answer: 1,
      why: "Advanced last-layer sets add little while F2L is still the leak.",
    },
  ],
  // Seeing past the first pair
  "past-why": [
    {
      question: "Why does removing a half-second pause matter more at 10 seconds than at 20?",
      options: [
        "It doesn't — half a second is half a second",
        "It's a bigger share of the solve: 5% at ten seconds, 2.5% at twenty",
        "Pauses are longer at ten seconds",
        "Competitions judge it differently",
      ],
      answer: 1,
      why: "The same pause is a larger fraction of a faster solve, which is why removing pauses becomes most of the improvement near sub-10.",
    },
  ],
  "past-track": [
    {
      question: "In inspection, what's the realistic way to prepare the second pair?",
      options: [
        "Plan its full solution",
        "Track one of its pieces — ideally the corner — through your planned moves",
        "Ignore it until the first pair is in",
        "Solve it as part of the cross",
      ],
      answer: 1,
      why: "Planning a second pair's moves doesn't fit in fifteen seconds; knowing where its corner will be removes the search anyway.",
    },
  ],
  "past-practise": [
    {
      question: "How should you start practising second-pair tracking?",
      options: [
        "Straight away with 15-second inspection",
        "With unlimited inspection, checking your prediction after executing",
        "Only in competition",
        "By memorising scrambles",
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
        "9 with stops — the hands are faster",
        "6 with no pauses, usually",
        "They're always equal",
        "It depends on the cube",
      ],
      answer: 1,
      why: "Pauses cost more than the speed gains. The pace you can hold without stopping is the one that moves your average.",
    },
  ],
  "speed-algorithms": [
    {
      question: "Why practise last slot and last layer together from real scrambles?",
      options: [
        "It's more fun",
        "Algorithms then start from the grip they really start from in a solve, which is where regrips hide",
        "It trains the cross",
        "It's required for full OLL",
      ],
      answer: 1,
      why: "In a solve, an algorithm starts wherever your hands were after the last pair. Drilling from that position removes the regrip.",
    },
  ],
  // Practising near ten
  "near-measure": [
    {
      question:
        "Your solves vary by about a second. Which average can show a real one-tenth improvement?",
      options: [
        "An average of 5",
        "An average of 12",
        "An average of 100 or more",
        "Your best single",
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
        "Even more normal solves",
        "Blocks aimed at one skill, each with a drill and a measure",
        "A new method",
        "Stopping practice entirely",
      ],
      answer: 1,
      why: "Normal solves repeat existing habits, and near ten seconds those habits are the limit. Focused blocks change them.",
    },
  ],
  "near-warm-up": [
    {
      question: "Why warm up before timing solves you'll judge yourself by?",
      options: [
        "To avoid injury only",
        "Early solves are usually slower, so measuring them hides your real level and makes days hard to compare",
        "Warm-ups are required by the WCA",
        "It makes the cube faster",
      ],
      answer: 1,
      why: "A few warm-up minutes make your averages comparable from day to day, which is the whole point of measuring.",
    },
  ],
};
