# SolveLab overview

Current release: **2.0 — Accounts and cloud times**. Live site: https://solvelab.bhargava-gumpula.com. In the app: Settings or `/overview/`.

## In 2.0

- Daily timer with WCA inspection, sessions, penalties, stats, and JSON backup
- Themes, command palette, and keyboard-first timer (space to start; mouse never starts or stops)
- Google sign-in to unlock Coach, Train, and Learn
- Times stored on the Google account in Cloud Firestore, with a working copy in this browser
- Privacy and Terms pages
- Sync writes only records that changed, so a new solve is one cloud write instead of rewriting the whole history

## Planned

**2.1 — Interface.** A UI pass so the layout feels more distinct, without changing the timer or saved times.

**2.2 or 3.0 — Local coach.** A model that runs on your device to analyze solves and suggest what to train. That is a major update and may wait for 3.0.

Coach, Train, Algorithms, and Learn still show planned content; they are gated behind Google sign-in.
