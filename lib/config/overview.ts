/** Shipped and planned work shown on the Overview page and in docs. */
export const shipped = [
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
      "Google sign-in to sync times (Coach works without an account)",
      "Times stored on the Google account in Cloud Firestore, with a working copy in this browser",
      "Privacy and Terms pages",
    ],
  },
] as const;

export const planned = [
  {
    version: "3.1",
    title: "Training",
    items: [
      "Practice each CFOP stage after the diagnostic, with slow / average / fast tags that update as you train",
      "Algorithm drills start (cases you can run, not only browse)",
    ],
  },
  {
    version: "3.2",
    title: "Learn and algorithms",
    items: [
      "Lesson plans for beginner, CFOP, and refinement",
      "Algorithm variants, diagrams, and mastery tracking",
    ],
  },
] as const;
