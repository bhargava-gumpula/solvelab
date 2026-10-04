# SolveLab for Mac: the desktop app and the local AI coach

Design document, no code. Written 2026-10-04 on branch `desktop-app` (from `main` at 4a89dbf, release 5.1). Dev log entry 196.

## 0. The decision and what this plan does with it

**The owner's decision (2026-10-04):** the AI coach you talk to moves into a **SolveLab app for Mac only**. The app runs a model on the person's own Mac through **Ollama**, most likely a **Qwen** model. The website keeps everything else (timer, Learning Hub, courses, trainer, stats, sync) and loses the conversational coach.

**The short version of this plan:**

- The Mac app is **the same SolveLab website, wrapped in a thin Mac shell** (Tauri v2). One codebase builds both; a build switch turns the coach on for the app and off for the web.
- The app **talks to Ollama on the same Mac** (`localhost:11434`). It helps people install Ollama and download a model sized to their Mac's memory. Nothing about the person leaves the Mac for the coach.
- The coach reuses today's numbers-only summary (`lib/ai/context.ts`) and name checker (`lib/ai/grounding.ts`), made better with the arena's ideas: ranges, attempt counts, trends, weak cases, structured replies and a fixed set of test profiles.
- The website's "Your AI coach" page becomes a **"Get the Mac app"** page. OpenRouter sign-in, API keys and hand-off links are removed, and any saved keys are wiped from the browser.
- Releasing signed builds needs the **Apple Developer Program** ($99 a year). The owner is a minor, so **a parent has to enroll and pay**. Until then, test builds can go to friends unsigned, with a few extra clicks to open them.
- Seven phases, about **17–24 agent-days** in total, with a review stop after each.

Everything below explains the choices. Section 7 lists the decisions the owner needs to make.

---

## 1. The shell: Tauri v2 or Electron

SolveLab is a static site (`output: "export"`, `trailingSlash: true`, no server). Both shells can load the `out/` folder as the app's pages, so neither needs a rewrite. They differ in what they ship and how they reach the Mac.

### 1.1 Side by side

| | **Tauri v2** | **Electron** |
| --- | --- | --- |
| What it ships | Your pages plus a small Rust program. Uses the Mac's own browser engine (WebKit, the engine Safari uses). | Your pages plus a full copy of Chromium and Node.js. |
| Download size | About 5–15 MB for SolveLab (measured Tauri 2 installers are around 3–10 MB) | About 90–200 MB |
| Memory while running | Lower (roughly half or less) | Higher; each window is a Chromium process |
| Matches what we test today | No. Our e2e tests run Chromium only; the app would run WebKit. Needs a Safari/WebKit pass. | Yes. Same engine as the tests. |
| Feels like a Mac app | Native menus, window, Dock, notifications through plugins | Same, through Electron APIs |
| Auto-update | Built-in updater plugin. Every update is checked against its own signing key (this can't be turned off). Reads a `latest.json` that the Tauri GitHub Action produces for GitHub Releases. | `electron-updater`; on Mac it needs a properly signed app to update itself |
| Sign-in return link (`solvelab://…`) | `deep-link` plugin. Declared once in the app's config; on Mac it only works for the built app installed in `/Applications` | `app.setAsDefaultProtocolClient`, works in development too |
| Talking to Ollama | From the page, or from the Rust side. Ollama already accepts `tauri://` pages by default (see 1.3). | From the page (allowed origin `app://` or `file://`) or from Node |
| New language to learn | A little Rust (mostly config; a few dozen lines) | None (JavaScript) |
| Security model | Pages get only the native abilities you list (capabilities file) | Node.js sits next to the page; needs careful settings (context isolation, no Node in pages) |

Sources for sizes: the Tauri vs Electron comparisons by [Better Stack](https://betterstack.com/community/guides/scaling-nodejs/tauri-vs-electron-vs-deno-vs-electrobun/), [Hopp](https://www.gethopp.app/blog/tauri-vs-electron) and [Tech Insider](https://tech-insider.org/tauri-vs-electron-2026/). Updater: [Tauri updater docs](https://v2.tauri.app/plugin/updater/). Deep links: [Tauri deep-linking docs](https://v2.tauri.app/plugin/deep-linking/).

### 1.2 Recommendation: Tauri v2

Three reasons:

1. **Size fits the story.** People already download a 2.5–7 GB model. A 10 MB app next to that feels right; a 150 MB browser copy does not.
2. **Less to secure.** Tauri pages can only do what the capabilities file allows. With Electron, Node.js sits beside the page.
3. **The updater is built in** and signs every update, which matters if the app ships unsigned for a while (section 5).

**What we give up:** our tests run in Chromium, and the app would run in WebKit. SolveLab uses WebGL (the 3D cube and cubing.js), `backdrop-filter` glass, IndexedDB and motion, and all of these work in Safari, but nobody has checked SolveLab there. Phase 1 starts with that check. If WebKit turns out badly broken, switching to Electron is cheap at that point, because the web code doesn't change; only the thin shell does.

### 1.3 How the app talks to Ollama

Ollama is a small server on the same Mac, at `http://127.0.0.1:11434`. SolveLab already speaks its OpenAI-style chat API (`OLLAMA_CHAT` in `lib/ai/providers.ts`).

- **Browser security (CORS).** Ollama only answers pages from origins it trusts. Its source code trusts `tauri://*`, `app://*` and `file://*` by default, besides localhost ([ollama `envconfig/config.go`, `AllowedOrigins`](https://github.com/ollama/ollama/blob/main/envconfig/config.go)). The docs only mention localhost ([Ollama FAQ](https://docs.ollama.com/faq)), so the first spike confirms it on a real build. The app's page can call Ollama directly, the person doesn't have to set `OLLAMA_ORIGINS`, and there's no Rust proxy to write.
- **The website can't do this any more.** A web page at `solvelab.bhargava-gumpula.com` is not on Ollama's list, which is part of why the web Ollama option was awkward (people had to set `OLLAMA_ORIGINS` by hand).
- **The app's security policy** (CSP) allows `http://127.0.0.1:11434` and the Supabase project URL, and nothing else.
- **API calls used:** `GET /api/version` (is Ollama running, and is it new enough), `GET /api/tags` (which models are downloaded), `POST /api/pull` (download a model; streams progress as `completed`/`total` bytes), `POST /api/chat` (the conversation; supports a JSON schema in `format` for structured replies, and `think: false` to skip Qwen's slow "thinking" mode), and `keep_alive` (how long the model stays in memory; Ollama's default is 5 minutes).

### 1.4 Signing in with Google inside the app

Today the web sign-in is Supabase with PKCE: the site sends you to Google through Supabase, which returns you to `/signed-in/` on the same site (`supabaseRedirectUrl()` in `lib/auth/actions.ts`).

In the app, two things change:

- **Google refuses sign-in inside embedded app windows** (it blocks "embedded user agents"), so the sign-in page has to open in the person's real browser (Safari or Chrome).
- The browser then needs a way **back into the app**.

| | **Custom link `solvelab://auth/callback` (deep link)** | **Loopback `http://127.0.0.1:<port>/callback`** |
| --- | --- | --- |
| How it works | Supabase sends the browser to `solvelab://auth/callback?code=…`; macOS opens SolveLab with that link; the app finishes PKCE with `exchangeCodeForSession(code)` | The app starts a tiny web server on a free port for a minute; the browser comes back to it; the app reads the code |
| Setup | Declared once in `tauri.conf.json`; add `solvelab://auth/callback` to Supabase's allowed redirect URLs | A plugin (e.g. `tauri-plugin-oauth`); add `http://127.0.0.1:*/callback` to Supabase's allowed redirect URLs |
| Testing | Only in the built app installed in `/Applications` (a macOS rule) | Works in development |
| What the person sees | Browser asks "Open SolveLab?" once, then the app comes forward | A "you can close this tab" page; they switch back by hand |
| Risk | Another app could claim the same scheme; PKCE makes a stolen code useless without the verifier, which stays in the app | A port can be busy; the server must check the `state` and shut down |

**Recommendation: the deep link**, with the `single-instance` plugin so the link reaches the running app instead of opening a second copy. PKCE already protects the code, the person comes straight back, and it is the pattern others use with Supabase and Tauri ([example write-up](https://medium.com/@nathancovey/supabase-google-oauth-in-a-tauri-2-0-macos-app-with-deep-links-f8876375cb0a); [Supabase PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)).

What changes in code: `supabaseRedirectUrl()` returns `solvelab://auth/callback` in the desktop build, and a desktop-only listener passes the link to the existing return handler (`completeSupabaseReturnFromLocation`). The anonymous-to-Google linking path (`linkIdentity`) uses the same redirect, so it carries over.

**Owner step (production change, needs approval, done through Aside):** add `solvelab://auth/callback` to the Supabase project's redirect allow-list. Google's own console doesn't change, because Google always returns to Supabase first.

**Data note:** the app is its own "browser", so its IndexedDB is separate from Safari's or Chrome's. Signed-in times sync through Supabase as usual. Times someone kept **without** an account on the website don't appear in the app; Settings → Export/Import moves them, the same as moving between browsers today.

### 1.5 The Space-bar timer rule in the app

The rule doesn't change: **only Space starts and stops the timer; mouse clicks never do.** The app uses the same `lib/timer/input.ts`, so it keeps the rule automatically, provided the shell doesn't get in the way:

- No app menu item or global shortcut may use Space (or Space with a modifier).
- Phase 1 checks that WebKit delivers `keydown`/`keyup` for Space the same way, including key repeat and the guard that skips inputs, dialogs and focused buttons.
- macOS can show an accent menu for held letter keys (not Space), and a window that just took focus from a click must not count that click as a timer action. Both get a test in the WebKit pass.
- The coach must **never generate while a solve is running.** It lives on its own page, so this is true by design. The one rule to add: if a reply is still streaming when the person goes to the Timer, stop it, so the GPU is free and nothing distracts. Timing itself uses `performance.now()` and isn't affected by load.

---

## 2. The local model

### 2.1 Use the person's Ollama, or ship our own?

| | **Guide them to install Ollama** | **Bundle Ollama inside the app** | **Bundle a model engine (llama.cpp / MLX) inside the app** |
| --- | --- | --- | --- |
| App download | ~10 MB | ~170–200 MB more (Ollama's Mac CLI is ~159 MB packed, the app ~199 MB, [v0.35.1 release](https://github.com/ollama/ollama/releases/latest)) | ~20–50 MB more |
| Licence | Nothing to do | Ollama is MIT: ship its licence notice ([LICENSE](https://github.com/ollama/ollama/blob/main/LICENSE)) | MIT (llama.cpp) or MIT (MLX): ship notices |
| Signing | Not our problem | Every bundled program must be signed and notarized with the app | Same |
| Updates | Ollama updates itself | We must ship new Ollama versions ourselves, or new Qwen models stop loading (Qwen 3.5 needs Ollama 0.17.4 or newer) | We maintain model loading ourselves |
| If they already use Ollama | Shares their models, no second copy | Two copies of Ollama and possibly of the models (gigabytes) | Two copies of the models |
| First-run effort | One extra install (a .dmg, drag to Applications) | None | None |
| Work for us | Small | Medium (start, stop and supervise a background server) | Large |

**Recommendation: guide them to install Ollama** for the first release. It is the least work, has no licence or signing burden, and doesn't duplicate gigabytes for people who already use Ollama. If testers get stuck on the install, bundling Ollama is the next step (the MIT licence allows it).

Ollama for Mac needs **macOS 14 Sonoma or newer**. On Apple silicon it uses the GPU; on Intel Macs it runs on the CPU only ([Ollama macOS docs](https://docs.ollama.com/macos)). It stores models in `~/.ollama`.

### 2.2 Which model, by memory

Verified on ollama.com on 2026-10-04. Sizes are the downloads at Ollama's default 4-bit quantisation (`q4_K_M`); each also exists as `q8_0` (bigger, slightly better) and full precision.

| Family (licence) | Tag | Download | Context | Notes |
| --- | --- | --- | --- | --- |
| Qwen 3 (Apache-2.0) | `qwen3:1.7b` | 1.4 GB | 40K | Older, text only, works on any recent Ollama |
| | `qwen3:4b` | 2.5 GB | 256K | |
| | `qwen3:8b` | 5.2 GB | 40K | |
| Qwen 3.5 (Apache-2.0, Feb 2026) | `qwen3.5:2b` | 2.7–3.1 GB | 256K | Newer; reads images too; needs Ollama ≥ 0.17.4 |
| | `qwen3.5:4b` | 3.3–4.0 GB | 256K | |
| | `qwen3.5:9b` | 6.6–7.6 GB | 256K | |
| Qwen 3.6 / 3.8 | `27b` and up | 17–24 GB | 256K | Too big for a 24 GB laptop alongside the app |

Sources: [ollama.com/library/qwen3/tags](https://ollama.com/library/qwen3/tags), [ollama.com/library/qwen3.5/tags](https://ollama.com/library/qwen3.5/tags), [qwen3.8](https://ollama.com/library/qwen3.8), licences from the Hugging Face model cards ([Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B), [Qwen3.5-4B](https://huggingface.co/Qwen/Qwen3.5-4B)).

**Speed (estimates, not measured on an M5):** on an M4 MacBook Air, published figures are about **38–45 tokens/s for Qwen 3.5 4B** and **17–22 tokens/s for Qwen 3 8B** ([modelfit.io, MacBook Air M4](https://modelfit.io/blog/best-llm-macbook-air-m4-16gb/); [llmcheck.net Apple silicon benchmarks](https://llmcheck.net/benchmarks)). A coaching reply is about 150–300 tokens, so roughly **4–8 seconds for a 4B model and 8–15 seconds for an 8–9B model**, plus a few seconds the first time the model loads. Ollama's newer MLX backend is reported to be much faster on Apple silicon. Phase 3 measures on the owner's M5 Air (24 GB) and replaces these numbers.

**The plan by memory** (the app reads the Mac's memory size from the Rust side):

| Mac memory | Default | Offered as "better answers, slower" |
| --- | --- | --- |
| 8 GB | `qwen3.5:2b` (≈3 GB) | none |
| 16 GB | `qwen3.5:4b` (≈3.5 GB) | none |
| 24 GB and up (the owner's Mac) | `qwen3.5:4b` | `qwen3.5:9b` (≈7 GB) |
| Ollama older than 0.17.4 | ask them to update Ollama; meanwhile `qwen3:4b` | |

**Why 4B and not 9B as the default:** speed matters more than polish for a coach you chat with, the answers are short and fenced in by our data and catalogue, and the eval set (section 3.3) will show whether 4B is good enough. If 4B fails the eval and 9B passes, the default changes; that's a one-line config change.

Rules that keep it honest:

- **Pin the model by tag in one config file** (`lib/config/coach.ts` or similar). A new model goes in only after it passes the eval set.
- **Turn Qwen's thinking mode off** (`think: false`) for normal replies. It adds long hidden reasoning, which is slow on a laptop.
- Pick 4-bit (`q4_K_M`). `q8_0` roughly doubles the download for a small gain.

### 2.3 First run, step by step

The coach page in the app checks three things in order and shows exactly one next step:

1. **Is Ollama running?** (`GET /api/version`) If not:
   - Not installed: "The coach runs on your Mac with a free program called Ollama." Button: **Download Ollama** (opens `ollama.com/download` in the browser). A short guide follows: open the .dmg, drag to Applications, open it once. The page checks again every few seconds and moves on when it answers.
   - Installed but closed: "Open Ollama" (the app can launch `/Applications/Ollama.app`).
   - Too old for Qwen 3.5: "Update Ollama" with the same button.
2. **Is the model there?** (`GET /api/tags`) If not: "Download the coach model, 3.5 GB, about 5 minutes on fast Wi-Fi" with the size shown first, a **Download** button, a progress bar from `/api/pull`, and **Cancel**. Big downloads only start when the person presses the button. If their disk is nearly full, say so before starting.
3. **Ready.** A one-time welcome that says what the coach knows (the numbers summary, which they can open and read) and that nothing leaves the Mac.

**When Ollama is missing or stops**, everything except the chat keeps working: timer, Hub, courses, trainer, stats, sync, and the guided Coach page with its rule-based tips (`/coach/`, `data/coach/tips.ts`). The chat page shows the setup step again. It never falls back to an online AI.

---

## 3. The coach itself

### 3.1 What we reuse

- **`lib/ai/context.ts`** stays the single source of what the AI is told: numbers and choices only (goal, average, course, the 15-part solve profile, the Hub path, the Hub questionnaire), never names, emails, notes, scrambles or raw solves. `coachSystemPrompt()` and `catalogue()` stay. The existing unit test that guards "numbers only" stays and grows.
- **`lib/ai/grounding.ts`** (`unknownReferences`) keeps flagging pack, test or drill names that SolveLab doesn't have.
- **`streamChat()` and `parseStream()`** in `lib/ai/providers.ts` already speak Ollama's OpenAI-style API. The OpenRouter, API-key and hand-off code goes (section 4).
- **`components/hub/ai-answer.tsx`** keeps rendering replies as text only (no HTML from the model).

Because the model now runs locally, the old reasons to keep the prompt tiny (pasted URL length, paid tokens) are gone. The only limit is speed: a longer prompt takes longer to read. Keep it under about 3,000 tokens.

### 3.2 The arena's improvements that apply

The AI-use arena (2026-10-01, `.arena/run-20261001-135715-s261549`; it never picked a final champion, but the strong entries agree on these points) proposed making "Your AI coach" grounded, level-aware and tested. All of them carry over to the local coach, and a smaller model needs them even more:

| Improvement | What it means | Where | In the app? |
| --- | --- | --- | --- |
| **Range** | Each part of the profile says how sure it is: "lookahead 1.9 s ± 0.5 s, likely slow", not a flat "slow" | `context.ts` (from each aspect's range and samples) | Yes |
| **Attempts** | How many attempts each number rests on, so the coach says "retake this first" when data is thin | `context.ts` | Yes |
| **Trend** | Change since the last profile snapshot or daily check ("cross 2.4 → 2.1 s over three weeks") | `context.ts` from `profileSnapshots` / `dailyChecks` | Yes |
| **Weak cases** | The person's slowest recognition cases (e.g. three PLLs) so advice can be specific | `context.ts` from `lib/hub/recognition-stats.ts` | Yes |
| **"Not yet" list** | What the course says to leave alone at their level (no ZBLL at sub-30), currently never given to the AI | `context.ts` from `notYet` in `data/training/levels.ts` | Yes, and it matters most for a small model |
| **Structured replies** | The model returns JSON: a short answer, then 1–3 suggestions, each with a pack or test **id**, a one-line reason and a confidence word. The app checks ids against the catalogue and renders real links. | Ollama `format` (JSON schema); a parser beside `grounding.ts` | Yes. Free-text follow-up questions still get a plain answer, still checked by `unknownReferences` |
| **Algorithm guard** | Flag any move sequence in a reply and point to the algorithm bank instead, because small models invent algorithms | `grounding.ts` | Yes |
| **Fixed eval profiles** | About 30 made-up profiles (a sub-30 cuber with slow cross, a sub-12 cuber who's stuck, a newcomer with thin data, …) with "must say" and "must never say" checks ("never suggests ZBLL below sub-15", "only names real packs", "says the data is thin") | `tests/fixtures/coach-profiles/`, `npm run coach:eval` | Yes; see 3.3 |
| Weekly "what changed" review | Statistics first, words second | `lib/coach/weekly.ts` | Later; not needed for the first app |
| MCP connector for Claude/ChatGPT | Remote server reading the profile | Cloudflare Worker | **No.** It contradicts "everything stays on the Mac" and needs a server |

### 3.3 Testing the coach

- **Every run, no network (in `npm run validate`):** the context builder, the JSON parser, the catalogue check and the algorithm guard run against the fixed profiles with good and bad sample replies. This tests our code, not the model.
- **On demand, on the owner's Mac:** `npm run coach:eval` sends the ~30 profiles to the local Ollama model and scores them automatically: zero unknown names, zero invented algorithms, the first suggestion matches the profile's weakest part (or explains why not), thin data is mentioned when it's thin. Pass mark: at least 95% and **zero** "must never" breaks. Run it before any prompt or model change. It costs nothing because it's local.
- **By hand:** the owner reads about 20 answers for cube mistakes (wrong orientation, invented numbers). Zero tolerated.

The profiles are made-up fixtures and are never written to any production table.

### 3.4 Where the chat lives

- It replaces "Your AI coach" at **`/hub/ask/`** in the Learning Hub's Coach section (`lib/config/navigation.ts` already matches `/coach` and `/hub/ask`). No new top-level place: the site stays Timer and Learning Hub.
- **Short entry points** where advice is most useful: a "Ask the coach about this" button on the solve profile (`/hub/profile/`) and at the end of a skill test result, opening the chat with that question filled in. Mouse clicks there never touch the timer.
- **Saved conversations, on the Mac only:** a new IndexedDB table (schema v11, a versioned migration with a test, like every earlier one) holding the app's chats. Not synced to Supabase, so they stay on the device. "Clear coach chats" goes in Settings → Your data.
- The existing `coachThreads` table (v6) belongs to the guided Coach page's own conversation, not to the AI chat. It isn't touched.

### 3.5 Privacy: everything stays on the Mac

- The coach's prompt, the person's questions and the replies go only to `127.0.0.1:11434`. The app's security policy blocks every other address except Supabase (for sync, which already exists) and the update check.
- The only new network use is **downloading the model** from Ollama's registry. That sends no SolveLab data.
- Chats are stored only in the app's IndexedDB. The coach training data share (anonymous test results, opt-out) is unchanged and has nothing to do with chats.
- The page that explains it shows the exact summary the model receives, so people can see "numbers only" for themselves.

### 3.6 Voice

"You talk to it, it talks back" here means typing and reading. Speaking out loud is possible later with macOS's built-in dictation and speech voices, which also run on the Mac. Recommendation: text first, voice as a later phase (decision D11).

---

## 4. Website changes

### 4.1 One codebase, two builds

Add one build switch, `NEXT_PUBLIC_SOLVELAB_TARGET=web|desktop` (default `web`), read in one place (`lib/config/platform.ts`), and one feature flag in `lib/config/features.ts`:

| Setting | Web build | Mac app build |
| --- | --- | --- |
| `features.coachChat` | off | on |
| `features.offline` (service worker) | on | **off** (the app's pages are already on the Mac, and WebKit doesn't run service workers on the app's own `tauri://` scheme) |
| Sign-in redirect | `https://…/signed-in/` | `solvelab://auth/callback` |
| "Get the Mac app" links | shown | hidden |
| Scripts | `npm run build` → `out/` (unchanged) | `npm run build:desktop` → `out/`, then `tauri build` |

Because the pages are a static export, the desktop build is the same `out/` folder built with different switches. Pages, timer and Hub code don't fork. The Tauri project lives in `src-tauri/` in this repo.

### 4.2 Replacing the web coach

- **`/hub/ask/` becomes "Get the Mac app"**: what the coach does, "runs on your Mac, private, free", what's needed (an Apple-silicon Mac with macOS 14+, about 4–8 GB of free disk for the model), a download button, and a plain note that the website keeps everything else. On a phone or a Windows PC it says the coach is Mac only. The Hub's Coach section shows it the same way.
- **Remove** the OpenRouter sign-in, the API-key setup (`lib/ai/keys.ts`, `components/hub/api-key-setup.tsx`), the hand-off links and the web Ollama option, with their tests. `context.ts`, `grounding.ts` and the streaming parser stay (the app uses them).
- **Wipe saved secrets once:** on the first visit after the change, the site deletes `solvelab.ai.openrouter`, `solvelab.ai.apiKey` and `solvelab.ai.openrouterVerifier` from localStorage and shows a one-time note: "The AI coach moved to the Mac app. Your saved OpenRouter or API key was removed from this browser; you can revoke it on the provider's site." Leaving dead keys in browsers would be a privacy risk.
- **Saved conversations:** the web "Your AI coach" never saved its chats (they lived only in the open page), so there's nothing to migrate. The guided Coach page's `coachThreads` stay as they are.
- **Timing:** the web change goes live **the same day the app can be downloaded**, so the coach is never simply missing.

### 4.3 Privacy Policy and Terms

The Privacy Policy (`app/privacy/page.tsx`) currently doesn't mention the outside-AI paths (OpenRouter, API keys, hand-off) at all, so the web change also closes that gap. New text:

- **Privacy, new section "The coach in the Mac app":** the coach runs on your Mac through Ollama; your questions, the replies and your numbers summary are not sent to SolveLab or anyone else; chats are stored only on your Mac and can be cleared in Settings; the app downloads the model from Ollama's servers, which see your IP address like any download; Ollama is a separate program with its own privacy terms.
- **Privacy, "The app":** the app keeps your data in its own storage on the Mac; signed-in times sync to your Supabase account exactly like the website; the app checks for updates (sending its version number).
- **Terms:** the coach's advice is generated by an AI model and can be wrong; check algorithms in the algorithm bank; the app is provided as-is; Ollama and Qwen are third-party software under their own licences (MIT and Apache-2.0), and SolveLab ships notices for them.

These are short edits. The existing open item still stands: the owner should get a quick review of the legal text before launch (HANDOFF §10).

---

## 5. Distribution

### 5.1 Signing and notarization

| | **Apple Developer Program ($99 a year)** | **Unsigned (ad-hoc signed)** |
| --- | --- | --- |
| First open | Opens normally after the download check | macOS blocks it. Since macOS 15 Sequoia, the old Control-click → Open shortcut is gone: people must try to open it, then go to **System Settings → Privacy & Security → Open Anyway**, and confirm with their password ([MacRumors](https://www.macrumors.com/2024/08/06/macos-sequoia-gatekeeper-security-change/), [Michael Tsai](https://mjtsai.com/blog/2024/07/05/sequoia-removes-gatekeeper-contextual-menu-override/)) |
| Trust | "From an identified developer", notarized by Apple | "Apple could not verify…", which looks like malware to most people |
| Auto-update | Smooth | Works through Tauri's own signed updates, but each new build may trigger the warning again |
| Fit | Public release | Friends and testers who are told what to expect |

**The owner is a minor.** Apple requires the account holder to be of legal age; a parent or guardian can enroll and let a 13–17-year-old use the account under their supervision ([Apple Developer Agreement](https://developer.apple.com/support/downloads/terms/apple-developer-agreement/Apple-Developer-Agreement-20250318-English.pdf); [Apple Community thread](https://discussions.apple.com/thread/255960918)). **The account, the $99 payment and the agreement are the parent's decision**, and the account would be in the parent's name (that name shows as the developer). Agents never handle the Apple ID password or the signing certificate's private key; the signing secrets go into GitHub Actions secrets entered by the account holder.

**Recommendation:** test builds go out unsigned to a few friends with a one-page "how to open it" guide. Before the public download, a parent enrolls and the app is signed and notarized. If the parent says no, the app can still ship unsigned, with the guide on the download page. That works, but expect fewer people to get through.

### 5.2 Hosting the download and updates

| | **GitHub Releases** (repo `bhargava-gumpula/solvelab`, already public) | **Cloudflare** (Pages or R2) |
| --- | --- | --- |
| Cost | Free | Free at this size |
| Updater file | `tauri-action` builds, signs and uploads the .dmg, the `.app.tar.gz` update and `latest.json` in one step | We'd upload these ourselves |
| Download link | Stable "latest" URL | Our own domain (nicer) |
| Effort | Lowest | More |

**Recommendation: GitHub Releases**, with the "Get the Mac app" page and the marketing site linking to the latest release. Builds run in GitHub Actions on a macOS runner. Pushing tags and publishing releases needs the owner's approval each time (AGENTS.md). The Tauri updater checks `latest.json` on launch, asks before installing, and refuses any update not signed with SolveLab's update key. That key is generated once, and its private half is kept by the owner as a GitHub secret.

### 5.3 Apple silicon or Intel too

Ollama on Intel Macs runs on the CPU only, so even the 2B model would be slow there. Apple's last Intel Macs are from 2020.

**Recommendation: Apple silicon only** (`aarch64-apple-darwin`). The download page says "Requires a Mac with Apple silicon (M1 or later) and macOS 14 Sonoma or later." A universal build (both chips) is possible later in Tauri if anyone asks.

### 5.4 The marketing site needs fixing

The download site in `~/Projects/solvelab-app-site` currently promises things this plan doesn't deliver:

- "Version 5.0 for **macOS, Windows and Linux**" and download buttons for all three. The app is **Mac only**.
- "macOS: **Apple silicon and Intel**". The plan is Apple silicon only.
- "**No AI inside the timer**". That's still true (the timer has none), but the app's main reason to exist is now the AI coach, so the page should say so.
- "Free, with no account needed to start" and "Works offline": still true for the timer. The coach needs Ollama and a one-time model download.
- Download links are placeholders ("Sample page").

These need updating before it goes live (decision D10).

---

## 6. Phases

Each phase ends with `npm run validate`, `npx playwright test --workers=1`, screenshots, a dev log entry and a **review stop**. Estimates are agent-days of work, not calendar days. The Cloudflare deploy of 5.1 (HANDOFF §14 B5) is still pending and should go out first, because the app syncs against Supabase.

| # | Phase | What's in it | Effort | Owner / parent steps |
| --- | --- | --- | --- | --- |
| 1 | **Spike: will it run?** | Tauri v2 shell loading `out/`; WebKit pass over Timer, Hub, lesson player (3D cube), trainer, stats; Space-bar checks; one call to a local Ollama from the app page (confirms the `tauri://` origin); a Playwright WebKit project for the main specs | 2–3 | Install Rust (one command); look at screenshots |
| 2 | **Two builds, one codebase** | `NEXT_PUBLIC_SOLVELAB_TARGET`, `lib/config/platform.ts`, `features.coachChat`, service worker off in the app, `build:desktop`, app icon, menus, window size, CSP | 2–3 | Approve app name and icon |
| 3 | **Sign-in in the app** | Deep link `solvelab://auth/callback`, single-instance, PKCE exchange through the existing return handler, anonymous-to-Google link path, tests | 2–3 | Approve the Supabase redirect allow-list change (Aside does it) |
| 4 | **Ollama setup** | Detection, install guide, "Open Ollama", version check, memory tiers, model download with progress, cancel and disk check; measure tokens/s on the M5 Air | 3–4 | Try the first run on their Mac |
| 5 | **The coach** | Context v2 (range, attempts, trend, weak cases, not-yet), structured replies, algorithm guard, chat UI at `/hub/ask/`, entry points, IndexedDB v11 chats, Settings clear, eval fixtures and `coach:eval`, model default settled by the eval | 4–6 | Read ~20 answers for cube mistakes |
| 6 | **Website changes** | "Get the Mac app" page, removal of OpenRouter / keys / hand-off, one-time key wipe and note, Privacy and Terms text | 2 | Approve the text; quick legal review |
| 7 | **Packaging and release** | `tauri-action` workflow, updater key, unsigned test build to friends, then signed and notarized build (if enrolled), GitHub Release, marketing site fixed, web change and app go live the same day | 2–3 (+ waiting on Apple) | Parent: Apple enrollment and certificates; owner: approve tag, release and deploy |

**Total: about 17–24 agent-days**, plus Apple's enrollment wait (often a day or two, sometimes longer).

### Risks

| Risk | How likely | What we do |
| --- | --- | --- |
| Something looks or behaves wrong in WebKit (3D cube, glass, motion, keyboard) | Medium | Phase 1 finds it first; Playwright gets a WebKit project; Electron stays a fallback |
| People don't get through installing Ollama | Medium | A clear guide with screenshots; measure with testers; bundling Ollama is plan B |
| A 4B model gives wrong cube advice | Medium | The "not yet" list, structured replies, catalogue and algorithm checks, and the eval set before every change; offer 9B on bigger Macs |
| Unsigned builds scare people off | High if unsigned | Parent enrollment before the public release |
| Deep link can't be tested in development | Certain | Test the built app installed in `/Applications`; a scripted check in phase 3 |
| Ollama changes its API or default origins | Low | Pin a minimum version; the spike checks the origin; the app can switch to a Rust-side call |
| The model download fails or fills the disk | Medium | Show the size first, check free space, allow cancel and resume (Ollama resumes pulls) |
| Web users on Windows, Linux or phones lose the coach | Certain (by decision) | Say so plainly on "Get the Mac app" |
| Two release trains (website and app) drift | Medium | One codebase, one version number, released together |
| Signing secrets leak | Low | Kept only in GitHub secrets by the account holder; never in the repo or in an agent's hands |

---

## 7. Decisions for the owner

Each has a recommendation; one word ("yes" or the other option) is enough.

| # | Decision | Options | Recommendation |
| --- | --- | --- | --- |
| D1 | **App shell** | Tauri v2 / Electron | **Tauri v2**: about 10 MB instead of about 150 MB, a tighter security model, a built-in signed updater. Electron only if the WebKit spike goes badly. |
| D2 | **How people get Ollama** | Guided install / bundled inside the app | **Guided install** for the first release; bundle later only if testers get stuck. |
| D3 | **Default model** | `qwen3.5:4b` / `qwen3.5:9b` / `qwen3:4b` | **`qwen3.5:4b`** (≈3.5 GB, fast), `qwen3.5:9b` offered on Macs with 24 GB or more, `qwen3.5:2b` on 8 GB Macs. Final pick after the eval set runs on your M5 Air. |
| D4 | **Which Macs** | Apple silicon only / also Intel | **Apple silicon only**, macOS 14 or newer. |
| D5 | **Apple Developer Program** ($99/yr, a parent's account) | Parent enrolls before public release / ship unsigned | **A parent enrolls before the public download**; friends test unsigned first. This is the parent's call. |
| D6 | **Where the download lives** | GitHub Releases / Cloudflare | **GitHub Releases** in the public SolveLab repo, with the Tauri updater. |
| D7 | **Sign-in return** | Deep link `solvelab://` / loopback | **Deep link**; needs one Supabase redirect allow-list change (Aside, with your approval). |
| D8 | **What the website keeps** | Remove the whole web coach / keep a "copy my summary for your own AI" button | **Remove it all**, and replace `/hub/ask/` with "Get the Mac app". Clearer message, no keys left in browsers. |
| D9 | **App chat history** | On the Mac only / synced through Supabase | **On the Mac only.** That's the privacy promise. |
| D10 | **Marketing site** | Fix before launch / launch as is | **Fix before launch**: Mac only, Apple silicon, the right version, say the app has a private AI coach. |
| D11 | **Voice** | Text first / voice in the first release | **Text first**; macOS dictation and speech as a later phase. |
| D12 | **Version and timing** | Release the web change and the app together as 6.0 / separately | **Together, as 6.0**, the same day, after the 5.1 deploy is out. |
