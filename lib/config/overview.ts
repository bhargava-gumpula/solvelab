/** Shipped and planned work shown on the Overview page and in docs. */
export const shipped = [
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
    version: "2.1",
    title: "Interface",
    items: [
      "A UI pass so the layout feels more distinct, without changing the timer or your saved times",
    ],
  },
  {
    version: "2.2 or 3.0",
    title: "Local coach",
    items: [
      "A model that runs on your device to analyze solves and suggest what to train. That is a major update and may wait for 3.0.",
    ],
  },
] as const;
