import { SCRAMBLE_HOLD, SOLVING_ROTATION } from "@/lib/config/cube";
import { SOURCES } from "../sources";
import type { LevelPack } from "../types";

/*
 * Packs written for one stretch of the road rather than one part of the
 * profile: first solves → 2:00, 2:00 → 1:00 and 1:00 → 45 s.
 */

export const beginnerMethodCold: LevelPack = {
  id: "beginner-method-cold",
  title: "Know the beginner method cold",
  summary: "Every step without looking anything up, and the one change to make before speed.",
  levels: ["beginner"],
  why: "Around two minutes, most of the time is not turning. It is remembering which step comes next, looking an algorithm up, or undoing a move that went the wrong way. Speed arrives on its own once the method is automatic; before that, trying to go faster only produces more mistakes to undo.",
  lessons: [
    {
      id: "cold-seven-steps",
      title: "Know what each step leaves solved",
      takeaway:
        "If you can say what the cube should look like after each step, you can check yourself instead of starting again.",
      minutes: 4,
      body: [
        "Every layer-by-layer method is a short list of steps, and each one ends with something specific solved: the cross, then the first layer, then the second, then the last layer's cross, and so on. Knowing that list well is what lets you notice a mistake the moment it happens rather than three steps later.",
        "The habit to build is a quick check at the end of each step. After the first layer, keep white on the bottom and turn the cube round a side at a time with y turns, which leave the top and bottom where they are: does each side's bottom row match its centre? There is no need to flip it over to look. If one doesn't, you fix it now, which costs a few seconds, instead of discovering it during the last layer and losing the solve.",
        "This also makes it much easier to learn from mistakes. When a solve goes wrong you can say which step broke, which tells you exactly which algorithm or idea to go back and practise.",
      ],
      checkpoint: "You can name every step in order, and what is solved at the end of each.",
    },
    {
      id: "cold-notation",
      title: "Read notation properly",
      takeaway:
        "Face turns, primes and doubles, whole-cube rotations like the z2 after every scramble, and wide and slice moves — the language every algorithm and scramble is written in.",
      minutes: 6,
      body: [
        "Each letter is a face: R right, L left, U up, D down, F front, B back. The letter alone means a quarter turn clockwise, as if you were looking straight at that face. A prime (R') is anticlockwise, and a 2 (R2) is a half turn, which goes the same place whichever way you turn it.",
        "The part people get wrong is that clockwise is always judged looking at the face being turned. So R and L turn in opposite directions as seen from the front, and U and D do the same from above. If an algorithm keeps coming out wrong, this is the first thing to check.",
        "The letters x, y and z turn the whole cube in your hands rather than one face: x turns it the way R does, y the way U does and z the way F does, and they take primes and 2s like any other move. The one you will use every solve is z2. Scrambles are applied with white on top and green in front; a z2 turns the cube over sideways, so white goes to the bottom, yellow comes to the top, green stays facing you, orange ends up on the right and red on the left. That is how you hold it for the whole solve.",
        "A lowercase letter is a wide move: r turns the right face and the middle layer beside it together, in the same direction as R. It is also written Rw, and f (or Fw) does the same for the front. Slices turn only a middle layer: M sits between L and R and turns like L, E sits between U and D and turns like D, and S sits between F and B and turns like F. They turn up in last-layer algorithms, so it is worth knowing them before you get there.",
        "It is worth being exact now, because everything later — two-look last layer, full OLL and PLL, every tutorial and trainer — is written in this notation. Guessing costs you every time you learn something new.",
      ],
      examples: [
        {
          label: "A trigger you will use constantly",
          moves: "R U R' U'",
          note: "Right face up, top left, right face down, top right. Six in a row brings the cube back to where it started, which makes it a good check that you are reading it correctly.",
        },
        {
          label: "From the scramble hold to the solving hold",
          moves: "z2",
          note: "White starts on top and ends on the bottom. Green stays in front the whole time.",
        },
      ],
      checkpoint: "You can follow a written algorithm without watching someone do it first.",
    },
    {
      id: "cold-triggers",
      title: "Learn algorithms as triggers, not letters",
      takeaway: "Long algorithms are short, familiar pieces joined together. Remember the pieces.",
      minutes: 4,
      body: [
        "An algorithm written out as eleven letters looks impossible to remember. It is usually two or three short, repeated chunks — triggers — like R U R' U' or R' F R F'. Once you see the chunks, a long algorithm becomes three things to remember instead of eleven.",
        "Learn the triggers until your hands do them without thinking, then learn each algorithm as a sequence of triggers. This is also where finger tricks start to matter: a trigger done with the same finger movement every time becomes fast very quickly.",
        "Loop each new algorithm slowly until it feels boring, many times in a row. Recognising when to use it is then the only thing left to think about during a solve.",
      ],
    },
    {
      id: "cold-no-daisy",
      title: "Put the cross straight on the bottom",
      takeaway:
        "The daisy is a useful first step and a slow habit. Build the cross where it will stay.",
      minutes: 3,
      body: [
        `Start every solve in the same hold. Scrambles are applied with ${SCRAMBLE_HOLD}, so do a ${SOLVING_ROTATION} first: white is now on the bottom, yellow on top and green still in front. The cross is built there, and white stays on the bottom for the rest of the solve.`,
        "Many beginner methods start with a daisy — white edges around the yellow centre — and then turn each one down. It is easy to learn and it roughly doubles the moves the cross takes.",
        "Once you can solve reliably, start placing each white edge directly into its spot on the bottom, matched to its side centre. It will feel slow for a few days, because you have to look at the side of the cube rather than the top.",
        "It is worth doing now rather than later: every method you move on to builds the cross on the bottom, and a two-minute solver who already does it has one fewer habit to unlearn.",
      ],
      checkpoint: "Your cross goes straight onto the bottom, without a daisy first.",
    },
  ],
  drills: [
    {
      id: "cold-ten-in-a-row",
      title: "Ten in a row, no help",
      purpose:
        "Proves the method is actually learned, not half-remembered. This comes before any speed work.",
      rules: [
        "Solve ten times in a row without looking anything up.",
        "If you have to check an algorithm, start the count again from zero.",
        "Untimed. The only goal is finishing every time.",
      ],
      dose: "Once a day until you can do it.",
      signal: "You stop needing to check anything, and your mistakes become rare enough to notice.",
    },
    {
      id: "cold-trigger-loops",
      title: "Trigger loops",
      purpose:
        "Builds the short chunks every algorithm is made of until your hands run them alone.",
      rules: [
        "Do R U R' U' six times in a row; the cube should come back solved.",
        "Do the same with the other triggers in your algorithms.",
        "Slow and even beats fast and uneven.",
      ],
      dose: "Two minutes before each session.",
      signal: "The six-in-a-row loop comes back solved every time without you watching it.",
      exerciseId: "tps_test",
    },
    {
      id: "cold-step-check",
      title: "Check every step",
      purpose:
        "Catches mistakes when they are cheap to fix, which is the fastest way to stop losing solves.",
      rules: [
        "At the end of each step, pause and check what should be solved is solved.",
        "If something is wrong, fix it before going on, and note which step it was.",
        "After ten solves, look at which step went wrong most often.",
      ],
      dose: "Ten solves.",
      signal: "You find mistakes in the step they happened in, not at the end.",
    },
  ],
  mistakes: [
    "Timing every solve before the method is automatic, which trains rushing.",
    "Learning algorithms letter by letter instead of as triggers.",
    "Keeping the daisy long after the cross itself is easy.",
    "Guessing at notation and wondering why algorithms keep failing.",
  ],
  sources: [SOURCES.getFaster, SOURCES.subMinute, SOURCES.wcaRegulations, SOURCES.fingerTricks],
};

export const setUpYourCube: LevelPack = {
  id: "set-up-your-cube",
  title: "Setting up your cube",
  summary: "Tension, magnets and lube: what each does, and how to tell when yours is wrong.",
  levels: ["beginner"],
  why: "A stiff or loose cube costs you in ways that feel like your own fault: layers that catch, pieces that pop, turns that overshoot. A decent magnetic speedcube is worth having by the time you solve in a minute or two. After that, a cube that feels the same every day matters more than which model it is, and most lockups come from the turning, not the cube. A few minutes of setup is what keeps it the same.",
  lessons: [
    {
      id: "setup-tension",
      title: "Tension: tight enough to be stable",
      takeaway:
        "Adjust in small, equal steps on all six centres, and judge it by how the cube behaves.",
      minutes: 4,
      body: [
        "Tension is how firmly the springs under each centre hold the layers together. Too tight and the layers are hard to turn, lock up at moderate speed, and tire your fingers. Too loose and the layers wobble when you squeeze the cube, overshoot, and pop pieces out.",
        "Most cubes adjust with a screw under each centre cap: clockwise tightens, anticlockwise loosens. Change all six by the same small amount — half a turn at a time — or the cube will turn differently on different faces, which is worse than either extreme.",
        "Corner cutting is a useful check: how far a layer can be misaligned and still let the next turn go through. A figure often suggested is somewhere around 45 to 55 degrees. Start at medium, solve on it for a week, and only then decide whether to change it.",
      ],
      checkpoint: "Your cube neither catches on ordinary triggers nor pops when you turn quickly.",
    },
    {
      id: "setup-lube",
      title: "Lube: less than you think",
      takeaway: "One or two drops, spread by turning, and never household oils.",
      minutes: 4,
      body: [
        "Lubricant changes how the cube feels to turn. Thin, silicone-based lubes make it faster and smoother; thick ones slow it down and make it quieter and more controlled. Many people use both: a heavier lube towards the core and a lighter one further out.",
        "The common mistake is using too much. One or two small drops is usually enough for the whole cube; more just makes it sluggish until it wears off. There is no need to take pieces out: turn one layer about 45 degrees, let a drop fall onto the pieces you can see inside, and turn the layer back. On cubes whose centre caps come off, lube for the core can go in through the centre instead. Then turn the cube a few hundred times so the lube spreads.",
        "A freshly lubed cube often feels slower for a short while before it settles. Judge it after a proper session, not after a minute. And never use WD-40, cooking oil or petroleum jelly: they damage the plastic.",
      ],
    },
    {
      id: "setup-magnets",
      title: "Magnets, and changing one thing at a time",
      takeaway:
        "Stronger magnets snap layers into line; weaker ones feel floatier for very fast turning.",
      minutes: 3,
      body: [
        "The magnets in a modern speedcube pull each layer into alignment as it finishes a turn. Stronger magnets give a clear click and forgive sloppy turns, which suits most people learning to turn faster. Weaker magnets feel lighter and suit people already turning very fast.",
        "Medium is the sensible default. If your cube lets you change magnet strength, leave it until last: tension and lube change how the magnets feel, so tuning them first means tuning twice.",
        "The rule for all of this is one change at a time, then a week of solving before judging it. Changing tension, lube and magnets together leaves you with no idea which one helped.",
      ],
      checkpoint: "You know your cube's tension and magnet setting, and why you chose them.",
    },
  ],
  drills: [
    {
      id: "setup-lockup-test",
      title: "The lockup test",
      purpose:
        "Tells you whether a problem is the cube or your turning, before you change anything.",
      rules: [
        "Do R U R' U' six times at a comfortable speed, then faster.",
        "Note where it catches or pops, and on which face.",
        "If one face behaves differently, check that face's tension first.",
      ],
      dose: "Once, whenever the cube starts to feel wrong.",
      signal: "You can say what is wrong with the cube in one sentence before touching a screw.",
      exerciseId: "tps_test",
    },
    {
      id: "setup-one-change",
      title: "One change, one week",
      purpose:
        "Stops endless fiddling, which is usually the cube being blamed for turning technique.",
      rules: [
        "Make a single change: half a turn of tension, or one drop of lube.",
        "Solve on it normally for a week.",
        "Keep it only if the cube is clearly better, then stop adjusting.",
      ],
      dose: "One change a week, at most.",
      signal: "You stop wanting to adjust the cube, and start working on turning instead.",
    },
  ],
  mistakes: [
    "Tightening or loosening only some centres, so faces turn differently.",
    "Using far too much lube and judging the cube straight after.",
    "Changing several things at once and not knowing which helped.",
    "Blaming the cube for lockups that happen on any cube.",
  ],
  sources: [SOURCES.feliksTension, SOURCES.feliksLube, SOURCES.cubeSetup, SOURCES.turningSpeed],
};

export const switchToF2l: LevelPack = {
  id: "switch-to-f2l",
  title: "Making the switch to F2L",
  summary:
    "Why your times get worse first, and how to get through the two slow weeks. The F2L method itself is in Build your CFOP foundation.",
  levels: ["sub120"],
  why: "Solving the first layer and then the second costs thirty or more extra moves compared with solving them together. F2L is the fix, and it is also the step that makes almost everyone slower for a while — which is when most people give up on it.",
  lessons: [
    {
      id: "switch-expect-slower",
      title: "It gets worse before it gets better",
      takeaway:
        "One to two weeks of slower times is normal. It is the new skill being built, not a sign it isn't working.",
      minutes: 3,
      body: [
        "When you switch from a layer-by-layer second step to F2L, you are replacing something you do automatically with something you have to think about. Of course it is slower at first. Most people report one to two weeks of worse times, and some report a lot worse — one account went from a minute to nearly two, then to about forty seconds two weeks later.",
        "Knowing this in advance matters, because the temptation is to switch back the first time a solve goes badly. Don't. The move count saving is real and large, and your old method has nowhere left to go.",
        "It helps to stop timing for the first week. A timer during this phase only tells you what you already know, that you are slower, and it pushes you to rush the part you are trying to learn.",
      ],
    },
    {
      id: "switch-when-algorithms",
      title: "When to learn cases as algorithms",
      takeaway:
        "Not yet. Only once intuitive F2L is fluent, from the Sub-20 course, and only for the cases that stay slow.",
      minutes: 3,
      body: [
        "It is tempting to go straight to a list of 41 algorithms. It is slower to learn, and it leaves you stuck on any case you haven't memorised. Worse, you never learn what the moves do, which is exactly what later lets you see a better solution or look ahead.",
        "Once you can solve every pair intuitively, some cases will still be slow — usually the ones with a piece stuck in the slot, or the corner's white sticker facing up. Don't memorise them yet. The Sub-45 course finds a short way through every case by understanding it, and the first cases worth learning by heart, the five with both pieces stuck in the slot, come in the Sub-20 course.",
        "The algorithm bank in this app has every F2L case, led by the version most solvers use and with shorter ones alongside, all checked on a cube. If one case keeps beating you, look it up there, then work out why the moves join the pair rather than just copying them.",
      ],
    },
  ],
  drills: [
    {
      id: "switch-untimed-week",
      title: "The untimed week",
      purpose:
        "Takes the timer's pressure off while the new habit forms, so you learn it instead of rushing it.",
      rules: [
        "For one week, no timed solves. Every solve uses F2L, however slow.",
        "Say out loud what you are doing with each pair: taking out, pairing, inserting.",
        "If you get stuck on a pair, work it out rather than falling back to the old method.",
      ],
      dose: "Twenty solves a day for a week.",
      signal: "By the end of the week pairs feel like one thing, not two pieces.",
    },
    {
      id: "switch-one-pair",
      title: "One pair at a time",
      purpose: "Isolates the new skill from everything else in the solve.",
      rules: [
        "Solve the cross, then solve just one pair. Scramble and repeat.",
        "Each time, try to see the pair before you move anything.",
        "Once one pair is easy, go to two, then four.",
      ],
      dose: "Fifteen pairs a session.",
      signal: "You stop searching for the second piece once you have found the first.",
      exerciseId: "last_slot",
    },
  ],
  mistakes: [
    "Switching back to the old method the first time a solve goes badly.",
    "Timing every solve during the switch.",
    "Memorising 41 algorithms before understanding what a pair is.",
    "Inserting into back slots and rotating constantly before the basic idea is solid.",
  ],
  sources: [SOURCES.learnF2l, SOURCES.f2lSlowerFirst, SOURCES.badmephistoF2l, SOURCES.jpermF2l],
};

export const twoLookOll: LevelPack = {
  id: "two-look-oll",
  title: "2-look OLL: ten algorithms",
  summary:
    "Ten algorithms that replace the beginner last layer. Build your CFOP foundation teaches the two steps; this unit adds recognition cues and drills.",
  levels: ["sub120"],
  why: "The beginner last layer takes several algorithms, some of them twice. Two-look OLL does the whole top face in two steps with ten algorithms, and most of the time you only need a few of them.",
  lessons: [
    {
      id: "oll2-one-cue",
      title: "One cue per case",
      takeaway: "Recognise each case by one feature, not by comparing the whole picture.",
      minutes: 3,
      body: [
        "Recognition is faster when each case has a single thing to look for. For the corner step, the first cue is how many corners already face up — none, one or two — and the second is where one particular sticker points.",
        "Pick your cue for each case deliberately and use the same one every time. Comparing the whole top face against a mental picture of seven cases is slow and gets slower when you are nervous.",
        "Loop each new algorithm slowly until your hands do it without you, then spend the practice on recognition. By then the algorithm is the easy part.",
      ],
    },
  ],
  drills: [
    {
      id: "oll2-edge-flash",
      title: "Edges only",
      purpose: "Makes the first look instant, since it is the same four stickers every time.",
      rules: [
        "Scramble, solve to the last layer, and name the edge case before doing anything.",
        "Solve only the edge step, check it, and scramble again.",
        "Name it out loud; speed of the word is the speed of the recognition.",
      ],
      dose: "Twenty last layers.",
      signal: "You name the case in the time it takes to look at it.",
      exerciseId: "oll_only",
    },
    {
      id: "oll2-sune-loops",
      title: "Sune and Antisune loops",
      purpose:
        "Makes Sune and Antisune fast enough that they stop costing anything; while you learn, they stand in for the other corner cases too.",
      rules: [
        "Loop Sune slowly until it is smooth, then Antisune.",
        "Alternate them: set up a case, recognise it, solve it.",
        "Stop at the speed where every repetition is clean.",
      ],
      dose: "Five minutes a session for a week.",
      signal: "Both run without a pause in the middle.",
    },
  ],
  mistakes: [
    "Worrying about where pieces are going during OLL, which is PLL's job.",
    "Learning all seven corner cases at once and confusing them.",
    "Comparing the whole top face instead of looking for one cue.",
    "Holding every case from one angle and turning the cube to match.",
  ],
  sources: [SOURCES.twoLookOllWiki, SOURCES.twoLookOll, SOURCES.ollAlgs, SOURCES.jpermCfop],
};

export const twoLookPll: LevelPack = {
  id: "two-look-pll",
  title: "2-look PLL: corners, then edges",
  summary:
    "Six cases that finish the solve. Build your CFOP foundation teaches the corner step; this unit adds the edges, the last turn and drills.",
  levels: ["sub120"],
  why: "After two-look OLL the top face is one colour and the pieces are in the wrong places. Two-look PLL puts the corners home and then the edges, with six algorithms, and it teaches the pattern you will use for full PLL later.",
  lessons: [
    {
      id: "pll2-edges",
      title: "Edges: look for the solved bar",
      takeaway: "A side with all three stickers matching tells you which edge case you have.",
      minutes: 4,
      body: [
        "With the corners done, every side has matching corners, and the question is the edge between them. If one side is completely one colour — a solved bar — then three edges need to cycle, which is one of the two U perms. Hold the solved bar at the back.",
        "If no side is solved, the edges are swapping in pairs: either two neighbouring pairs, or opposite edges swapping across. Those are the last two algorithms.",
        "Telling the two U perms apart is the slowest part for most people. Look at the front edge: which way does it need to go, left or right? Pick that one question and ask it every time.",
      ],
    },
    {
      id: "pll2-auf",
      title: "The last turn, and what comes next",
      takeaway:
        "Finish with a top turn to line the layer up, then start replacing two looks with one.",
      minutes: 3,
      body: [
        "After the edges, the last layer is solved but may be rotated. One turn of the top — U, U' or U2 — finishes the cube. It is part of the step, not an extra: start noticing which one you will need before the algorithm ends.",
        "Two-look PLL is where to stay for now, but not forever. Full PLL is 21 cases and saves an algorithm on most solves. You can make a start on it in the Sub-45 course, with the A perms and then the J perms.",
        "Keep the two-look algorithms as a fallback while you learn. A full-PLL case you half-know is slower than two algorithms you know well.",
      ],
    },
  ],
  drills: [
    {
      id: "pll2-spot",
      title: "Spot the headlights",
      purpose: "Trains the recognition that both two-look and full PLL depend on.",
      rules: [
        "Solve to PLL. Look at the front and right sides only, without turning anything.",
        "Say whether either shows headlights, and what that means for the back and left. Headlights on both: all four sides have them. On one: the other three have none. On neither: there is one pair at the back or on the left, or none anywhere.",
        "Then turn the top twice (U2) to bring the back and left round, and check.",
        "Twenty in a row, untimed.",
      ],
      dose: "Five minutes a session.",
      signal: "You make the call the moment you look, and the check agrees with it.",
      exerciseId: "pll_only",
    },
    {
      id: "pll2-predict-turn",
      title: "Call the last turn",
      purpose: "Makes the final top turn part of the algorithm instead of a pause after it.",
      rules: [
        "Before the edge algorithm ends, say U, U', U2 or nothing.",
        "Finish and check.",
        "Wrong is fine; silent is not.",
      ],
      dose: "Twenty solves.",
      signal: "You are right most of the time, and the pause at the end disappears.",
    },
  ],
  mistakes: [
    "Turning the whole cube round to look at the other sides, when a turn of the top brings them to you.",
    "Guessing between the two U perms instead of asking one question each time.",
    "Treating the final turn as separate from the step.",
    "Dropping the two-look fallback before full PLL cases are reliable.",
  ],
  sources: [SOURCES.sarahPll, SOURCES.pllRecognitionGuide, SOURCES.jpermCfop],
};

export const choosingTheNextPair: LevelPack = {
  id: "choosing-the-next-pair",
  title: "Choosing the next pair",
  summary: "Not every pair is worth solving next. How to pick, without it becoming a pause.",
  levels: ["sub60"],
  why: "At this level most people solve whichever pair they see first. That often means a pair with a piece stuck in a slot, when an easy one was sitting on top — and the awkward one costs twice as many moves.",
  lessons: [
    {
      id: "choice-skip-bad",
      title: "Skip the bad cases",
      takeaway:
        "If both pieces of a pair are stuck in slots, there is almost always a better pair available.",
      minutes: 4,
      body: [
        "Some F2L cases are simply worse than others. The worst are pairs with both pieces already in a slot: they need nine to eleven moves where an easy pair on top needs three to seven.",
        "The useful habit is noticing when you are about to start one of these and asking whether another pair is available. There very often is, and solving it first may even free the stuck pieces as a side effect.",
        "This is called pair choice, and it is one of the simplest efficiency gains at this level. You are not learning new solutions, just declining to start the expensive ones.",
      ],
      checkpoint: "You notice a stuck pair before you start it, and look for an alternative.",
    },
    {
      id: "choice-free-pairs",
      title: "Take the free ones",
      takeaway:
        "A pair already joined, or three moves from done, is worth solving before anything else.",
      minutes: 3,
      body: [
        "Sometimes a corner and its edge are already next to each other, or will go in with a single trigger. These free pairs are worth taking whenever you see them, because they cost almost nothing and they reduce how many pieces you have to look through for the next one.",
        "A related preference: pairs that, when inserted, bring out a piece that was hidden in a slot. Those make the next search easier because more pieces are on top where you can see them.",
        "Don't let this become a long search. The point is to take good pairs when they are in view, not to inspect the whole cube before every pair.",
      ],
    },
    {
      id: "choice-flow",
      title: "Flow beats the perfect choice",
      takeaway: "A pause to find the best pair usually costs more than the moves it saves.",
      minutes: 3,
      body: [
        "The advice from people who have thought about this a lot is consistent: reducing pauses matters more than picking the theoretically best pair, especially after a difficult cross. If choosing takes a second, just take the pair you see.",
        "The way these fit together is lookahead. The choice should happen while you are inserting the previous pair, not after it. If your eyes already know the options when your hands are free, picking the good one costs nothing.",
        "Some solvers prefer a fixed order, such as the back-left slot first, so that the rest of F2L can use mostly R and U moves. It is a reasonable default to fall back on when nothing obvious stands out.",
      ],
    },
  ],
  drills: [
    {
      id: "choice-two-options",
      title: "Two options",
      purpose:
        "Builds the habit of seeing more than one pair, which is what makes choosing possible.",
      rules: [
        "Before each pair, find two candidate pairs and say which you will solve.",
        "Untimed and slow; the point is seeing both.",
        "Afterwards, ask whether the other one would have been easier.",
      ],
      dose: "Ten solves.",
      signal: "You start seeing a second pair without looking for it.",
      exerciseId: "slow_turning_f2l",
    },
    {
      id: "choice-no-stuck",
      title: "No stuck pairs first",
      purpose: "Removes the most expensive cases from your solves by habit.",
      rules: [
        "Rule for the session: never start a pair with both pieces stuck in slots if another pair is available.",
        "Note how often you had to break the rule.",
        "Twenty solves.",
      ],
      dose: "One session a week.",
      signal: "Your F2L test time drops without any new algorithms.",
      exerciseId: "f2l_only",
    },
  ],
  mistakes: [
    "Always solving the first pair you see.",
    "Starting a pair with both pieces stuck when an easy one is on top.",
    "Searching so long for the best pair that the search costs more than it saves.",
    "Choosing after the previous pair, instead of during it.",
  ],
  sources: [
    SOURCES.pairSelection,
    SOURCES.badmephistoF2l,
    SOURCES.cubefreakLookahead,
    SOURCES.emptySlots,
  ],
};

export const stuckPieces: LevelPack = {
  id: "stuck-pieces",
  title: "When a piece is stuck in a slot",
  summary:
    "The F2L cases intuition handles worst, and how to free a stuck piece without wasting moves.",
  levels: ["sub60"],
  why: "Intuitive F2L handles pairs on top well and pieces stuck in slots badly: taking a piece out, pairing and reinserting often takes eleven or twelve moves. Freeing the piece so that it comes out already next to its partner saves three or four of them.",
  lessons: [
    {
      id: "stuck-three-kinds",
      title: "Three kinds of stuck",
      takeaway: "Corner stuck, edge stuck, or both. Each has a different best approach.",
      minutes: 4,
      body: [
        "A stuck piece is part of the pair you want, sitting in a slot — its own or another — in the wrong way. There are three situations. The corner is in the slot with the edge on top. The edge is in the slot with the corner on top. Or both are in the slot.",
        "With one piece stuck, the usual approach is to take it out in a way that already sets up the pair: the move that lifts the stuck piece should leave it next to its partner. That turns an eleven-move case into a seven- or eight-move one.",
        "With both stuck, taking them out and starting again is slow. For now, solve another pair first if one is available. If the two pieces sit in that other pair's slot, solving it brings them out. If they sit in their own slot, they are one of five cases, and you have lost nothing by leaving them until later. Memorised algorithms for these five come in the Sub-20 course, where they are the first F2L cases worth learning by heart.",
      ],
    },
    {
      id: "stuck-other-slots",
      title: "Pieces in the wrong slot",
      takeaway: "A piece in another pair's slot can often come out as part of solving that pair.",
      minutes: 3,
      body: [
        "Sometimes a piece you need is in a different slot, not its own. Before extracting it, check whether that slot's own pair is nearly ready: solving that pair first will bring your piece out for free.",
        "If not, extract with a move that joins it to its partner, as with a piece in its own slot. The difference is that you now have two slots to think about, and an empty one can help: the keyhole lesson in the Sub-30 course shows how.",
        "Practise reading these from every slot, not only the front right. A piece stuck at the back is the same case turned round, and it is the one people most often pull out blind.",
      ],
    },
  ],
  drills: [
    {
      id: "stuck-list",
      title: "Your stuck-case list",
      purpose:
        "Finds which stuck cases actually appear in your solves, so you work on those first.",
      rules: [
        "For twenty solves, note every pair that started with a piece in a slot.",
        "Group them: corner stuck, edge stuck, both.",
        "Work out one way to lift the most common one out that also joins it to its partner, and use it for a week.",
      ],
      dose: "Once, then again a month later.",
      signal: "The list gets shorter, and a different case is at the top.",
    },
    {
      id: "stuck-lift-and-join",
      title: "Lift and join",
      purpose:
        "Replaces pulling a stuck piece out blind with one move that frees it next to its partner.",
      rules: [
        "Use the single-pair scrambles: the cross and three pairs are solved, and one pair is left. When neither of its pieces starts in the slot, solve it normally and move on.",
        "Before turning, find where its partner is and choose the way to lift the stuck piece that leaves the two together, or one top turn away.",
        "Lift it, pair, insert. If the pieces ended up apart, redo the case and try the other way out.",
      ],
      dose: "Ten stuck pairs a session.",
      signal: "Stuck pairs take you about as many moves as ordinary ones.",
      exerciseId: "last_slot",
    },
  ],
  mistakes: [
    "Taking a stuck piece out without setting up the pair at the same time.",
    "Pulling a stuck piece out blind and then searching for its partner.",
    "Solving a stuck pair first when a free pair was on top.",
    "Only learning cases from the front-right slot.",
  ],
  sources: [SOURCES.stuckPieces, SOURCES.f2lAllSlots, SOURCES.badmephistoF2l, SOURCES.jpermF2l],
};
