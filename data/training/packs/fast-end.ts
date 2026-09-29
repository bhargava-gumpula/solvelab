import { SOURCES } from "../sources";
import type { LevelPack } from "../types";

/*
 * Packs for the fast end, where the courses were thin: memorised F2L for the
 * cases intuition handles worst, a cross chosen for the F2L it leaves, and
 * reading the PLL before OLL is over. Every move sequence with a slot is
 * checked to touch only that slot and the top layer, and every case number,
 * case description and PLL angle is checked on the cube engine
 * (tests/unit/phase3-new-packs.test.ts).
 */

export const advancedF2lCases: LevelPack = {
  id: "advanced-f2l-cases",
  title: "Advanced F2L cases",
  summary:
    "Memorised solutions for the pairs intuition handles worst: front slots first, back slots once those are automatic.",
  levels: ["sub30", "sub25"],
  why: "Intuitive F2L is good at pairs waiting in the top layer and bad at pieces stuck in a slot or corners with white facing up. Solving those by feel means pulling pieces out, pairing them and putting them back: often more than ten moves, sometimes a rotation, and a pause to work it out. A few memorised cases remove that, and with four pairs a solve they come up often enough to matter.",
  lessons: [
    {
      id: "adv-why-algorithms",
      title: "When algorithms start to pay",
      takeaway:
        "Most memorised F2L pays from around sub-15, but the stuck cases waste so many moves by feel that they're worth learning from about sub-20.",
      minutes: 4,
      body: [
        "Every F2L case can be solved by feel, and until your pairs flow one into the next, feel is the right way to do them. A memorised solution saves a couple of moves; a pause while you hunt for the next pair costs far more. J Perm suggests being roughly sub-15, with steady lookahead and few rotations, before putting real time into F2L algorithms.",
        "When you do start, don't work down a list. Start where intuition wastes the most, which is pieces stuck in the slot. By feel, these mean lifting pieces out without a plan, pairing them and putting them back, which often runs past ten moves and sometimes needs a rotation. The algorithms for the five both-stuck cases are nine to eleven moves, need no rotation, and need no thinking once learned. That's why these few are worth learning around sub-20, well before the rest.",
        "This pack goes in that order: both pieces stuck, then the edge stuck with the corner on top, then the corner stuck with the edge on top, then shortcuts for corners with white facing up. Versions for the back slots come last, once the front ones are automatic. The Sub-20 course covers the first group; the Sub-15 course picks up the rest.",
        "A word on case numbers. SolveLab numbers its F2L cases from the cube, so they don't line up with SpeedCubeDB, where many solvers look up and vote on algorithms: SpeedCubeDB's 39 is SolveLab's F2L 40, for example. Every example here gives both numbers, so you can find the case in either place.",
        "Learn each one with the pieces in view. Do it slowly and watch which moves lift the pieces out, which join them and which put the pair in. An algorithm you understand is one you recognise sooner and forget later.",
      ],
      checkpoint:
        "You can name the F2L cases that cost you the most moves by feel, and most of them are stuck pieces.",
    },
    {
      id: "adv-stuck-in-slot",
      title: "Both pieces stuck in the slot",
      takeaway:
        "Five cases. Read the edge first, then where white points, and learn the two R and U ones before the rest.",
      minutes: 5,
      body: [
        'When the corner and edge are both in their slot but wrong, there are five cases: the corner home with the edge flipped, or the corner twisted one of two ways with the edge either right or flipped. You met them in "When a piece is stuck in a slot"; here are the solutions fast solvers tend to use.',
        "Read them in two looks. First the edge: if its green sticker faces you, the edge is right; if green faces right, it's flipped. Then the corner: white facing down means it's home, otherwise note whether white faces you or faces right.",
        "Start with the two where the edge is already right. Both use only R and U from your normal grip, with no regrip, which is the kind of algorithm that gets fast within a few days. Then the corner-home case, which has F R2 F' in the middle, and last the two with a twisted corner and a flipped edge, which use wide r turns.",
        "Those last two share the same wide-r part, r U' r' U2 r U r', with a short R trigger at opposite ends. One opens with R U' R' and finishes with the wide-r part; the other opens with the wide-r part and finishes with R U R'. Learn them together and you have half the work done.",
      ],
      examples: [
        {
          label: "Edge right, white facing you",
          moves: "R U' R' U' R U R' U2 R U' R'",
          caseId: "f2l-38",
          slot: "FR",
          note: "SolveLab's F2L 38 (SpeedCubeDB 38). Only R and U, with no regrip; do the U2 as an index-then-middle double flick.",
        },
        {
          label: "Edge right, white facing right",
          moves: "R U' R' U R U2 R' U R U' R'",
          caseId: "f2l-40",
          slot: "FR",
          note: "SolveLab's F2L 40 (SpeedCubeDB 39). Also only R and U: out of the slot, paired on top and back in, with no rotation.",
        },
        {
          label: "Corner home, edge flipped",
          moves: "R2 U2 F R2 F' U2 R' U R'",
          caseId: "f2l-37",
          slot: "FR",
          note: "SolveLab's F2L 37 (SpeedCubeDB 37). Bring your right thumb round to the front face for F R2 F'; the closing R' U R' runs from that same grip.",
        },
        {
          label: "Edge flipped, white facing you",
          moves: "r U' r' U2 r U r' R U R'",
          caseId: "f2l-39",
          slot: "FR",
          note: "SolveLab's F2L 39 (SpeedCubeDB 40). Turn the wide r moves from your wrist; r U r' leaves your right hand set for the closing R U R'.",
        },
        {
          label: "Edge flipped, white facing right",
          moves: "R U' R' r U' r' U2 r U r'",
          caseId: "f2l-41",
          slot: "FR",
          note: "SolveLab's F2L 41 (SpeedCubeDB 41). R U' R' opens the slot, and the wide-r part follows from the same grip.",
        },
      ],
      checkpoint:
        "You can name all five from a glance at the edge and the corner, and do the two R and U ones without thinking.",
    },
    {
      id: "adv-edge-in-slot",
      title: "Edge in the slot, corner on top",
      takeaway:
        "When the corner shows white on top, don't pull the edge out blind: repeated triggers or a sledgehammer do it with no rotation.",
      minutes: 4,
      body: [
        "Here the edge sits in its slot and the corner waits in the top layer. When the corner's white faces sideways, feel usually does fine: a short trigger lifts the edge out to meet the corner, and the pair goes in. The trouble is a corner with white facing up, which has to be turned round before it can pair with anything, and working that out mid-solve is slow.",
        "Both cases below start with the white-up corner right above its slot. If the edge is right, with green facing you, the whole solution is the same four moves three times: U R U' R'. It looks long but turns very fast: every U is an index-finger flick and every R a wrist turn, all from home grip. The seven-move R2 U R2 U R2 U2 R2 solves the same case with fewer turns, if you like R2s.",
        "If the edge is flipped, with green facing right, do a U' and then the sledgehammer, R' F R F'. The edge comes out with the corner attached, and a plain R U' R' puts the pair in.",
        "Watch for these two in your solves. A white-up corner above a slot that holds its own edge is easy to spot once you're looking for it, and each one you catch is a pair you don't have to take apart.",
      ],
      examples: [
        {
          label: "White up above the slot, edge right",
          moves: "U R U' R' U R U' R' U R U' R'",
          slot: "FR",
          note: "SolveLab's F2L 36 (SpeedCubeDB 32). U R U' R' three times, all from home grip.",
        },
        {
          label: "White up above the slot, edge flipped",
          moves: "U' R' F R F' R U' R'",
          caseId: "f2l-31",
          slot: "FR",
          note: "SolveLab's F2L 31 (SpeedCubeDB 31). After the U', the sledgehammer brings the edge out joined to the corner, and R U' R' puts the pair in.",
        },
      ],
      checkpoint:
        "When a white-up corner sits over a slot holding its edge, you know which of the two cases it is and go straight into it.",
    },
    {
      id: "adv-corner-in-slot",
      title: "Corner in the slot, edge on top",
      takeaway:
        "The ones worth memorising are a sledgehammer, R' F R F', or its reverse, joined to a short insert.",
      minutes: 4,
      body: [
        "Now the corner is in the slot and the edge is in the top layer. The corner may be home with white facing down, or twisted. By feel you'd take the corner out, join it to the edge and put the pair back; the solutions here do the same job with no rotation and fewer decisions.",
        "The move that keeps coming up is the sledgehammer, R' F R F', which you probably know from OLL. In F2L it lifts the corner out of the slot and sets it up with the edge in one motion. Its reverse, F R' F' R, does the same from the other side. In two of the cases below the sledgehammer comes first, straight away or after a single U': in one it joins the pair outright, in the other it leaves the basic three-move insert. A short insert finishes both; in the third, a quick trigger comes first and the reverse sledgehammer finishes.",
        "Tell them apart by the edge. With the corner home, look at where the edge sits and which way its green sticker faces: on top, or towards you. With the corner twisted so white faces you and the edge in front with green facing you, the sledgehammer goes first and saves the y' that the classic solution starts with.",
        "The rest of this group are six or seven moves at best, and most solvers find them by feel, so start with these three.",
      ],
      examples: [
        {
          label: "Corner home, edge on the right with green up",
          moves: "U' R' F R F' R U R'",
          slot: "FR",
          note: "SolveLab's F2L 27 (SpeedCubeDB 25). U', then the sledgehammer lifts the corner out and leaves the basic three-move case, which R U R' pairs and inserts.",
        },
        {
          label: "Corner home, edge in front with green facing you",
          moves: "U R U' R' F R' F' R",
          caseId: "f2l-30",
          slot: "FR",
          note: "SolveLab's F2L 30 (SpeedCubeDB 26). A quick U R U' R', then the reverse sledgehammer, F R' F' R. No regrip: your right hand never leaves home grip.",
        },
        {
          label: "White facing you, edge in front",
          moves: "R' F R F' U R U' R'",
          caseId: "f2l-28",
          slot: "FR",
          note: "SolveLab's F2L 28 (SpeedCubeDB 29). Sledgehammer first, then U R U' R'. It replaces a solution that starts with a y' rotation.",
        },
      ],
      checkpoint: "You can do all three from the front, without a rotation, on sight.",
    },
    {
      id: "adv-white-up",
      title: "White on top, and other shortcuts",
      takeaway:
        "A white-up corner with its edge beside it on the right, green facing right, takes one F-wrapped trigger (F U R U' R' F') and an insert, with no turning the corner round first.",
      minutes: 4,
      body: [
        "A corner with white facing up is the other place feel gets slow, even with both pieces in the top layer. By feel you turn the corner round with something like R U2 R', find the edge again, pair and insert. A few memorised cases skip all of that.",
        "The most useful one: the corner right above its slot with white up, and the edge beside it on the right, green facing right. F U R U' R' F' is the 2-look L-shape algorithm you may know from the back-left hold; here it pairs the pieces, and R U' R' puts the pair in. Nine moves, no rotation.",
        "While you're collecting shortcuts, one more is worth having: the pair joined the wrong way on top, with the corner above its slot, white facing you, and the edge beside it in front with green facing up. The R and U way to break it up and re-pair it, R U R' U2 R U' R' U R U' R', is eleven moves; M U r U' r' U' M' does it in seven. If M moves feel awkward, the R and U version is a fine choice.",
        "Collect these slowly. One case a week, used in real solves until it fires on its own, is worth more than ten you have to stop and remember. The on-screen F2L drill deals all 41 cases: the ones this course doesn't teach are there to pick up the same way, one a week, once these are automatic.",
      ],
      examples: [
        {
          label: "White up, edge beside it on the right",
          moves: "F U R U' R' F' R U' R'",
          slot: "FR",
          note: "SolveLab's F2L 9 (SpeedCubeDB 24). Ease your thumb onto the front so your right index can push the F, turn the sexy move quickly, bring F' back, then insert with R U' R'.",
        },
        {
          label: "Pair joined the wrong way",
          moves: "M U r U' r' U' M'",
          slot: "FR",
          note: "SolveLab's F2L 24 (SpeedCubeDB 15). M and M' with your left hand, the wide turns with your right wrist.",
        },
      ],
      checkpoint:
        "When a white-up corner has its edge beside it on the right with green facing right, you go straight into F U R U' R' F' instead of turning it round first.",
    },
    {
      id: "adv-back-slots",
      title: "Back-slot versions, once the front is fluent",
      takeaway:
        "Learn a back-right version only for a case you keep rotating for, and do it straight into the back slot.",
      minutes: 4,
      body: [
        "With white on the bottom, the back slots are the ones that tempt you into a y or y2. Fast solvers answer that with back-slot versions of the cases they meet there: the same idea seen from another side, done without turning the cube. SpeedCubeDB lists back-slot versions for every case.",
        "Leave this until front-slot F2L is fluent. A back-slot algorithm you have to think about is slower than a rotation you don't, and a rotation only really costs you when it breaks your lookahead. Start with the cases you catch yourself rotating for, and learn them for the back-right slot, where your right hand can reach round.",
        "Sources disagree on how far to take it. Some solvers argue every case can be done without a rotation; others say one or two y turns a solve are fine if your lookahead doesn't suffer. Even the relaxed view draws the line at a y2.",
        "Many back-slot versions reuse the front idea. The white-up case with its edge home is the front version's U R U' R' mirrored, U' R' U R, three times. The two cases with a twisted corner and a flipped edge keep their wide-r shape. The corner-home case is new at the back, so give it its own reps. That's why most of them cost less to learn than they look.",
      ],
      examples: [
        {
          label: "Back right: corner home, edge flipped",
          moves: "R' U R r U2 R2 U' R2 U' r'",
          slot: "BR",
          note: "The back-right twin of SolveLab's F2L 37 (SpeedCubeDB 37). Hold the front with your left hand; your right hand works the slot from behind.",
        },
        {
          label: "Back right: white up above the slot, edge right",
          moves: "U' R' U R U' R' U R U' R' U R",
          slot: "BR",
          note: "The back-right twin of SolveLab's F2L 36 (SpeedCubeDB 32): U' R' U R three times, the front version mirrored.",
        },
        {
          label: "Back right: white facing the back, edge flipped",
          moves: "r' U r U2 r' U' r R' U' R",
          slot: "BR",
          note: "The back-right twin of SolveLab's F2L 41 (SpeedCubeDB 41): the wide-r part, then an R' U' R insert.",
        },
      ],
      checkpoint:
        "You solve the case you used to rotate for most straight into the back-right slot, as fast as the front version.",
    },
  ],
  drills: [
    {
      id: "adv-case-trainer",
      title: "Single-case trainer",
      purpose:
        "Turns your weakest stuck case from something you work out into something you recognise and do, by repeating it away from full solves.",
      rules: [
        "Pick the one or two stuck cases you fumble most. Set each one up by doing its algorithm backwards on a solved cube, white on the bottom.",
        "Solve it, set it up again, and repeat: ten to twenty reps per case, slowly at first, then at full speed.",
        "Once it's smooth, mix it with two cases you already know, so you have to recognise it rather than just repeat it.",
        "Then do a set of the Single pair test and let the case turn up among the others.",
      ],
      dose: "Ten minutes a session, one or two cases at a time.",
      signal:
        "The case stops being a pause in real solves: your hands start before you've finished thinking about it.",
      exerciseId: "last_slot",
    },
    {
      id: "adv-back-slot-solves",
      title: "No rotation for the back",
      purpose:
        "Makes the back-slot versions you've learned the ones you actually use, which only happens when rotating isn't an option.",
      rules: [
        "For twelve solves, every pair that goes into a back slot goes in without a y or y2.",
        "Use a back-slot algorithm you know, or work one out slowly. The rotation is the only thing that's banned.",
        "Note the case that made you most want to rotate. That's the next one to learn.",
      ],
      dose: "Twelve solves, twice a week, while you're learning back-slot cases.",
      signal:
        "Your rotation-free solves match your normal times, and the list of cases you rotate for gets shorter.",
    },
  ],
  mistakes: [
    "Learning F2L algorithms while the pauses between pairs are still the real leak.",
    "Working through a case list in order instead of starting with the stuck pieces.",
    "Using an algorithm you haven't drilled, so it's slower than the way you'd do it by feel.",
    "Learning back-slot versions before the front-slot ones are automatic.",
    "Turning a white-up corner round and re-pairing it by feel every time it comes up.",
  ],
  sources: [
    SOURCES.f2lAlgs,
    SOURCES.f2lSheet,
    SOURCES.usefulF2l,
    SOURCES.jpermF2l,
    SOURCES.f2lTrainer,
    SOURCES.f2lAllSlots,
  ],
};

export const crossForF2l: LevelPack = {
  id: "cross-for-f2l",
  title: "A cross built for F2L",
  summary: "Choosing between good crosses by the first pair they leave and how easily they turn.",
  levels: ["sub15"],
  why: "By now your cross is short. Every cross fits in eight moves, you usually find one of six or seven, and cutting one more move rarely changes much. What still costs time is what the cross leaves behind: a first pair that's awkward or hidden, or a cross that looks short on paper but needs a B turn and a regrip. At this level the cross is chosen for what comes after it.",
  lessons: [
    {
      id: "cf2l-choose-by-pairs",
      title: "Between two good crosses, pick the better first pair",
      takeaway:
        "When two crosses are equally short, the one that leaves an easier first pair is the better cross.",
      minutes: 4,
      body: [
        "Most scrambles have more than one good cross. There may be two different six-move solutions, or the same edges solved in another order, or with the last edge brought in from the other side. On move count they tie. On what they leave for F2L, they almost never do.",
        "Every cross moves F2L pieces around as a side effect. One option might leave a pair joined in the top layer while the other hides its corner in the wrong slot. When you have a tie, check where the corner of your likely first pair ends up under each option, and take the cross that leaves it on top and easy to reach.",
        "What makes a first pair easy? Both pieces in the top layer rather than one stuck in a slot, and a front slot rather than a back one. Better still is a pair the cross joins for you or nearly inserts, which is the extended cross you already take when a scramble offers it.",
        "Keep the comparison quick. You're choosing between two crosses you've already found, not searching for more. If comparing would eat the time you need to plan the cross properly, take the first: a cross you're sure of beats a cleverer one you're not.",
      ],
      checkpoint:
        "On a scramble with two equal crosses, you can say which one leaves the easier first pair, and why.",
    },
    {
      id: "cf2l-fingertricks",
      title: "Easy to turn beats one move shorter",
      takeaway:
        "A cross you can turn in one flow is faster than a shorter one full of B turns, runs of D turns and regrips.",
      minutes: 4,
      body: [
        "Move count is a good guide to a cross, but it isn't the time. A cross built from R, L, F, U and the odd D turn can be turned in one flow from home grip. One that needs a B turn, several D turns in a row or a rotation halfway through makes you regrip, and every regrip is a small stop.",
        "So when you compare crosses, weigh how they turn as well as how long they are. A seven-move cross of easy turns will often beat a six-move one with a B2 and two D turns. Avoid B turns where you can: often a D turn can bring the edge's spot round to where an R, L or F turn drops it in instead.",
        "D turns are fine in small numbers, since they're how you move edges without disturbing the ones already placed. It's long runs of them, and D turns that force your grip to change, that slow a cross down. Try your planned cross with your eyes closed: the moves that make you hesitate are the awkward ones.",
        "Plan the finish too. A cross that ends with your hands in home grip, ready for the first pair, flows straight on. One that ends halfway through a regrip puts a pause exactly where you least want one.",
      ],
      checkpoint:
        "You can point at the move in a planned cross that would slow you down, and find a version without it.",
    },
    {
      id: "cf2l-cross-and-pair",
      title: "Plan the cross and the first pair as one",
      takeaway:
        "Plan the cross and first pair together, look for the second pair only on friendly scrambles, and stop before you over-plan.",
      minutes: 4,
      body: [
        "At this level the cross and the first pair are one plan. You pick the cross partly for the pair it leaves, follow that pair's corner and edge through your cross moves, and start the pair as the last cross edge lands, with no look in between.",
        "On friendly scrambles, where the cross is short and the first pair simple, there's time to look further: where will the second pair's corner be once the first pair is in? You don't need its moves, just its place. J Perm lists predicting the second pair, on the scrambles that allow it, as part of cross work at sub-12.",
        "Don't let the plan grow past what you can hold. Commenting on his 5.80 average, Feliks Zemdegs points to a solve where he planned too much in inspection and then lost time on the third pair. A plan you're unsure of makes you slow down to check it; a smaller one you trust lets you turn and look ahead.",
        "A workable rule: plan the cross fully, the first pair fully, and the second pair only as a location. If any part feels shaky when inspection ends, drop it and trust your lookahead.",
      ],
      checkpoint:
        "Most of your solves go from the cross into the first pair without a pause, and on easy scrambles you know where the second pair's corner is too.",
    },
  ],
  drills: [
    {
      id: "cf2l-two-crosses",
      title: "Two crosses, one choice",
      purpose:
        "Builds the habit of finding a second good cross and choosing by the pair it leaves, which a normal timed solve never makes you do.",
      rules: [
        "Scramble, and during an untimed inspection find two crosses of the same length.",
        "For each, work out where your first pair's pieces end up. Choose the one that leaves the easier pair.",
        "Do the chosen cross and pair. Then scramble again the same way and try the other one, to check you chose right.",
      ],
      dose: "Ten scrambles a session, twice a week.",
      signal:
        "You find the second cross quickly, and the one you choose usually gives the faster cross and pair.",
      exerciseId: "cross_first_pair",
    },
    {
      id: "cf2l-smooth-or-short",
      title: "Short or smooth",
      purpose:
        "Shows you which kinds of move really cost you time, so you know when a longer cross is the faster one.",
      rules: [
        "On each scramble, plan the shortest cross you can find, and a second one that avoids B turns and runs of D turns, even if it's a move longer.",
        "Time the execution of each from the same scramble.",
        "Note which won, and what the slower one had in it.",
      ],
      dose: "Ten scrambles, once a week for a month.",
      signal: "You can tell which of the two will be faster before you turn either.",
      exerciseId: "cross_only",
    },
  ],
  mistakes: [
    "Taking the first cross you find when an equally short one leaves a much easier pair.",
    "Choosing a cross by move count alone, B turns and all.",
    "Planning so far ahead in inspection that you slow down to check the plan.",
    "Spending inspection comparing crosses and starting the solve with neither fully planned.",
  ],
  sources: [
    SOURCES.jpermCross,
    SOURCES.crossPlusPair,
    SOURCES.crossTransition,
    SOURCES.feliksCommentary,
    SOURCES.crossPlanning,
  ],
};

export const predictPll: LevelPack = {
  id: "predict-pll",
  title: "Predict the PLL",
  summary:
    "Narrowing the PLL during the OLL, calling the last turn early, and a second algorithm for the angles that cost you a U2.",
  levels: ["sub15"],
  why: "With full OLL and PLL learned, the last layer still loses time at the joins: a pause after OLL to look at the top, a searching turn before PLL, and a U or two at the end found by trial. None of that is turning. It shrinks when your eyes start on the PLL before the OLL is over, and when you know the last turn before the algorithm ends.",
  lessons: [
    {
      id: "ppll-one-block",
      title: "Narrow the PLL from one side",
      takeaway:
        "During the OLL's last moves, read one side of the top: a bar leaves only five PLLs, and headlights rule out eight.",
      minutes: 4,
      body: [
        "You don't have to recognise the whole PLL during the OLL. One side is enough to narrow it down a lot, and one side is often settled before the OLL ends. Feliks Zemdegs describes doing this in his commentary on a 5.80 average: a glance during the last trigger cut one PLL down to a J or an F.",
        "Look for three things on the side you can see: a bar, where all three stickers match; headlights, where the two corners match with a different edge between them; or a block, a corner and edge that match. A bar is the strongest clue, because only five PLLs have one: the two U perms, the two J perms and the F perm. Headlights rule out the J, N, V, Y, E and F perms.",
        "Which side to watch depends on how the OLL ends. Many end with an R turn, like Sune's final R U2 R'. That last R' doesn't touch the left side, so once the U2 before it is done, the left side's top row is exactly what the PLL will show. Read it while your right hand finishes.",
        "OLLs that end with an F turn are harder, because the only side that turn leaves alone is the back, which you can't see. On those, read after the last move. The glance is easiest on OLLs that carry a corner and the edge beside it round together, so a block you spot partway through is still a block at the end. Start with the OLLs you do most, and practise the glance until it happens without deciding to.",
      ],
      checkpoint:
        "Before an OLL that ends in R' finishes, you can say whether the left side shows a bar, headlights, a block or none of them.",
    },
    {
      id: "ppll-post-auf",
      title: "Call the last turn early",
      takeaway:
        "Find the pieces the PLL doesn't move, see which centre they match, and you know the final U turn before the algorithm starts.",
      minutes: 4,
      body: [
        "If you call the last turn from one reference sticker per case (the AUF lesson in the Sub-20 course), this is the faster read that fast solvers move on to: you get the turn from the pieces themselves while you recognise the case, with no sticker to remember.",
        "The trick is that every PLL leaves some pieces where they are. Look at those pieces now, see which centre they belong next to, and you know where they'll need to go at the end. With the usual U, H and Z perm algorithms the corners end where they started, so the U turn that would line the corners up with their centres right now, after any set-up turn, is the turn you'll make after the algorithm.",
        "The T perm, done with the headlights on the left, leaves those two corners alone, and afterwards the whole left side is the headlights' colour. So match the headlights to a centre. If they match the left centre, there's no final turn; the front centre, finish with U'; the back centre, U; the right centre, U2.",
        "Work out the same for the PLLs you meet most: which pieces stay put, and where they'll have to go. Then, once you've recognised a PLL, say the final turn to yourself before you start it. It slows you down at first; within a couple of weeks the last U is just part of the algorithm.",
      ],
      checkpoint: "In most solves you make the final U turn without looking for it.",
    },
    {
      id: "ppll-second-angles",
      title: "A second algorithm for the U2 angles",
      takeaway:
        "Learn another algorithm only where you'd otherwise need a U2 set-up or an avoidable last turn, not for every angle.",
      minutes: 5,
      body: [
        "Every PLL can turn up facing any of four ways, and one guide to all of them runs to 84 angles. Learning them all is a poor trade. For most PLLs, one angle in four needs a U2 before your usual algorithm, and some leave a turn at the end you could have avoided. Those are the angles worth a second algorithm.",
        "Start with the U perms. The usual Ua and Ub are done with the solved bar at the back, so when the bar is in front of you, the usual way is a U2 first. There are R and U versions for that angle, which amount to doing the U perm from the back, and they need no set-up turn.",
        "Next, J perm endings. SolveLab's default Jb, R U R' F' R U R' U' R' F R2 U' R' U', ends with a U' built in; R U2 R' U' R U2 L' U R' U' L solves the same angle and doesn't need it. The T perm has a similar trick. R U R' U' R' F R2 U' R' U F' L' U L starts like the usual T and finishes a U2 away from it, so when the headlights match the right centre, it saves the U2 at the end.",
        "G and R perms have versions that start one U turn apart: an Rb for headlights in front as well as on the left, a Gb for headlights at the back as well as on the left. From those angles the Gb saves one U turn and the Rb saves two, a U before and a U after. Add them after the U perm, J perm and T perm ones, and only for cases you meet often.",
        "Keep a short list of the cases where you catch yourself doing U2, the algorithm, then U2 again. Learn one alternative a week, and use it in solves until it's the one your hands pick.",
      ],
      examples: [
        {
          label: "Ua, bar in front",
          moves: "R U R' U R' U' R2 U' R' U R' U R",
          note: "With the solved bar facing you, no U2 first. Right index for the U turns, left index for the U' turns.",
        },
        {
          label: "Ub, bar in front",
          moves: "R' U R' U' R' U' R' U R U R2",
          note: "The Ub for the same angle, also only R and U.",
        },
        {
          label: "Jb, other ending",
          moves: "R U2 R' U' R U2 L' U R' U' L",
          caseId: "pll-jb",
          note: "Solves the same angle as SolveLab's default Jb, without the U' the default finishes with.",
        },
        {
          label: "T perm, other ending",
          moves: "R U R' U' R' F R2 U' R' U F' L' U L",
          note: "The first nine moves are the usual T perm. The ending leaves the top a U2 away from where the usual one does.",
        },
        {
          label: "Rb, headlights in front",
          moves: "R' U2 R U2 R' F R U R' U' R' F' R2",
          caseId: "pll-rb",
          note: "One U turn from the usual Rb, which starts with the headlights on the left; from this angle the usual one needs a U before and a U after.",
        },
        {
          label: "Gb, headlights at the back",
          moves: "F' U' F R2 u R' U R U' R u' R2",
          caseId: "pll-gb",
          note: "One U turn from the usual Gb, which starts with the headlights on the left.",
        },
      ],
      checkpoint:
        "You have a list of your U2 angles, and at least one of them now has its own algorithm.",
    },
  ],
  drills: [
    {
      id: "ppll-call-it",
      title: "Call it before OLL ends",
      purpose:
        "Moves PLL recognition into the OLL, where it costs nothing, and shows you how often you manage it.",
      rules: [
        "Practise from OLL-ready scrambles, so every rep is an OLL followed by a PLL.",
        "Before your OLL's last move, say the PLL group out loud: bar (a U, J or F perm), headlights, or neither. Once that's easy, name the exact case.",
        "After the OLL, check. Keep a tally of hits and misses.",
        "Say the final U turn before you start the PLL, and check that too.",
      ],
      dose: "Fifty reps a session, a few times a week.",
      signal:
        "Your hit rate climbs past half, and on the ones you call, the gap between OLL and PLL disappears.",
      exerciseId: "oll_pll_only",
    },
    {
      id: "ppll-angle-list",
      title: "Your U2 list",
      purpose:
        "Finds the few PLL angles that actually cost you a U2, so a second algorithm goes where it pays.",
      rules: [
        "For a week, every time a PLL needs a U2 before or after it, note the case and the angle.",
        "Pick the one that comes up most and learn an alternative algorithm for that angle.",
        "Drill it on its own, then use it in solves. Add the next one a week later.",
      ],
      dose: "One new angle a week.",
      signal: "Your list shrinks, and fewer of your PLLs start or end with a U2.",
      exerciseId: "pll_only",
    },
  ],
  mistakes: [
    "Waiting for the OLL to finish before looking at the top at all.",
    "Finding the last U turn by trying one and looking.",
    "Learning every angle of every PLL instead of the few that cost a U2.",
    "Turning the cube with a y2 to match a memorised picture instead of using a U turn or another algorithm.",
    "Using a new alternative in solves before it's faster than a U2 plus the old one.",
  ],
  sources: [
    SOURCES.predictPll,
    SOURCES.feliksCommentary,
    SOURCES.pllAngles,
    SOURCES.pllAlgs,
    SOURCES.aufTips,
    SOURCES.pllRecognitionGuide,
  ],
};
