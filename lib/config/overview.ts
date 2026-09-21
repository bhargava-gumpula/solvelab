/** Shipped and planned work shown on the Overview page and in docs. */
export const shipped = [
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
    version: "4.1",
    title: "Training and lessons",
    items: [
      "Training packs for each part of your solve: short lessons, drills, and a retest",
      "Train and Learn turn on",
    ],
  },
  {
    version: "4.2",
    title: "Connect your own AI",
    items: [
      "Ask the coach questions in your own words, using your own AI account or a model on your computer",
      "The chat sees only your solve profile, and can only point you at tests and packs that exist",
    ],
  },
] as const;
