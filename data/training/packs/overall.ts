import { SOURCES } from "../sources";
import type { AspectPack } from "../types";

export const turningTechnique: AspectPack = {
  id: "turning-technique",
  aspectId: "turning_speed",
  title: "Hands that do not get in the way",
  summary: "Finger tricks, regrips and why calm turning is faster than hard turning.",
  levels: ["sub120", "sub45", "sub20"],
  why: "While you are slower than about a minute, clumsy turning costs you on every move: each turn is a whole hand movement, with a regrip between most of them. Once you are faster than that, the problem changes: it becomes lockups from turning harder than you can control, and regrips on the way into your algorithms.",
  lessons: [
    {
      id: "turning-what-a-fingertrick-is",
      title: "What a finger trick actually is",
      takeaway:
        "Turning a layer with a fingertip or a small wrist turn while your grip on the cube stays put.",
      minutes: 4,
      body: [
        "A finger trick is a way of turning a layer without letting go of the cube — pushing the U layer with the right index finger, turning R with a small twist of the right wrist while the thumb stays on the front, and so on. The cube stays in the same place in your hands the whole time.",
        "The saving is not that the finger is faster than the arm. It is that the cube does not move, so the next turn can start immediately and your eyes do not have to re-find anything. A solve done with finger tricks and a solve done by picking the cube up for every turn can have the same move count and differ by thirty seconds.",
        "The ones to get first, in order of value: U as a push with the right index finger and U' as a push with the left index finger; R and R' as turns of the right wrist, with the thumb resting on the front face; and U2 as a double flick, index then middle finger, or one flick from each hand, rather than one big rotation. Add F as a push with your right index finger or thumb rather than a turn of the wrist; F and F′ have several good fingertricks, so try a couple and keep the one that leads best into the next move. Between them those cover most of what a CFOP solve does.",
        "Hold the cube so it is supported rather than gripped. A common description is thumbs on the front, the other fingers around the back, with the cube resting rather than clamped — clamping makes every turn fight you.",
      ],
      checkpoint: "You can do R U R' U' six times without the cube moving in your hands.",
    },
    {
      id: "turning-regrips",
      title: "Regrips are the hidden cost",
      takeaway:
        "Count the times your hands reposition. Most of them were a choice made when you learned the algorithm.",
      minutes: 4,
      body: [
        "A regrip is any moment your hands have to let go and take hold again. It costs about as much as a turn, it breaks your rhythm, and — like a rotation — it interrupts whatever your eyes were doing.",
        "The reliable way to find your own is to film a solve and watch it at quarter speed. You will see repositioning you have no memory of. Almost all of it comes from the algorithm or solution you chose, not from necessity.",
        "The fix is usually a different solution rather than better hands. When you have two ways to solve something, pick the one your hands do in a single grip. Over a whole solve this is worth more than raising your raw turning speed.",
        "One deliberate exercise for this: practise your algorithms starting from unusual hand positions, the way they actually arrive at the end of a real F2L rather than the way they arrive in a drill. Having two fingertrick variants for a case means you can take whichever one your hands are already set up for.",
      ],
      checkpoint: "You can execute your most-used algorithms without repositioning your hands.",
    },
    {
      id: "turning-calm",
      title: "Calm is faster than hard",
      takeaway:
        "Above a certain point, turning harder produces lockups that cost more than the speed gains.",
      minutes: 3,
      body: [
        "There is a strong temptation to treat turning speed as effort: push harder, move faster. Past a fairly low threshold this stops working, because turns that do not complete before the next one starts cause the cube to catch, and a lockup costs more than several turns.",
        "The advice from the top of the sport is consistently the opposite of what it looks like: turn calmly and accurately, keep the hands near neutral, and cut out exaggerated movement. Speed comes from not wasting motion rather than from force.",
        "This matters most when you raise your speed. The right way to get faster is to find the fastest speed at which your turning stays clean, live there for a while, and let it creep up. Practising above that speed trains inaccuracy.",
        "There is a real hardware component too, but it is a threshold rather than a gradient. A modern magnetic speedcube that turns easily makes fast turning possible; past that, the difference between good cubes is preference, and if you are locking up on basic triggers on a decent cube, it is the turning.",
      ],
      checkpoint: "You have a speed at which you never lock up, and you know what it is.",
    },
    {
      id: "turning-both-hands",
      title: "Two hands, not one and a spare",
      takeaway:
        "If every awkward case gets rotated to the right hand, you are paying a rotation to avoid learning a left-hand trigger.",
      minutes: 3,
      body: [
        "Most people are heavily right-hand biased, because the first algorithms they learn are right-handed. The cost shows up as rotations: a case that would be easy with a left-hand trigger gets turned round instead.",
        "The exercise is blunt and effective: solve with a rule that you may not use R moves at all for a session. You will be slow, and you will discover that your left hand can do everything your right one can, just with fewer reps behind it.",
        "You do not need perfect ambidexterity. You need enough left hand that you stop rotating to avoid it, which is a much lower bar and takes a few weeks of occasional practice.",
      ],
    },
    {
      id: "turning-full-sets",
      title: "Fingertricks for the full sets",
      takeaway:
        "Fingertricks settle in fast and are slow to retrain, so choose them on purpose while a new algorithm is still slow.",
      minutes: 4,
      body: [
        "Full PLL, and later full OLL, means dozens of new algorithms over a few months, each of which you will do thousands of times. Whatever your fingers happen to do in the first few days tends to stick, and changing it later costs a round of relearning, so a minute spent choosing how to turn each new case is cheap.",
        "Where a move can be done either way, try the push first. A push is a finger curling in and driving the layer with it; a pull hooks the layer and drags it back. Pushes are usually quicker and more comfortable, so settle for a pull only where the push would cost you a regrip.",
        "Many of these algorithms are built from triggers you already own: R U R' U', R U R', the sledgehammer R' F R F'. Keep each trigger as one movement in one grip, and learn a new algorithm as a short string of those chunks rather than a long list of turns. The T perm, R U R' U' R' F R2 U' R' U' R U R' F', opens with R U R' U' and is only a few chunks after that.",
        "Your hands will not always arrive in the same place, so for the algorithms you use most, learn a second way to do the awkward moves: the closing F' of the T perm can come from the right thumb or from the left index finger. And practise the way in, not just the algorithm. In a solve each case turns up straight after the step before it (OLL after the last pair, PLL after OLL), with your hands wherever that step left them, so finish it and go into the algorithm in one motion. Wherever you have to stop and reposition, that regrip is part of the case.",
        "Give the left-hand-heavy algorithms extra reps on purpose. The A perms, the E perm and the G perms usually give the left hand D or L turns to do, and people who only drill right-handed algorithms find those become the slowest cases in the set.",
      ],
      checkpoint:
        "You can go into your newest algorithms straight from the step before them without stopping to move your hands.",
    },
  ],
  drills: [
    {
      id: "turning-trigger-reps",
      title: "Trigger reps",
      purpose:
        "The basic triggers appear hundreds of times a session. Making them automatic pays back everywhere at once.",
      rules: [
        "R U R' U' repeated six times returns the cube to solved. Do it as one smooth run, not six separate algorithms.",
        "Then the sledgehammer R' F R F' and the left-hand L' U' L U, which also come back to solved after six.",
        "R U' R' and F' U' F come back sooner, after four, so run those in sets of four.",
        "Watch the cube in your hands: if it shifts, you are regripping. R and R' are wrist turns and U is an index flick, and your grip should not change.",
      ],
      dose: "Two minutes as a warm-up, every session.",
      signal: "Your turns-per-second measurement rises with no increase in effort.",
      exerciseId: "tps_test",
    },
    {
      id: "turning-film-yourself",
      title: "Film and count",
      purpose:
        "Regrips and lockups are invisible from inside the solve. A slow-motion recording is the only honest view.",
      rules: [
        "Record one ordinary solve from above.",
        "Play it back at quarter speed and count two things: regrips, and moments the cube catches.",
        "Pick the single most repeated one and find a solution that avoids it.",
      ],
      dose: "One solve, once a fortnight.",
      signal: "The count falls. It is a slow number to move and a reliable one.",
      untimed: true,
    },
    {
      id: "turning-no-r-moves",
      title: "No R moves",
      purpose:
        "Forces the weaker hand to do real work, which normal solving always lets you avoid.",
      rules: [
        "For the whole session, solve F2L without R or R'; use L, F and U instead. Do the cross and the last layer as normal.",
        "Frustrating by design. Count a round for each solve, and don't time them.",
        "Note which cases you had no left-handed answer for.",
      ],
      dose: "One session a fortnight.",
      signal: "You stop rotating the cube to bring cases to your right hand.",
      untimed: true,
    },
    {
      id: "turning-two-gen",
      title: "Two-gen and last-pair runs",
      purpose:
        "Two-gen means turning only two faces, R and U. Looping those, then running the last pair into OLL, builds clean turning where most of it happens, without the thinking of a full solve in the way.",
      rules: [
        "Loop an algorithm made only of R and U turns until the cube is back where it started: Sune (R U R' U R U2 R') six times, or the Ua perm (R U' R U R U R U' R' U' R2) three times.",
        "Turn at the fastest speed that stays clean. If a loop locks up, start it again a little slower.",
        "Then use the Last pair + OLL test's scrambles: put the last pair in and go straight into OLL in one movement, with no stop to regrip between them.",
        "Note each join where your hands have to move, and try a different insert or fingertrick there next time.",
      ],
      dose: "Five minutes of loops and ten last-pair runs, three sessions a week.",
      signal:
        "The loops feel like one motion, and your Last pair + OLL test time gets closer to your Single pair and OLL test times added together.",
      exerciseId: "ls_oll",
    },
  ],
  mistakes: [
    "Turning harder to go faster, which produces lockups that cost more.",
    "Practising at a speed above the one you can control.",
    "Blaming the cube for lockups on ordinary triggers.",
    "Rotating to avoid the left hand, every solve, forever.",
    "Drilling algorithms from a comfortable grip and never from the way they arrive in a solve.",
  ],
  sources: [SOURCES.fingerTricks, SOURCES.turningSpeed, SOURCES.subMinute, SOURCES.getFaster],
};

export const practicePlan: AspectPack = {
  id: "practice-plan",
  aspectId: "full_solve",
  title: "Practice that actually moves the average",
  summary:
    "How to structure a session, why half of it should not be timed, and what to do on a plateau.",
  levels: ["sub120", "sub30", "sub25"],
  why: "Most practice is doing timed solves and hoping. That maintains what you have; it rarely builds anything new, because full-speed solving lets you avoid exactly the things you are worst at.",
  lessons: [
    {
      id: "practice-two-kinds",
      title: "Two kinds of practice, about half and half",
      takeaway:
        "Deliberate practice builds new skill. Timed solving turns it into something automatic. You need both.",
      minutes: 4,
      body: [
        "It is worth separating practice into two kinds. Deliberate practice is conscious work on one specific thing: learning a case, drilling a trigger, doing slow solves, analysing a solve you recorded. Repetitive practice is timed solves and averages at full speed, where you are not thinking about technique at all.",
        "Both are necessary and they do different jobs. Deliberate practice adds skills you did not have. Repetitive practice takes a skill you have consciously and makes it subconscious, which is the only way it survives contact with a real solve.",
        "A reasonable balance is about half and half, shifting towards more timed solving as you get faster and have fewer genuinely new things to learn. If you are unhappy with one part of your solve, shift the deliberate half towards it.",
        "The common failure is doing a hundred timed solves and calling it practice. It is practice, but it is the maintenance kind, and it is why people plateau while still putting in the hours.",
      ],
      checkpoint: "You can say what the deliberate half of your last session was working on.",
    },
    {
      id: "practice-session-shape",
      title: "What a session looks like",
      takeaway: "Warm up, work on one thing, do timed solves, look at what happened.",
      minutes: 4,
      body: [
        "A shape that works: a few minutes of warm-up — trigger reps, a few untimed solves — then one focused block on a single weakness, then a set of timed solves, then a short look at what the timed solves showed.",
        "The important word is single. A session that works on lookahead, then OLL, then the cross, works on nothing. Keep the same focus for several sessions before choosing the next one; skills take longer than a session to move.",
        "The review at the end does not need to be elaborate. Which solves were slow, and what was common to them? Your worst solves usually share a cause, and that cause is your next focus.",
        "Volume matters most at the beginning. While you are slower than about a minute, simply solving a lot — twenty or thirty a day rather than a handful — is most of the improvement, because everything is still becoming familiar.",
      ],
    },
    {
      id: "practice-plateau",
      title: "Plateaus, and what they are not",
      takeaway:
        "Long flat stretches are normal. They are usually a sign to change what you practise, not how much.",
      minutes: 4,
      body: [
        "Improvement is not smooth. It goes in steps, with flat stretches that can last months, and then a jump that arrives over a weekend. This is true at every level and it is worth knowing in advance so that the flat stretch does not read as failure.",
        "When a plateau is genuine rather than just a flat stretch, it almost always means the thing that was limiting you has changed and your practice has not. The classic case: you got faster by learning algorithms, algorithms are no longer the limit, and you are still learning algorithms.",
        "The most common actual answer is lookahead. If there is any consistent pause in your F2L, even half a second between pairs, that is where the time is, and no amount of the practice that got you here will remove it.",
        "And there is a genuinely counterintuitive one: practising too much. Several strong solvers describe taking a week off and coming back to a personal best. If you have been grinding without movement, a break is a legitimate thing to try, and it costs nothing to test.",
      ],
      checkpoint:
        "You know which limit you are currently working against, and it is not the one from six months ago.",
    },
    {
      id: "practice-measure",
      title: "Measure the parts, not just the total",
      takeaway: "An average tells you that you are slow. Splits tell you where.",
      minutes: 3,
      body: [
        "The overall average is a score, not a diagnosis. Two solvers averaging twenty seconds can need completely different work: one with a five-second cross and one who loses four seconds in the last layer.",
        "So the useful measurements are the parts: how long the cross takes, how long F2L takes, how much is lost between them. That is exactly what the tests in this app are for, and the reason they are isolated is that a stage measured on its own tells you something a whole solve cannot.",
        "Compare typical solves rather than personal bests. A best single is a lucky scramble and a lucky recognition; it tells you almost nothing about what to practise. The median, and the average of fifty, are the numbers that move when you improve.",
      ],
    },
  ],
  drills: [
    {
      id: "practice-one-focus",
      title: "One focus, five sessions",
      purpose:
        "Skills move on a timescale of weeks. Changing focus every session guarantees none of them get there.",
      rules: [
        "Choose one weakness. Write it down.",
        "For the next five sessions, the deliberate half of every session is that thing and nothing else.",
        "Keep the timed half normal, so you can see whether it transfers.",
      ],
      dose: "Five sessions, then reassess.",
      signal: "The measurement for that part improves, and the overall average follows it later.",
      untimed: true,
    },
    {
      id: "practice-worst-solves",
      title: "Read your worst solves",
      purpose:
        "Your slow solves have a common cause, and finding it is faster than guessing what to work on.",
      rules: [
        "Do an average of twelve. Pick the three slowest.",
        "For each, write down what went wrong: a case you did not know, a pause, a lockup, a bad cross.",
        "Do it again next session. The repeated entry is your next focus.",
      ],
      dose: "Once a session, two minutes.",
      signal: "The repeated cause changes over time, which means you fixed the last one.",
    },
    {
      id: "practice-take-a-break",
      title: "Take a week off",
      purpose:
        "Counterintuitive and widely reported to work when nothing else has. The only cost is a week.",
      rules: [
        "If you have been practising steadily with no movement for a month or more, stop entirely for a week.",
        "No solves, no drills, no trainers.",
        "Come back and do an average of twelve before doing anything else.",
      ],
      dose: "Once, when you are stuck.",
      signal: "Times often come back the same or better, and the block is gone.",
      untimed: true,
    },
  ],
  mistakes: [
    "Doing only timed solves and calling it practice.",
    "Changing focus every session.",
    "Judging progress by personal bests instead of averages.",
    "Practising the thing that used to be your limit.",
  ],
  sources: [
    SOURCES.practiceTips,
    SOURCES.deliberatePractice,
    SOURCES.practiceSession,
    SOURCES.solveSplits,
    SOURCES.cubicleImprove,
    SOURCES.getFaster,
  ],
};

export const consistency: AspectPack = {
  id: "consistency",
  aspectId: "consistency",
  title: "Fewer disasters",
  summary: "Why your average is worse than your typical solve, and what to do about the tail.",
  levels: ["sub30", "sub25", "sub20", "sub15"],
  why: "Most people's average is dragged up by a handful of solves that went wrong, not by the ordinary ones being slow. Removing the bad tail is usually easier than making the good solves faster.",
  lessons: [
    {
      id: "consistency-where-the-spread-is",
      title: "Where the spread comes from",
      takeaway:
        "Three causes: a case you do not really know, a lockup, and a bad decision under pressure.",
      minutes: 4,
      body: [
        "A solve that takes half again as long as your usual one almost always has a specific cause, and there are not many candidates. An algorithm you half-know arrived. Something locked up and you had to recover. Or you saw something unfamiliar and froze while deciding.",
        "All three are addressable, and none of them is addressed by solving faster. The half-known algorithm needs reps; the lockup needs calmer turning; the freeze needs the recognition work that makes unfamiliar cases familiar.",
        "The practical move is to stop treating slow solves as noise. Write down what happened. Within a couple of sessions the same one or two causes will have appeared repeatedly, and then you know what to fix.",
      ],
      checkpoint:
        "You can name the most common cause of your slow solves, from notes rather than memory.",
    },
    {
      id: "consistency-recovery",
      title: "Recovering without panicking",
      takeaway: "A mistake costs a second. Reacting to it costs the rest of the solve.",
      minutes: 3,
      body: [
        "When something goes wrong mid-solve, the instinct is to speed up and make the time back. This reliably makes things worse: fast turning after a mistake produces another lockup, and the solve that was going to be two seconds slow becomes six.",
        "The useful habit is to finish the solve at your normal pace. You cannot recover the second, and the attempt costs more than the second did. This sounds obvious and is genuinely hard, which is why it is worth practising deliberately rather than assuming you will do it.",
        "The same applies to a bad cross or an unlucky scramble. The solve is what it is; the next one is a new scramble.",
      ],
    },
    {
      id: "consistency-pressure",
      title: "Solving under pressure is its own skill",
      takeaway: "If you compete, practise the conditions, not just the solves.",
      minutes: 3,
      body: [
        "Solving alone at a desk and solving with a judge watching and a stackmat in front of you are different activities. People routinely average five to twenty per cent slower at their first competition than at home, a second or two at twelve seconds, and the gap closes with exposure rather than with speed.",
        "If competitions matter to you, practise in the format: full inspection every solve, a proper stop, averages of five rather than endless singles, and — where you can — with someone watching. The last-layer lesson before this one covers keeping your fingertricks simple for the same reason.",
        "The pressure part is a competition skill; consistency at home is worth having either way. For how a competition round works and how to prepare, the Competing unit is in the Library.",
      ],
    },
  ],
  drills: [
    {
      id: "consistency-log-the-bad-ones",
      title: "Log the bad ones",
      purpose:
        "The tail has causes, and they repeat. Writing them down turns a vague feeling into a specific fix.",
      rules: [
        "Every solve noticeably slower than your usual, add a note saying why.",
        "Use the note field on the solve rather than a separate list, so it stays with the solve.",
        "Review after twenty solves and count the causes.",
      ],
      dose: "Continuous. It costs a few seconds a solve.",
      signal: "One cause dominates, you fix it, and a different one takes its place.",
      untimed: true,
    },
    {
      id: "consistency-ao12-only",
      title: "Averages, not singles",
      purpose:
        "Chasing singles trains risk-taking, which is exactly what produces the tail you are trying to remove.",
      rules: [
        "Do a session of averages of twelve and record only the average.",
        "Do not look at the individual times until the average is done.",
        "Aim to bring your average closer to your typical (middle) solve by cutting the slow ones, not to lower your best.",
      ],
      dose: "One session a week.",
      signal: "The gap between your typical solve and your average narrows.",
    },
    {
      id: "consistency-finish-calmly",
      title: "Finish calmly",
      purpose:
        "Trains the response to a mistake, which is the thing that turns a small loss into a large one.",
      rules: [
        "Solve normally. When something goes wrong, deliberately keep your pace the same to the end.",
        "Do not speed up to make the time back. Note afterwards whether you managed it.",
      ],
      dose: "Ten solves a session for a week.",
      signal:
        "Your worst solves get closer to your typical ones, even though the mistakes still happen.",
    },
  ],
  mistakes: [
    "Treating slow solves as bad luck rather than looking at what caused them.",
    "Speeding up after a mistake.",
    "Chasing a personal best, which trains exactly the risk-taking that widens the spread.",
    "Only ever practising alone, then being surprised by a competition.",
  ],
  sources: [SOURCES.practiceTips, SOURCES.turningSpeed, SOURCES.cubicleImprove, SOURCES.limits],
};
