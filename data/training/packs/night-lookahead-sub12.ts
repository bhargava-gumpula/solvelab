import { SOURCES } from "../sources";
import type { LessonQuiz, LevelPack } from "../types";

/*
 * Pauses at the fast end: how much of a 10–12 second solve is still standing
 * still, the four kinds of pause and their separate fixes, reading step rates
 * against burst speed, and a tempo that slows early instead of stopping late.
 * The worked example, the reconstructions quoted and the arithmetic in the
 * lessons are checked on the cube engine (tests/unit/night-lookahead-sub12.test.ts).
 */

export const whereThePausesAre: LevelPack = {
  id: "where-the-pauses-are",
  title: "Where the pauses are",
  summary:
    "How much of a fast solve is standing still, which kind of pause each stop is, and a tempo that looks without stopping.",
  levels: ["sub12"],
  why: "Near 12 seconds your solves are close to what your hands can do, and it's tempting to decide that only faster turning is left. It isn't. In a frame-by-frame study of solvers at many levels, a 10-second solver on the study's trend line still had the cube completely still for about a third of the solve. That still time has several causes, each with its own fix, so 'look ahead more' isn't a plan. The work is measuring it, sorting it by cause, and changing the tempo that produces it.",
  lessons: [
    {
      id: "pauses-a-third-still",
      title: "A third of the solve, standing still",
      takeaway:
        "Even 10-second solvers have the cube still for about a third of the solve. At 12 seconds, pauses and turning speed both still move your time.",
      minutes: 4,
      body: [
        "Around 12 seconds it starts to feel as if your hands are the limit. The best measurement there is says otherwise. Kepler Boyce and Cornelis Storm went through 69 solve videos frame by frame, from solvers across a wide range of speeds, and counted a pause as any stretch of frames in which every layer of the cube was still.",
        "The share of the solve spent paused rose and fell with solve time. On their trend, an average 10-second solver had the cube still for about 33% of the solve and an average 20-second solver for about 46%. Of the ten seconds between those two solvers, they estimate about 6.2 come from pausing less. A faster solver isn't a slower one sped up.",
        "Turning speed mattered too. Faster solvers turned faster whether or not the pauses were counted, so this isn't a choice between hands and eyes: at your level both still move. What showed no link to solve time was F2L move count. That surprised the authors, since many fast solvers learn techniques to cut F2L moves: shaving moves off pairs isn't where the gap between 10 and 20 seconds was.",
        "Read the numbers with care. It's a small study in a student research journal: 16 solvers, with the pause figures from 43 solves by 11 of them. A pause there is any still moment in a video at 30 frames a second, tiny stops inside algorithms included, so a third still doesn't mean a third spent searching. Take the direction from it, which matches what Feliks Zemdegs says from the other end: there is a lot of room for improvement in the lookahead of even the top solvers, particularly in early F2L pairs and in recognising last-layer cases.",
      ],
      checkpoint:
        "You can say roughly how much of a 12-second solve is likely to be standing still, and why that isn't all searching.",
    },
    {
      id: "pauses-four-kinds",
      title: "Four kinds of pause",
      takeaway:
        "Pauses come from searching, recognising, the joins between steps and regrips. Label each one before you fix it: each has its own cure.",
      minutes: 5,
      body: [
        "A pause is a moment when no layer is moving, but pauses don't share a cause, and they don't share a fix. Lookahead practice won't touch a pause spent recognising an OLL, and a faster OLL won't touch a pause spent regripping. So sort them before you practise anything. Four kinds cover nearly all of them.",
        "Search: the current pair is in and you don't know where the next one is. It happens in the middle of F2L, often with a U turn made only to look. The fix is tracking and knowing, from Lookahead, properly. In the frame-by-frame study F2L held the most pause time for every solver, but the study counts the pause after the cross inside F2L, and F2L takes in last-slot recognition too. So search is the likeliest big one, and the first drill below is how you find out.",
        "Recognition: the pieces are in view but you haven't named the case. It sits right before an algorithm: the OLL, the PLL or a last-slot case. For solvers under 15 seconds, the study's authors single out OLL and PLL recognition as something extra to work on. Seams: the joins where one kind of thinking hands over to another. At the end of the cross the plan from inspection runs out and live searching takes over; at the end of the last pair, F2L hands over to the last layer. The same authors single out the pause between cross and F2L for solvers under 15 seconds.",
        "Mechanical: the stop comes from your hands, not your eyes. That's a regrip, which the study counted whenever a thumb moved to another face, a rotation, which it counted as two regrips because both thumbs move, or recovering from a lockup. Faster solvers in the study regripped and rotated noticeably less. A mechanical pause needs a different solution or grip, from Hands that do not get in the way, not more lookahead.",
        "SolveLab measures some of these for you. On your profile, Lookahead (the F2L test against four single pairs) is mostly search, and Cross → F2L and F2L → OLL are the seams. OLL → PLL is mostly PLL recognition, which also shows in your OLL and PLL test times. Mechanical pauses only show on film, which is what the first drill below is for.",
      ],
      checkpoint:
        "Looking at a pause in one of your solves, you can say which of the four kinds it is and which unit fixes it.",
    },
    {
      id: "pauses-step-rates",
      title: "Each step's rate against your burst",
      takeaway:
        "A step's turning rate already includes its pauses. Take moves ÷ burst from each step's time: the step with the most time left over is where the stopped time is, not where your hands are slow.",
      minutes: 5,
      body: [
        "Turning speed you can use measured your gap for the whole solve, burst speed against solve speed. This is the same gap, step by step. A rate taken from a solve already contains its pauses: twelve moves in a 2-second step is 6 turns a second, whether you turned evenly the whole way or turned at 10 a second and stood still for 0.8 s.",
        "So work out each step's stopped time against your burst rate from the turning speed test. Twelve moves at 10 a second take 1.2 s; if the step took 2 s, up to 0.8 s of it was spent not turning. It's an upper bound, since nobody turns a whole step at burst speed. Compare steps by those left-over seconds, not by their rates: a short OLL at half your burst can hold less stopped time than a long pair at seven tenths of it. And the burst test is R and U only, so the cross, with its D, F and B turns, looks slow whatever its pauses; compare it only with itself.",
        "Mind the metric. Turns per second can be counted in any metric, and reconstruction sites list two. STPS counts moves in STM, where any turn of any layer is one move. ETPS counts them in ETM, which counts every movement you can see, including a rotation when it needs a regrip. Both divide by the same step time, so neither takes the pauses out: ETPS is not turning speed without pauses. When Rob Stuart (Brest) reconstructed an average of 100 of Feliks Zemdegs's solves, he found 58 moves on average in STM and 62 in ETM.",
        "Tymon Kolasiński's 4.54, an online solve in Monkey League rather than a WCA one, shows the pattern at the very top. The cross and his first three pairs are 22 moves in STM and took 2.63 s, 8.37 a second; the last pair and last layer are also 22 moves and took 1.91 s, 11.52 a second. The same number of moves took 0.72 s longer in the first part. Some of that is the cross's D turns and a y' in the pairs, and some is that an algorithm turns faster than intuitive F2L, but it is also where three pairs had to be found live; reco.nz splits this solve only at the last pair, so the pairs can't be timed one by one. The first part is 23 moves in ETM: the extra one is that y'.",
        "Xuanyi Geng's 3.05, the world record in April 2025, shows recognition. His last pair is 7 moves in 0.37 s, almost 19 a second. The 9-move ZBLL after it took 1.12 s, about 8 a second. A step's clock starts when the step before it ends, so whatever it took to recognise the case is counted inside it. The reconstruction alone can't split recognition from execution, and the ZBLL's F and wide r turns are slower than R and U, but a step taking more than twice as long per move as the pair before it is where to look first.",
      ],
      checkpoint:
        "You know your burst rate and which step of your solve holds the most stopped time.",
    },
    {
      id: "pauses-braking-points",
      title: "Slow down early instead of stopping late",
      takeaway:
        "Turn fast where your hands know the way and ease off over the last few moves of each pair. Slowing three moves early is cheaper than stopping one move late.",
      minutes: 4,
      body: [
        "The metronome drills in Lookahead, properly and Turning speed you can use train an even tempo: one turn a beat, never stopping. That builds the habit of looking while you turn. It isn't the shape a fast F2L ends up with, though. Fast solvers turn quickly where their hands know the way and slower where their eyes need the time.",
        "Attention is why. While you execute a pair you've already worked out, your hands run on memory and your eyes are free. At the end of the pair two things arrive together: the turns that finish it move the top layer, and with it any of the next pair's pieces sitting there, and the next decision falls due. Feliks Zemdegs suggests slowing your turning over the end of a pair, say its last three moves, so you can look elsewhere without pieces flying everywhere. Call it a braking point.",
        "Slowing beats stopping because of overlap. A pause is looking with nothing else happening. Easing off over three moves is looking with turning on top of it, so the same look costs less of the clock. As one experienced solver put it on SpeedSolving, a lot of lookahead happens while you're turning below your top speed. Stopping one move late, after the pair is in, is the dearest way to buy the same look.",
        "So aim for an uneven tempo: full pace through anything you could do with your eyes closed, slower through the last few moves of each pair while your eyes move to the next one, and never a full stop. Keep your hands quiet and the cube steady while you do it; Feliks adds that a calm turning style and a cube held still make the looking easier.",
      ],
      examples: [
        {
          label: "A pair with its braking zone",
          moves: "U' R U R' U2 R U' R'",
          slot: "FR",
          note: "The corner starts right above its slot, white facing you, with the edge at the back, green up. U' R U R' U2 joins the pair and parks it at the front left: turn that at full pace once the case is familiar. The closing R U' R' lifts the slot, brings the pair over and drops it in. Ease off there, and let your eyes leave this pair for the next.",
        },
      ],
      checkpoint:
        "In a normal solve you can feel yourself easing off at the end of each pair, and the cube doesn't stop between pairs.",
    },
  ],
  drills: [
    {
      id: "pauses-label-the-stops",
      title: "Label the stops",
      purpose:
        "Turns 'I pause a lot' into a count of each kind of pause, so you fix the kind you have rather than the one you assume.",
      rules: [
        "Film five ordinary solves from above. The five from Reconstruct five will do if they're recent.",
        "Play each back slowed down. Every time all the layers are still, note where in the solve it happened and how long it lasted, in frames or tenths of a second. Decide once what counts as a stop, such as anything you can see at half speed, and keep that rule every month, or the counts won't compare.",
        "Label each stop: search (mid-F2L, finding the next pair), recognition (just before an algorithm or a last-slot case), seam (where the cross or the last pair ends) or mechanical (a regrip, a rotation or a lockup). Tally the U turns made only to look as well: they aren't stops, but they're search.",
        "Total each label's stopped time over the five solves. The biggest one picks your next unit: Lookahead, properly for search, The last layer without gaps and Faster PLL for recognition, The join after the cross or The last pair into OLL for seams, Hands that do not get in the way for mechanical.",
      ],
      dose: "Five solves, once a month.",
      signal:
        "Stopped time in the label you worked on falls at the next monthly check, and total stopped time as a share of solve time falls month by month.",
      untimed: true,
    },
    {
      id: "pauses-step-against-burst",
      title: "Each step against your burst",
      purpose:
        "Finds the step with the most stopped time in it: the step-by-step version of Find your gap in Turning speed you can use.",
      rules: [
        "Take the turning speed test for your burst rate.",
        "Reconstruct three filmed solves in STM and time each step: cross, each pair, OLL, PLL. A step starts where the last one ended, so the pause between them counts in the step after.",
        "For each step, take moves ÷ burst rate, the time it would take at full speed, from the step's time. What's left is roughly the time you spent not turning.",
        "The step with the most stopped seconds across the three solves is the one to work on. Leave the cross out, or compare it only with itself: your burst is measured on R and U.",
      ],
      dose: "Three solves, once a month, alongside Label the stops.",
      signal:
        "That step's stopped seconds fall from month to month, until another step holds the most.",
      exerciseId: "tps_test",
    },
    {
      id: "pauses-braking-blocks",
      title: "Braking-point F2L",
      purpose:
        "Builds an uneven tempo: full pace where your hands know the way, eased off over each pair's last moves, so you look while turning instead of stopping.",
      rules: [
        "On F2L scrambles, turn each pair at your normal pace until its last three or so moves. Ease off for those, and move your eyes to the next pair as you do.",
        "The cube never stops. If it does, start easing off a move earlier.",
        "Blocks of five in the order braking, normal, normal, braking, so neither kind always gets the warm-up.",
      ],
      dose: "Twenty solves a session, a few sessions a week, for two weeks.",
      signal:
        "In three sessions in a row the braking blocks' average is at or below the normal blocks', with no full stops in them; then your F2L test and your Lookahead figure drop.",
      exerciseId: "f2l_only",
    },
  ],
  mistakes: [
    "Deciding that near 12 seconds only turning speed is left, while a third of the solve may still be standing still.",
    "Treating every pause as a lookahead problem, when some are recognition, some are seams and some are regrips.",
    "Reading a reconstruction's ETPS as turning speed with the pauses taken out.",
    "Comparing months measured with a different metric, or a different idea of what counts as a stop.",
    "Cutting F2L move count to cure the pauses between pairs.",
    "Turning each pair flat out and stopping after it, instead of easing off over its last few moves.",
  ],
  sources: [
    SOURCES.pauseStudy,
    SOURCES.limits,
    SOURCES.metricWiki,
    SOURCES.tpsWiki,
    SOURCES.reconTymon454,
    SOURCES.reconXuanyi305,
    SOURCES.lookaheadFramework,
    SOURCES.tpsMattersThread,
  ],
};

/** A question for each lesson, to be merged into LESSON_QUIZZES. */
export const WHERE_THE_PAUSES_ARE_QUIZZES: Record<string, LessonQuiz[]> = {
  "pauses-a-third-still": [
    {
      question:
        "In the frame-by-frame study, what separated the 10-second solvers from the 20-second ones?",
      options: [
        "They turned faster but paused for about the same share of the solve",
        "They paused for a smaller share of the solve, and turned faster too",
        "They used fewer F2L moves, which left less to search for",
        "They had almost no still time left, so the solve was all turning",
      ],
      answer: 1,
      why: "The share of time paused fell from about 46% to about 33%, and turning speed rose as well, with or without the pauses counted. F2L move count showed no link to time, and a third of a 10-second solve was still standing still.",
    },
  ],
  "pauses-four-kinds": [
    {
      question:
        "On film, your hands are moving but no layer is turning, just before a back-slot pair. Which kind of pause is it?",
      options: [
        "Search: you hadn't found the next pair yet",
        "Mechanical: a regrip or a rotation",
        "Recognition: naming the case before an algorithm",
        "A seam between the end of one step and the next",
      ],
      answer: 1,
      why: "Hands moving while every layer is still is the mark of a regrip or a rotation; the study counted a regrip whenever a thumb moved to another face. Its fix is a different solution or grip, not more lookahead.",
    },
  ],
  "pauses-step-rates": [
    {
      question:
        "Your burst rate is 10 turns a second. A 12-move step in your reconstruction took 2 seconds. What does that tell you?",
      options: [
        "Your hands are slow on that step's kind of move",
        "Up to about 0.8 s of it the cube wasn't turning",
        "It used too many moves; 12 is long for one step",
        "Little: a step's rate already leaves the pauses out",
      ],
      answer: 1,
      why: "Twelve moves at your burst rate take 1.2 s, so up to 0.8 s of the 2 s was not turning. A step's rate includes every pause inside it, which is why a low one points at pauses rather than hands.",
    },
    {
      question:
        "A reconstruction lists 9.69 STPS and 9.91 ETPS. What does the ETPS figure tell you?",
      options: [
        "The turning speed with the pauses taken out",
        "The same time, with moves counted in ETM instead",
        "The speed of the fastest step in the solve",
        "The speed the solver could reach with no regrips",
      ],
      answer: 1,
      why: "ETM counts every movement you can see, rotations that need a regrip included, so it finds a few more moves in the same time. Both rates divide by the whole time, pauses and all.",
    },
  ],
  "pauses-braking-points": [
    {
      question:
        "Why ease off over the last few moves of a pair rather than turn it flat out and pause afterwards?",
      options: [
        "Looking while you turn overlaps two jobs; a pause does only one",
        "Slower turns lock up less, and lockups are where the time goes",
        "The last moves of a pair are the hardest ones to execute",
        "A lower average turning speed is what the metronome rewards",
      ],
      answer: 0,
      why: "Time spent looking during slower turns still moves the solve on; a stop after the insert is look time with nothing else happening. Slowing as the pair finishes also keeps the next pair's pieces from flying past before you've followed them.",
    },
  ],
};
