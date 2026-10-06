import { SOURCES } from "../sources";
import type { LessonQuiz, LevelPack } from "../types";

/*
 * Why practice stops working between 15 and 10 seconds: what an average of
 * five rewards, why a PB isn't a level, why automatic skills stop changing,
 * how order and sleep decide what sticks, and where attention goes under
 * pressure. Every number about averages comes from a simulation on SolveLab's
 * own averaging code, and every WCA rule from the regulations
 * (tests/unit/night-practice-structure.test.ts).
 */

export const beyondThePlateau: LevelPack = {
  id: "beyond-the-plateau",
  title: "Beyond the plateau",
  summary:
    "What an average of five rewards, why your PB isn't your level, why automatic skills stop improving, and where attention goes under pressure.",
  levels: ["sub15", "sub12"],
  why: "Below fifteen seconds, practice that used to work stops working for reasons you can't see from the timer. The skills you rely on run on autopilot, and autopilot repeats itself rather than improving. Short averages wobble by as much as real progress does, so good and bad weeks mislead. And under pressure, attention drifts onto the mechanics that run best when left alone. Each has a mechanism, and each mechanism says what to change.",
  lessons: [
    {
      id: "beyond-ao5",
      title: "What an average of five rewards",
      takeaway:
        "The trim drops your worst solve, so an Ao5 is decided by the middle three, and the second bad solve is the one that costs.",
      minutes: 5,
      body: [
        "In a WCA average of five, your best and worst attempts are dropped and the result is the mean of the middle three. One DNF can be the dropped worst; a second makes the whole average a DNF. Most timers at home, SolveLab's included, trim the same way: one solve off each end of an Ao5 or an ao12, and five off each end of an ao100.",
        "That trim changes the arithmetic of bad solves. One disaster in a round costs almost nothing, because it is the solve that gets dropped. Only a second one counts. Take a 12-second solver whose solves spread by about 1.2 seconds, and who has a four-second disaster in one solve out of ten. Halving the disasters improves their expected Ao5 by only about 0.14 seconds, because most rounds never had more than one to drop: two or more turn up in about one round in twelve. Taking 0.3 seconds off every ordinary solve improves it by the full 0.3.",
        "So in an Ao5 the main lever is the typical solve, and the tail lever is the chance of two bad solves in one round. A long average is different. An ao100 drops only five solves at each end, so at one disaster in ten about half of them still count, and a single DNF in a mean counts in full. The tail matters again there, which is why the bad-solve work in Fewer disasters still pays.",
        "The trim also tells you when risk is cheap. Before anything has gone wrong in a round, a risky solve that fails will probably be the one dropped. After one bad solve, the next failure counts in full. And a 3x3 round with a cutoff opens as a best of two: only if one of your first two attempts beats the cutoff do you get the other three. If the cutoff is near your level, make the first attempt your safest normal solve.",
      ],
      checkpoint:
        "You can say why a risky solve costs more after a bad one than before it, and what a cutoff changes.",
    },
    {
      id: "beyond-pb",
      title: "Your PB is not your level",
      takeaway:
        "A PB average is the luckiest of many draws; expect the next round to be slower, and set goals on the ao100 and median.",
      minutes: 4,
      body: [
        "Every average is a sample, and samples wobble. With five solves the wobble is large: for a 12-second solver whose solves spread by about 1.2 seconds, the Ao5 itself spreads by about 0.57 seconds, roughly half the solve-to-solve spread. About one round in five lands half a second or more under that solver's true level, and about one in five lands half a second over it, with nothing about their skill changing.",
        "A PB average is the best of all those rounds, so it is a lucky draw by definition. Do fifty Ao5s at that level and the best one is expected around 10.7 seconds, about 1.3 seconds under the level that produced it. The round after a PB is expected to be slower, not because you got worse but because the PB came from the fast edge of your range. Statisticians call this regression to the mean, and it is why a PB is so often followed by what feels like a slump.",
        "The same arithmetic explains part of the home-to-competition gap. Feliks Zemdegs points out that with only a few official solves you are unlikely to get near your best times, compared with the unlimited solves at home. A competition Ao5 is one draw from your range; your home PB is the best of hundreds.",
        "So treat a PB average as the top of your range, not as where you are. Set goals and judge plateaus on the ao100 and the median, as Practising near ten says. These figures assume solves spread evenly around your level; real solves have a longer slow tail, so take them as the right size rather than exact.",
      ],
      checkpoint:
        "You know your ao100 and median, and you can say how far under them a lucky Ao5 is likely to land.",
    },
    {
      id: "beyond-autopilot",
      title: "Why automatic skills stop improving",
      takeaway:
        "Autopilot repeats a skill instead of correcting it; push execution past comfortable to find what breaks, but slow F2L down instead.",
      minutes: 5,
      body: [
        "Psychologists Paul Fitts and Michael Posner described three stages of learning a skill. In the first you think about every step and make many mistakes; in the second the mistakes thin out; in the third the skill runs on autopilot, with little conscious attention. At sub-15 most of what you do is in that third stage: the cross, your algorithms, the common F2L inserts.",
        "Autopilot is what lets you solve without thinking, and it is also why a skill stops changing. Nothing is watching it, so nothing corrects it, and ordinary solves repeat it at the same pace. Joshua Foer called this the OK plateau. His account of how experts get past it is that they practise outside their comfort zone and study themselves failing, rather than repeating what already works.",
        "On a cube that means two different pushes, depending on what limits the part. Where the limit is execution, like an algorithm you know cold or a last layer with no thinking left in it, run it faster than comfortable, accept that some reps go wrong, and look at what breaks: a regrip, a lockup, a finger that misses. The breakage shows exactly where the automatic version is weak.",
        "Where the limit is lookahead, as in most F2L at this level, pushing the pace does nothing for you: your hands only reach the next pause sooner. There the push goes the other way: slower, pause-free F2L at a pace you raise only once it holds, as in the metronome ladder in Turning speed you can use. Your splits or a reconstruction tell you which limit you have.",
      ],
      checkpoint:
        "You can name one part of your solve limited by execution and one limited by lookahead, and which push each one gets.",
    },
    {
      id: "beyond-mixed-order",
      title: "Mixed order beats blocks, and sleep does part of the work",
      takeaway:
        "Drill cases in random order and judge them the next day, cold: blocked reps feel better and stick worse.",
      minutes: 4,
      body: [
        "There are two ways to drill a set of cases. Blocked practice runs one case many times, then the next. Random practice mixes them, so every rep is a different case. Blocked feels far better during the session: by the tenth rep of the same case it is smooth. In a classic experiment by Shea and Morgan, though, people who practised in random order retained the skill better afterwards, and transferred it better to new versions of the task, than people who practised in blocks.",
        "One common explanation is retrieval. In a block you recall the case once and then repeat it; in random order every rep makes you recognise the case and fetch the right response from scratch. That is the exact job a solve gives you, where cases arrive unannounced after F2L. Blocked drilling trains a smooth repeat of something you already had in mind, which a solve never asks for.",
        "Sleep does part of the learning too. In a study by Walker and colleagues, people who learned a finger-tapping sequence were about 20 per cent faster after a night's sleep, with no loss of accuracy, while the same length of time awake brought no significant gain. That is about as close as a lab task gets to drilling an algorithm.",
        "So for anything new, short random-order sessions on several days beat one long blocked one, and the end of a session is the wrong moment to judge them. Judge the next day, before you warm up: that is what has stuck. This builds on Making them stick, in Learning OLL without drowning, which decides which cases come back; this decides the order they come back in.",
      ],
      checkpoint:
        "You drill new cases mixed, never in blocks, and you check them the next day before warming up.",
    },
    {
      id: "beyond-attention",
      title: "Where attention goes under pressure",
      takeaway:
        "Thinking about your fingers harms a skill you already have; a practised routine gives attention a job, so keep it on the cube.",
      minutes: 4,
      body: [
        'Writing about competitions, Feliks Zemdegs points to overthinking in official solves, "paralysis by analysis", and tries to make the whole process automatic instead. A lab finding explains why overthinking hurts. Beilock and colleagues had experienced golfers putt while doing a second, distracting task, or while attending to each step of their putting stroke. They putted better when distracted. Experienced footballers dribbling with their stronger foot showed the same, and novices showed the opposite: step-by-step attention helped the people still learning.',
        "The reason is the autopilot from Why automatic skills stop improving. A well-learned skill runs best unwatched, and attending to it step by step hands it back to the slow, conscious version you used while learning. When a solve matters, it is tempting to send attention exactly there: to your fingers, your grip, whether this algorithm is about to lock up.",
        "A pre-performance routine is a fixed set of thoughts and actions before every attempt. A meta-analysis by Rupprecht, Tran and Gröpel of 112 effect sizes found moderate-to-large benefits in experimental studies, both with and without pressure, whatever the type of routine and whatever the athletes' level; the effect was smaller in simple before-and-after studies. Feliks keeps his loose and simple, and stresses that it has to be practised at home until it is automatic, not invented on the day.",
        "For a solve, inspection is the routine: the same order every time, such as cross plan, then the first pair, then one cue word, then start. Once the timer runs, attention goes to what the cube shows, the next pair, rather than to your hands. Then the routine is the thing your mind is busy with when the pressure arrives.",
      ],
      checkpoint:
        "You have one inspection routine, the same order every solve, and you can say where your attention goes once the timer starts.",
    },
  ],
  drills: [
    {
      id: "beyond-overspeed",
      title: "Overspeed on the last layer",
      purpose:
        "Pushes an automatic execution skill past its comfortable pace, so its weak spots show, without touching F2L lookahead.",
      rules: [
        "Take your usual average on this last-layer test as your normal pace.",
        "Run reps faster than that, fast enough that some of them go wrong.",
        "After every slip, note what broke: a regrip, a lockup, a misread case or a finger that missed.",
        "Finish with five reps at your normal pace. Never use this drill on F2L.",
      ],
      dose: "Eight minutes of fast reps, then five at normal pace, for five sessions.",
      signal:
        "Your slips gather on one or two causes you can fix, and your normal-pace average on this test falls. If normal-pace reps start going wrong more often, stop.",
      exerciseId: "oll_pll_only",
    },
    {
      id: "beyond-random-order",
      title: "Mixed order, judged tomorrow",
      purpose:
        "Drills cases in the random order solves deal them, and judges what was learned by what survives the night.",
      rules: [
        "Drill PLL from this test's scrambles, which come in random order. Never run one case over and over.",
        "Write down the average of your last round of the session.",
        "Tomorrow, do one round first thing, before any warm-up, and compare it with that number.",
      ],
      dose: "Ten minutes a day for a week.",
      signal:
        "Your cold first round of the day closes in on the previous day's last round, and both fall over the week.",
      exerciseId: "pll_only",
    },
    {
      id: "beyond-middle-three",
      title: "Play for the middle three",
      purpose:
        "Trains for what an average of five counts: the typical solve, and never two bad solves in one round.",
      rules: [
        "Do rounds of five. For each, write down the average and whether two or more solves were well over your usual.",
        "After one bad solve, keep your normal pace and your normal choices: the trim has already absorbed it.",
        "Try anything risky, like a new x-cross, only before something has gone wrong in the round.",
      ],
      dose: "Ten rounds, twice a week.",
      signal:
        "Fewer rounds have two bad solves, and your averages of five fall along with your median.",
    },
    {
      id: "beyond-routine",
      title: "Lock in a routine",
      purpose:
        "Builds an inspection routine automatic enough to hold your attention when a solve matters, so it isn't spent on your fingers.",
      rules: [
        "Turn on WCA inspection on the main timer and use it for every solve.",
        "Inspect in the same order every time: cross plan, first pair, one cue word, start.",
        "Once the timer runs, keep your attention on the next pair, not on your hands.",
        "Count inspection penalties, and compare the first solve of each session with that session's median.",
      ],
      dose: "Every timed solve for two weeks; count a round here for each day you kept to it.",
      signal:
        "Inspection penalties drop to none, and your first solve of a session lands closer to that session's median.",
      untimed: true,
    },
  ],
  mistakes: [
    "Treating a PB average as your level, then reading the next round as a slump.",
    "Playing safe after one bad solve in an Ao5, when the trim has already dropped it.",
    "Drilling cases in blocks and judging them by how the session ended.",
    "Pushing turning speed in F2L, where lookahead is the limit.",
    "Thinking about your fingers during the solves that matter most.",
  ],
  sources: [
    SOURCES.wcaRegulations,
    SOURCES.averageWiki,
    SOURCES.compPerformance,
    SOURCES.okPlateau,
    SOURCES.slowF2l,
    SOURCES.contextualInterference,
    SOURCES.sleepMotorSkill,
    SOURCES.skillFocusedAttention,
    SOURCES.routinesMeta,
  ],
};

/** One question per lesson, to merge into LESSON_QUIZZES. */
export const beyondThePlateauQuizzes: Record<string, LessonQuiz[]> = {
  "beyond-ao5": [
    {
      question:
        "Your first solve of an Ao5 was a disaster. What does that change about the next four?",
      options: [
        "Play safer from now on, so a second disaster can't happen",
        "Go faster for the rest, since the average is already ruined",
        "Nothing yet: it's the dropped one, but a second would count",
        "Treat solve two as the first and restart the round in your head",
      ],
      answer: 2,
      why: "The trim drops your worst attempt, so one disaster is already absorbed. Keep solving normally; what you can't afford now is a second bad solve, because that one counts in full.",
    },
  ],
  "beyond-pb": [
    {
      question:
        "You set a PB Ao5 a second under your ao100, then the next three rounds are near your ao100. What happened?",
      options: [
        "Nothing: the PB was a lucky draw, and these rounds are your level",
        "You lost form right after the PB and need to find it again",
        "Your ao100 is out of date, and the PB shows your real level now",
        "The PB scrambles were easy, so that average shouldn't really count",
      ],
      answer: 0,
      why: "A PB average is the best of many rounds, so it comes from the fast edge of your range. The rounds after it fall back towards your true level: regression to the mean, not a slump.",
    },
  ],
  "beyond-autopilot": [
    {
      question:
        "Your PLLs are automatic and haven't got faster in months. Your F2L has pauses between pairs. What's the right push for each?",
      options: [
        "Turn faster everywhere, since turning speed is the common limit",
        "Slow both down until every move is deliberate and conscious again",
        "Learn new PLL algorithms, and leave F2L to ordinary timed solves",
        "PLL faster than comfortable, studying slips; F2L slow, no pauses",
      ],
      answer: 3,
      why: "Automatic execution only changes when pushed out of its comfortable pace so its weak spots show. F2L at this level is limited by lookahead, where faster hands only reach the pause sooner, so it gets slower, pause-free work instead.",
    },
  ],
  "beyond-mixed-order": [
    {
      question:
        "You drilled each new PLL ten times in a row and the last reps felt smooth. When should you judge whether they're learned?",
      options: [
        "Right then, while the reps are still smooth",
        "Tomorrow, cold, in random order before warming up",
        "After another blocked session, once they're automatic",
        "In a week's averages, whatever order you drilled them in",
      ],
      answer: 1,
      why: "Blocked reps feel smooth because the case is already in mind, which says little about retention. What sticks shows up the next day, and recognising cases in random order is what a solve asks for.",
    },
  ],
  "beyond-attention": [
    {
      question:
        "It's the last solve of a competition round and you need it. Where should your attention be?",
      options: [
        "On your fingertricks, so that nothing locks up under the pressure",
        "On the time you need, so you know exactly how hard to push",
        "On your inspection routine, then on the next pair once you start",
        "On turning a little slower than usual, to keep the solve safe",
      ],
      answer: 2,
      why: "Attending step by step to a skill you already have makes it worse; it hands it back to the slow, conscious version. A practised routine and attention on what the cube shows keep the skill on autopilot.",
    },
  ],
};
