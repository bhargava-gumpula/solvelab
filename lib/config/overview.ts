/** Shipped and planned work shown on the Overview page and in docs. */
export const shipped = [
  {
    version: "5.0",
    title: "The Learning Hub",
    items: [
      "Two places: the Timer and the Learning Hub. The Hub places you on a course from Learn to solve to Sub-10 and walks a path of units: lessons with a question each, drills with a rule, recognition and timed sessions",
      "Units pass on a measured result: a retest against your course's line, not just reading",
      "The algorithm trainer: practise any set on a real cube from a case scramble that doesn't give the algorithm away, with the name shown, recognised yourself, or as flashcards; your slowest cases surface in the profile",
      "ZBLL (472 cases) and thousands more published algorithms for PLL, OLL, COLL and WV, including wide-move starts; your own algorithms, checked on the cube; the Fundamentals (triggers)",
      "Ask your own AI: hand-off links, OpenRouter sign-in or an API key, with the coach allowed to name only SolveLab's real packs and tests",
      "A new look: outline tiles on an animated swirl, a cover-style timer, five themes (Linen, Terracotta, Ink, Nocturne and dark Sage), and the timer reloads offline",
    ],
  },
  {
    version: "4.1",
    title: "Training packs",
    items: [
      "Forty-two training packs on Learn: fifteen for the parts of your solve, twenty-seven written for a level from 2:00 to sub-10 — lessons that explain, drills with a rule attached, and sources",
      "The trained coach model picks the packs for the parts of your solve it judges weakest, alongside the packs for your level; every other pack is a See all away, filterable by level",
      "The road from two minutes to sub-10 on Learn, with each level's packs — what matters at each speed, and what to leave alone until later",
      "Train is what you're working on: the drills you chose to practise, the packs you've started, and what your solve profile says to work on next",
      "What you have read and which drills you are practising follow your account",
    ],
  },
  {
    version: "4.0",
    title: "Algorithm bank",
    items: [
      "Every case for 2-look OLL and PLL, full OLL and PLL, F2L, COLL and Winter Variation — 233 cases and 463 algorithms, each one checked against a cube",
      "Mark each case don't know, learning or know it, and pick the algorithm your fingers like; both follow your account",
      "Case pictures drawn from the cube itself, showing only the colours the case actually fixes",
      "Coach, Stats, Train and Learn need a Google account, and signing out clears this browser",
    ],
  },
  {
    version: "3.1",
    title: "Solve profile",
    items: [
      "Ten short skill tests (cross, F2L, OLL, PLL, the joins between them, one pair, unlimited-inspection cross, turning speed) with a timer that never touches your normal solves",
      "Solve profile in Stats: 15 parts of your solve rated slow / average / fast for your goal, with how each number is worked out",
      "Quick daily check: two attempts of each test compared with your profile, with a streak and an optional reminder",
      "Every setting and choice saved and synced to your Google account",
      "Finished tests help train the coach (on by default, off anytime in Settings)",
    ],
  },
  {
    version: "3.0",
    title: "Diagnostic coach",
    items: [
      "Set a goal pace, then time Cross, Cross + first pair, F2L, OLL, and PLL",
      "Stage tags (slow / average / fast) against that goal, updated as you add diagnostic times",
      "Bluetooth timer path from 2.2, on-device coach scoring, and the existing daily timer",
    ],
  },
  {
    version: "2.2",
    title: "Hardware timer and first coach",
    items: [
      "Bluetooth timer mode with Stackmat-compatible Web Bluetooth when available, plus an on-device simulator",
      "Rule-based on-device coach: baseline, diagnostics, and skill scores",
      "Tiny local “LM” weight trainer on synthetic diagnostic features (no cloud model)",
    ],
  },
  {
    version: "2.1",
    title: "Interface",
    items: [
      "Timer layout that fits the screen and spaces panels evenly as the window changes size",
      "Optional 3 decimal places for times (Appearance → Decimal places)",
      "Scramble bar and side panels tightened for short laptop screens",
      "Panel positions sync with the Google account (inspection and other timer settings already did)",
    ],
  },
  {
    version: "2.0",
    title: "Accounts and cloud times",
    items: [
      "Daily timer with WCA inspection, sessions, penalties, stats, and JSON backup",
      "Themes, command palette, and keyboard-first timer (space to start; mouse never starts or stops)",
      "Google sign-in for Coach, Stats, Train and Learn; the timer works without an account",
      "Times stored on the Google account in Cloud Firestore, with a working copy in this browser",
      "Privacy and Terms pages",
    ],
  },
] as const;

export const planned = [
  {
    version: "5.1",
    title: "More content, deeper at the fast end",
    items: [
      "More packs and drills for sub-15 and sub-10 solvers, and cases for other methods",
      "Several Hub layouts tried against each other, and whichever wins kept",
    ],
  },
] as const;
