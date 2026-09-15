/** Shipped and planned work shown on the Overview page and in docs. */
export const shipped = [
  {
    version: "2.1",
    title: "Interface",
    items: [
      "Timer layout that fits the screen and spaces panels evenly as the window changes size",
      "Optional 3 decimal places for times (Appearance → Decimal places)",
      "Scramble bar and side panels tightened for short laptop screens",
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
    version: "2.2",
    title: "Hardware timer and first coach",
    items: [
      "Working Bluetooth timer connection (Stackmat / compatible devices)",
      "Initial AI coach, training plans, and lessons on device",
    ],
  },
] as const;
