/** Shipped and planned work shown on the Overview page and in docs. */
export const shipped = [
  {
    version: "2.2",
    title: "Hardware timer and first coach",
    items: [
      "Bluetooth timer mode with Stackmat-compatible Web Bluetooth when available, plus an on-device simulator",
      "Rule-based on-device coach: baseline, diagnostics, skill scores, training plans, and retest comparison",
      "Train arms exercises onto the timer; Learn ships beginner / CFOP / advanced lesson plans with local progress",
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
      "Google sign-in to unlock Coach, Train, and Learn",
      "Times stored on the Google account in Cloud Firestore, with a working copy in this browser",
      "Privacy and Terms pages",
    ],
  },
] as const;

export const planned = [
  {
    version: "2.3",
    title: "Deeper coach and hardware",
    items: [
      "Richer diagnostic set (OLL/PLL recognition timing, unlimited-inspection cross)",
      "Firestore Bluetooth pairing profiles for more timer brands",
      "Optional local ML refinements on your own solve history",
    ],
  },
] as const;
