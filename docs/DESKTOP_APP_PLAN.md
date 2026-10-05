# SolveLab for Mac: the desktop app and the local AI coach

Design document, no code. Written 2026-10-04 on branch `desktop-app` (from `main` at 4a89dbf, release 5.1). Dev log entry 196. Reviewed and corrected the same day; the review log is at the end.

## 0. The decision and what this plan does with it

**The owner's decision (2026-10-04):** the AI coach you talk to moves into a **SolveLab app for Mac only**. The app runs a model on the person's own Mac through **Ollama**, most likely a **Qwen** model. The website keeps everything else (timer, Learning Hub, courses, trainer, stats, sync) and loses the conversational coach.

**The short version of this plan:**

- The Mac app is **the same SolveLab website, wrapped in a thin Mac shell** (Tauri v2). One codebase builds both; a build switch turns the coach on for the app and off for the web.
- The app **talks to Ollama on the same Mac** (`127.0.0.1:11434`). It helps people install Ollama and download a model sized to their Mac's memory. Nothing about the person leaves the Mac for the coach.
- The coach reuses today's numbers-only summary (`lib/ai/context.ts`) and name checker (`lib/ai/grounding.ts`), made better with the arena's ideas: ranges, attempt counts, trends, weak cases, structured replies and a fixed set of test profiles. It talks to Ollama through a new small client for Ollama's own chat API, because the existing one can't set what the coach needs.
- The website's "Your AI coach" page becomes a **"Get the Mac app"** page with a **"Copy my summary"** button for people who can't use the app. OpenRouter sign-in, API keys and hand-off links are removed, and any saved keys are wiped from the browser.
- Releasing signed builds needs the **Apple Developer Program** ($99 a year). The owner is a minor, so **a parent has to enroll, pay and do the Apple steps themselves**. Until then, test builds go to friends ad-hoc signed: opening them needs a trip to System Settings → Privacy & Security → Open Anyway and an administrator's password (a parent's, on a Mac a parent set up), and school-managed Macs may block them completely.
- The Mac app can't use **Bluetooth timers** at first (the Mac's web engine has no Web Bluetooth); see D13.
- Nine steps (seven phases, phase 5 split in two, plus a fix-up slot after phase 1), about **30–40 agent-days** in total, with a review stop after each.

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
| Matches what we test today | No. Our e2e tests run Chromium only; the app would run the Mac's WebKit (WKWebView), which Playwright's own WebKit build doesn't match exactly. Needs a WebKit pass and app-level tests. | Yes. Same engine as the tests. |
| Bluetooth timers | No. WebKit has no Web Bluetooth; it would need a native plugin (D13) | Yes, Chromium's Web Bluetooth, with a `select-bluetooth-device` handler |
| Feels like a Mac app | Native menus, window, Dock, notifications through plugins | Same, through Electron APIs |
| Auto-update | Built-in updater plugin. Every update is checked against its own signing key (this can't be turned off). Reads a `latest.json` that the Tauri GitHub Action produces for GitHub Releases. | `electron-updater`; on Mac it needs a properly signed app to update itself |
| Sign-in return link (`solvelab://…`) | `deep-link` plugin. Declared once in the app's config; on Mac it only works for the built app installed in `/Applications` | Info.plist scheme; on macOS only testable in the packaged app (same limitation as Tauri) ([Electron docs](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app)) |
| Talking to Ollama | From the page, or from the Rust side. Ollama already accepts `tauri://` pages by default (see 1.3). | From the page (allowed origin `app://` or `file://`) or from Node |
| New language to learn | A little Rust (mostly config; a few dozen lines) | None (JavaScript) |
| Security model | Pages get only the native abilities you list (capabilities file, 1.6) | Node.js sits next to the page; needs careful settings (context isolation, no Node in pages) |

Sources for sizes: the Tauri vs Electron comparisons by [Better Stack](https://betterstack.com/community/guides/scaling-nodejs/tauri-vs-electron-vs-deno-vs-electrobun/), [Hopp](https://www.gethopp.app/blog/tauri-vs-electron) and [Tech Insider](https://tech-insider.org/tauri-vs-electron-2026/). Updater: [Tauri updater docs](https://v2.tauri.app/plugin/updater/). Deep links: [Tauri deep-linking docs](https://v2.tauri.app/plugin/deep-linking/).

### 1.2 Recommendation: Tauri v2

Three reasons:

1. **Size fits the story.** People already download a 2–7 GB model. A 10 MB app next to that feels right; a 150 MB browser copy does not.
2. **Less to secure.** Tauri pages can only do what the capabilities file allows. With Electron, Node.js sits beside the page.
3. **The updater is built in** and signs every update, which matters if the app ships without Apple signing for a while (section 5).

**What we give up:**

- **Testing in the same engine.** Our tests run in Chromium, and the app would run in WebKit. SolveLab uses WebGL (the 3D cube and cubing.js), `backdrop-filter` glass, IndexedDB and motion, and all of these work in Safari, but nobody has checked SolveLab there. Phase 1 starts with that check, and from Phase 2 an app-level test suite runs against the real app (section 6). If WebKit turns out badly broken, switching to Electron is cheap at that point, because the web code doesn't change; only the thin shell does.
- **Bluetooth timers.** The website's Bluetooth timer path (GAN and other smart timers, `lib/timer/devices/adapters.ts`) needs Web Bluetooth, which WebKit doesn't have; the code quietly returns nothing when `navigator.bluetooth` is missing. In the app that option either disappears or needs a native Bluetooth plugin. Electron would keep it. Decision D13.

### 1.3 How the app talks to Ollama

Ollama is a small server on the same Mac, at `http://127.0.0.1:11434` (its default address). Today the website calls it at `http://localhost:11434/v1/chat/completions` (`OLLAMA_CHAT` in `lib/ai/providers.ts`), Ollama's OpenAI-compatible endpoint. The app uses **one base URL constant, `http://127.0.0.1:11434`**, for every call and for the app's security policy. (A security policy matches host names literally, so `localhost` and `127.0.0.1` count as different hosts.)

- **Browser security (CORS).** Ollama only answers pages from origins it trusts. Its source code trusts `tauri://*`, `app://*` and `file://*` by default, besides localhost ([ollama `envconfig/config.go`, `AllowedOrigins`](https://github.com/ollama/ollama/blob/main/envconfig/config.go)). The docs only mention localhost ([Ollama FAQ](https://docs.ollama.com/faq)), so the first spike confirms it on a real build. The app's page can call Ollama directly, the person doesn't have to set `OLLAMA_ORIGINS`, and there's no Rust proxy to write.
- **The website can't do this any more.** A web page at `solvelab.bhargava-gumpula.com` is not on Ollama's list, which is part of why the web Ollama option was awkward (people had to set `OLLAMA_ORIGINS` by hand).
- **Which API: Ollama's own `POST /api/chat`**, not the OpenAI-compatible `/v1/chat/completions` the website uses today. Only the native API lets the app set the context size per request (`options.num_ctx`); the `/v1` endpoint can't ([Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility)). It also takes a JSON schema in `format` (structured replies), `think: false` (skips Qwen's slow "thinking" mode), `options.num_predict` (a cap on reply length) and `keep_alive` (how long the model stays in memory; Ollama's default is 5 minutes). It streams newline-delimited JSON (`{"message":{"content":…},"done":false}`), not the `data:` lines that `parseStream()` reads, so the app gets a small new client with its own line reader ([`/api/chat` docs](https://docs.ollama.com/api/chat)).
- **Other calls:** `GET /api/version` (is Ollama running, and is it new enough), `GET /api/tags` (which models are downloaded, with their digests), `POST /api/pull` (download a model; streams progress as `completed`/`total` bytes).
- **Context size.** Ollama doesn't use the model's maximum context. When the GPU memory it sees is under 24 GiB it defaults to **4K tokens** ([Ollama context length](https://docs.ollama.com/context-length)); on Apple silicon that's a share of the Mac's memory, so it covers every Mac in the tier table, the owner's 24 GB M5 Air included. A longer prompt is silently cut from the start, which is where the summary and catalogue sit. So the app sends `options.num_ctx: 8192` on every request, keeps the history to the last few turns plus the fixed summary, reads `prompt_eval_count` from the last chunk of each reply, and trims or warns when it nears the limit.

### 1.4 Signing in with Google inside the app

Today the web sign-in is Supabase with PKCE: the site sends you to Google through Supabase, which returns you to `/signed-in/` on the same site (`supabaseRedirectUrl()` in `lib/auth/actions.ts`).

In the app, two things change:

- **Google refuses sign-in inside embedded app windows** (it blocks "embedded user agents"), so the sign-in page has to open in the person's real browser (Safari or Chrome).
- The browser then needs a way **back into the app**.

| | **Custom link `solvelab://auth/callback` (deep link)** | **Loopback `http://127.0.0.1:<port>/callback`** |
| --- | --- | --- |
| How it works | Supabase sends the browser to `solvelab://auth/callback?code=…`; macOS opens SolveLab with that link; the app finishes PKCE with `exchangeCodeForSession(code)` | The app starts a tiny web server on a free port for a minute; the browser comes back to it; the app reads the code |
| Setup | Declared once in `tauri.conf.json`; add the callback to Supabase's allowed redirect URLs | A plugin (e.g. `tauri-plugin-oauth`); add `http://127.0.0.1:*/callback` to Supabase's allowed redirect URLs |
| Testing | Only in the built app installed in `/Applications` (a macOS rule) | Works in development |
| What the person sees | Browser asks "Open SolveLab?" once, then the app comes forward | A "you can close this tab" page; they switch back by hand |
| Risk | Any app or web page can open the link too. PKCE makes a stolen code useless without the verifier, which stays in the app; a one-time nonce (below) makes the app ignore links it didn't ask for | A port can be busy; the server must check the `state` and shut down |

**Recommendation: the deep link.** PKCE already protects the code, the person comes straight back, and it is the pattern others use with Supabase and Tauri ([example write-up](https://medium.com/@nathancovey/supabase-google-oauth-in-a-tauri-2-0-macos-app-with-deep-links-f8876375cb0a); [Supabase PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)). On macOS the running app receives the link through the deep-link plugin's `onOpenUrl`, and `getCurrent()` at startup catches a link that launched the app from closed. The `single-instance` plugin is only needed on Windows and Linux, where a link starts a second process, so it's left out.

**What changes in code (Phase 3):**

1. **Open Google in the real browser.** Today `signInWithGoogleOnSupabase()` calls `signInWithOAuth` or `linkIdentity` (the anonymous-to-Google path) without `skipBrowserRedirect`, so supabase-js sends the current window to Google. In the app that would load Google inside the app window, which Google blocks. In the desktop build both calls pass `skipBrowserRedirect: true`, and the app opens the returned `data.url` in the person's browser through the Tauri opener plugin. The identity-taken retry (which calls `signInWithGoogleOnSupabase()` again) goes the same way. The PKCE verifier stays in the app's own storage, where the exchange runs.
2. **Finish from the link, not from the page address.** `completeSupabaseReturnFromLocation()` only runs on `/signed-in/`, reads `window.location`, and handles errors only: the code exchange is left to the client's `detectSessionInUrl`, which never sees a deep link. Add `completeSupabaseReturnFromUrl(url)`. It reads error parameters with `parseSupabaseReturnError()` and shares the error and identity-taken branch with the web function (refactored so both use it); on success it calls `exchangeCodeForSession(code)` and then does what the `/signed-in/` page does today (`takeSignInReturnPath()` and navigation). It's wired to both `onOpenUrl` and `getCurrent()`.
3. **Only act on links the app asked for.** Any web page or program can open `solvelab://auth/callback?error_code=identity_already_exists`, and the error branch would then withdraw the anonymous id's shared results, sign the person out and start a new sign-in; any other `error_description` would be shown word for word in a toast. So when a sign-in starts, the app stores a pending flow (a random nonce and the time) and sends `redirectTo: solvelab://auth/callback?flow=<nonce>`. The handler ignores any link whose host and path aren't exactly `auth/callback`, or whose nonce doesn't match a flow started in the last 10 minutes, and clears the record once it's used. Known error codes map to fixed messages; `error_description` is never shown.

**Owner step (production change, needs approval, done through Aside):** add `solvelab://auth/callback**` (the wildcard allows the nonce) to the Supabase project's redirect allow-list. Google's own console doesn't change, because Google always returns to Supabase first.

**Data note:** the app is its own "browser", so its IndexedDB is separate from Safari's or Chrome's. Signed-in times sync through Supabase as usual. Times someone kept **without** an account on the website don't appear in the app; Settings → Export/Import moves them, the same as moving between browsers today. The app's storage is tied to its **bundle identifier**: changing it later, or turning on App Sandbox (which moves storage into a container), would silently lose everything kept only in the app (times without an account, and all coach chats). Phase 2 fixes the identifier (for example `com.bhargavagumpula.solvelab`) and the docs record it as "never change"; App Sandbox only ever comes with a data-migration step. Settings → Export includes the coach chats.

### 1.5 The Space-bar timer rule in the app

The rule doesn't change: **only Space starts and stops the timer; mouse clicks never do.** The app uses the same `lib/timer/input.ts`, so it keeps the rule automatically, provided the shell doesn't get in the way:

- No app menu item or global shortcut may use Space (or Space with a modifier).
- Phase 1 checks that WebKit delivers `keydown`/`keyup` for Space the same way, including key repeat and the guard that skips inputs, dialogs and focused buttons.
- macOS can show an accent menu for held letter keys (not Space), and a window that just took focus from a click must not count that click as a timer action. Both get a test in the WebKit pass.
- The coach must **never generate while a solve is running.** It lives on its own page, so this is true by design. The rules to add: if a reply is still streaming when the person goes to the Timer, stop it, so the GPU is free and nothing distracts; and on Macs with 16 GB or less, opening the Timer also tells Ollama to unload the model (`keep_alive: 0`), so 2–7 GB isn't held in memory beside the 3D cube.
- Timing uses each key event's own timestamp (`event.timeStamp`, through `eventTimestamp()`), which isn't affected by load. If the stamp fails its sanity check, the code falls back to `performance.now()` at the moment the handler runs, which is affected by load. Phase 1 checks in the real app window (not Playwright's WebKit) that Space keydown and keyup take the `event.timeStamp` branch, and measures the timing error with a deliberately busy main thread (about 50 ms of work).

### 1.6 App security: the policy and the capabilities

The repo has no Content Security Policy today, so the app's policy is the first one these pages will run under. Phase 2 writes it out in full and checks it with a sweep of every route for policy violations (in the app test suite, section 6):

- `default-src 'self'`
- `connect-src ipc: http://ipc.localhost http://127.0.0.1:11434 https://<project>.supabase.co` (the first two are Tauri's own messaging, [Tauri CSP docs](https://v2.tauri.app/security/csp/); the Ollama address comes from the same constant as the code)
- `worker-src 'self' blob:` (the cubing.js workers), `img-src 'self' data: blob:`, `style-src 'self' 'unsafe-inline'` (motion and inline styles), and `'wasm-unsafe-eval'` in `script-src` only if cubing.js needs it
- Tauri adds hashes and nonces to the policy when it bundles the pages, and a browser ignores `'unsafe-inline'` once a nonce is present, so the sweep is what decides the final `style-src`.

The **capabilities file** lists only: deep-link listening; the opener plugin's `open_url`, limited to `https` URLs (the Supabase sign-in page, `ollama.com/download`, source links), with its interception of `target="_blank"` links turned on (without it, external links such as the source links in `components/train/pack-detail.tsx` do nothing in the app); and no file-system or shell plugins. Launching Ollama, reading the Mac's memory size and checking free disk space are fixed Rust commands that take no paths from the page, so even an HTML-injection bug couldn't make the app open an arbitrary program.

### 1.7 Keyboard and VoiceOver

Moving from Chromium to WebKit changes keyboard navigation: by default, Tab in a Mac web view doesn't move to links and form controls (`WKPreferences.tabFocusesLinks` is off, like Safari without "Press Tab to highlight each item"). Keyboard-only users can get around the website today and would lose that in the app. Phase 2 turns `tabFocusesLinks` on through wry's `with_webview`. Phase 1's WebKit pass includes a keyboard-only walk and a VoiceOver walk of the Timer, the Hub and the lesson player, and the chat UI in Phase 5b gets live-region and focus handling (section 6).

---

## 2. The local model

### 2.1 Use the person's Ollama, or ship our own?

| | **Guide them to install Ollama** | **Bundle Ollama inside the app** | **Bundle a model engine (llama.cpp / MLX) inside the app** |
| --- | --- | --- | --- |
| App download | ~10 MB | ~170–200 MB more (Ollama's Mac CLI is ~159 MB packed, the app ~199 MB, [v0.35.1 release](https://github.com/ollama/ollama/releases/latest)) | ~20–50 MB more |
| Licence | Nothing to do | Ollama is MIT: ship its licence notice ([LICENSE](https://github.com/ollama/ollama/blob/main/LICENSE)) | MIT (llama.cpp) or MIT (MLX): ship notices |
| Signing | Not our problem | Every bundled program must be signed and notarized with the app | Same |
| Updates | Ollama updates itself | We must ship new Ollama versions ourselves, or new Qwen models stop loading (the small Qwen 3.5 models need Ollama 0.17.5 or newer) | We maintain model loading ourselves |
| If they already use Ollama | Shares their models, no second copy | Two copies of Ollama and possibly of the models (gigabytes) | Two copies of the models |
| First-run effort | One extra install (a .dmg, drag to Applications) | None | None |
| Work for us | Small | Medium (start, stop and supervise a background server) | Large |

**Recommendation: guide them to install Ollama** for the first release. It is the least work, has no licence or signing burden, and doesn't duplicate gigabytes for people who already use Ollama. If testers get stuck on the install, bundling Ollama is the next step (the MIT licence allows it).

Ollama for Mac needs **macOS 14 Sonoma or newer**. On Apple silicon it uses the GPU; on Intel Macs it runs on the CPU only ([Ollama macOS docs](https://docs.ollama.com/macos)). It stores models in `~/.ollama`.

**Minimum Ollama version: 0.17.5.** 0.17.4 added the Qwen 3.5 family, but the 2B, 4B and 9B sizes arrived in 0.17.5, which also fixed a crash when the model is split across GPU and CPU and a repetition bug ([v0.17.5 notes](https://github.com/ollama/ollama/releases/tag/v0.17.5)). The final floor is the Ollama version the Phase 5a eval runs on.

### 2.2 Which model, by memory

Verified on ollama.com on 2026-10-04 ([qwen3.5 tags](https://ollama.com/library/qwen3.5/tags)). Each Qwen 3.5 size has explicit variant tags: `-q4_K_M` (4-bit, llama.cpp engine), `-q8_0` (8-bit), `-mlx` (Apple's MLX engine) and `-bf16` (full precision). **The bare tags are not fixed builds:** `qwen3.5:4b` points at two variants (MLX and llama.cpp), lists a size range, and was republished on 2026-10-04, and Ollama 0.40 (a release candidate) runs supported models on MLX by default on Apple silicon ([v0.40.0-rc2](https://github.com/ollama/ollama/releases/tag/v0.40.0-rc2)). So the same bare tag can mean different weights and a different engine depending on the person's Ollama and the date. Also, bare `qwen3.5:2b` is **8-bit** (Q8_0, 2.7 GB), not 4-bit ([qwen3.5:2b](https://ollama.com/library/qwen3.5:2b)). Every Qwen 3.5 download carries a ~670 MB image reader stored at full precision in every variant, so 8-bit is about 1.5× the 4-bit download, not double.

| Family (licence) | Tag | Download | Max context | Notes |
| --- | --- | --- | --- | --- |
| Qwen 3 (Apache-2.0) | `qwen3:1.7b` | 1.4 GB | 40K | Older, text only, works on any recent Ollama |
| | `qwen3:4b` | 2.5 GB | 256K | |
| | `qwen3:8b` | 5.2 GB | 40K | |
| Qwen 3.5 (Apache-2.0, Feb 2026) | `qwen3.5:2b-q4_K_M` | 1.9 GB | 256K | Newer; reads images too; needs Ollama ≥ 0.17.5. (`2b-q8_0` and bare `2b`: 2.7 GB) |
| | `qwen3.5:4b-q4_K_M` | 3.3 GB | 256K | `4b-mlx` 4.0 GB, `4b-q8_0` 5.2 GB |
| | `qwen3.5:9b-q4_K_M` | 6.6 GB | 256K | `9b-mlx` 8.9 GB, `9b-q8_0` 10 GB |
| Qwen 3.6 / 3.8 | `27b` and up | 17–24 GB | 256K | Too big for a 24 GB laptop alongside the app |

"Max context" is the model's limit; the app sets 8K itself (1.3). Sources: [ollama.com/library/qwen3/tags](https://ollama.com/library/qwen3/tags), [ollama.com/library/qwen3.5/tags](https://ollama.com/library/qwen3.5/tags), [qwen3.8](https://ollama.com/library/qwen3.8), licences from the Hugging Face model cards ([Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B), [Qwen3.5-4B](https://huggingface.co/Qwen/Qwen3.5-4B)).

**Speed (estimates, not measurements):** the figures found online are computed from memory bandwidth, not measured: about **40 tokens/s for Qwen 3.5 4B** on a base M4 ([llmcheck.net](https://llmcheck.net/benchmarks), marked "estimated") and about **15–20 tokens/s for Qwen 3.5 9B** on an M4 MacBook Air ([modelfit.io](https://modelfit.io/blog/best-llm-macbook-air-m4-16gb/), "Tokens/sec (est.)"). At those rates a 150–300-token reply takes roughly **4–8 seconds on 4B and 8–20 seconds on 9B** once it starts. That leaves out two waits before the first word: reading the prompt (up to about 3,000 tokens on the first turn and after every unload) and loading a 2–7 GB model from disk when it isn't in memory, which is slower on 8 GB Macs under memory pressure. Phase 4 measures **time to the first word and generation speed** (`ollama run --verbose` prints both), cold and warm, with the real prompt, for both the llama.cpp and MLX variants, on the owner's M5 Air (24 GB) and on an 8 or 16 GB tester's Mac if one is available, and replaces these numbers.

**The plan by memory** (the app reads the Mac's memory size from the Rust side):

| Mac memory | Default | Offered as "better answers, slower" |
| --- | --- | --- |
| 8 GB | `qwen3.5:2b-q4_K_M` (1.9 GB) | none |
| 16 GB | `qwen3.5:4b-q4_K_M` (3.3 GB) | none |
| 24 GB and up (the owner's Mac) | `qwen3.5:4b-q4_K_M` | `qwen3.5:9b-q4_K_M` (6.6 GB) |
| Ollama older than the minimum | ask them to update Ollama; the chat waits until they do | |

The extra memory for the 8K context is measured in Phase 4 and added to this table. If Phase 4 shows the `-mlx` variants are clearly faster and they pass the eval, the config switches to them on purpose (they're bigger: 4.0 and 8.9 GB).

**Why 4B and not 9B as the default:** speed matters more than polish for a coach you chat with, the answers are short and fenced in by our data and catalogue, and the eval set (section 3.3) will show whether 4B is good enough. If 4B fails the eval and 9B passes, the default changes; that's a one-line config change.

Rules that keep it honest:

- **Pin explicit variant tags in one config file** (`lib/config/coach.ts`): for each tier, the tag (for example `qwen3.5:4b-q4_K_M`), the digest `/api/tags` reports for it, and its download size (the size shown before a download comes from here). After a download the app compares the digest. If it differs (Ollama republished the tag), the coach still works, but the app notes it, and the owner reruns the eval before updating the config. A new model or digest goes in only after it passes the eval set, and the eval runs on **every tag the app can pick** (2B, 4B and 9B).
- **Turn Qwen's thinking mode off** (`think: false`) for normal replies. It adds long hidden reasoning, which is slow on a laptop.
- Pick 4-bit (`q4_K_M`). `q8_0` is about 1.5× the download for a small gain.

### 2.3 First run, step by step

The coach page in the app checks three things in order and shows exactly one next step:

1. **Is Ollama running?** (`GET /api/version` at `127.0.0.1:11434`.) A server that answers counts as installed, wherever it came from (the app, Homebrew's `ollama serve`, a source build; a version of `0.0.0` from a source build is treated as "unknown, allowed"). If nothing answers:
   - **Not installed** (a fixed Rust command finds no app with Ollama's bundle id through Launch Services): "The coach runs on your Mac with a free program called Ollama." Button: **Download Ollama** (opens `ollama.com/download` in the browser). A short guide follows: open the .dmg, drag to Applications, open it once. "Installing Ollama may ask for an administrator password (to add its command-line tool); on a school or parent-managed Mac, ask whoever manages it." The page checks again every few seconds and moves on when it answers.
   - **Installed but closed** (found anywhere, `~/Applications` included): "Open Ollama" (a fixed Rust command opens it by bundle id). A Homebrew install has no app, so the page says to start it with `ollama serve`.
   - **Running on another address** (a custom `OLLAMA_HOST`): not supported in the first release; the help text says Ollama must use its default address.
   - **Too old:** "Update Ollama" with the same button.
2. **Is the model there?** (`GET /api/tags`) If not: "Download the coach model, 3.3 GB, about 5 minutes on fast Wi-Fi" with the size (from the config) shown first, a **Download** button, a progress bar from `/api/pull`, and **Cancel**. Big downloads only start when the person presses the button. If their disk is nearly full, say so before starting. The download runs in a task that outlives the page (module-level, or on the Rust side), so leaving the coach page doesn't stop it.
3. **Ready.** A one-time welcome that says what the coach knows (the numbers summary, which they can open and read) and that nothing leaves the Mac.

**While chatting**, the chat shows its state: loading the model, writing, or stopped. With no answer after 60 seconds it offers **Retry**. Ollama's error replies (not enough memory, a model deleted outside the app, …) become plain messages.

**When Ollama is missing or stops**, everything except the chat keeps working: timer, Hub, courses, trainer, stats, sync, and the guided Coach page with its rule-based tips (`/coach/`, `data/coach/tips.ts`). The chat page shows the setup step again. It never falls back to an online AI.

---

## 3. The coach itself

### 3.1 What we reuse

- **`lib/ai/context.ts`** stays the single source of what the AI is told: numbers and choices only (goal, average, course, the 15-part solve profile, the Hub path, the Hub questionnaire), never names, emails, notes, scrambles or raw solves. `coachSystemPrompt()` stays. `catalogue()` gains a structured variant that lists `id: title` pairs, so the model can return ids and the app can check them (today it lists titles only). The existing unit test that guards "numbers only" stays and grows.
- **`lib/ai/grounding.ts`** (`unknownReferences`) keeps flagging pack, test or drill names that SolveLab doesn't have.
- **Not reused as they are:** `streamChat()` and `parseStream()` in `lib/ai/providers.ts` call the `/v1` endpoint with a fixed body (model, messages, stream) and read SSE `data:` lines. Phase 5a adds a small native `/api/chat` client beside them: a newline-delimited JSON reader (`message.content`, `done`, `prompt_eval_count`), and `format`, `think`, `options.num_ctx`, `options.num_predict` and `keep_alive` passed through, with tests. The OpenRouter, API-key and hand-off code goes (section 4).
- **`components/hub/ai-answer.tsx`** keeps rendering free-text replies as text only (no HTML from the model). Structured replies get their own component (3.2).

Because the model now runs locally, the old reasons to keep the prompt tiny (pasted URL length, paid tokens) are gone. The limits now are speed (a longer prompt takes longer to read) and the 8K context the app sets (1.3). Keep the prompt under about 3,000 tokens.

### 3.2 The arena's improvements that apply

The AI-use arena (2026-10-01, `.arena/run-20261001-135715-s261549`; it never picked a final champion, but the strong entries agree on these points) proposed making "Your AI coach" grounded, level-aware and tested. All of them carry over to the local coach, and a smaller model needs them even more:

| Improvement | What it means | Where | In the app? |
| --- | --- | --- | --- |
| **Range** | Each part of the profile says how sure it is: "lookahead 1.9 s ± 0.5 s, likely slow", not a flat "slow" | `context.ts` (from each aspect's range and samples) | Yes |
| **Attempts** | How many attempts each number rests on, so the coach says "retake this first" when data is thin | `context.ts` | Yes |
| **Trend** | Change since the last profile snapshot or daily check ("cross 2.4 → 2.1 s over three weeks") | `context.ts` from `profileSnapshots` / `dailyChecks` | Yes |
| **Weak cases** | The person's slowest recognition cases (e.g. three PLLs) so advice can be specific | `context.ts` from `lib/hub/recognition-stats.ts` | Yes |
| **"Not yet" list** | What the course says to leave alone at their level (no ZBLL at sub-30), currently never given to the AI | `context.ts` from `notYet` in `data/training/levels.ts` | Yes, and it matters most for a small model |
| **Structured replies** | The model returns JSON: a short `answer` first, then 1–3 suggestions, each with a pack or test **id** (from the `id: title` catalogue), a one-line reason and a confidence word. While it streams, a small partial-JSON reader shows only the `answer` text; the suggestions appear when the JSON is complete, rendered by a new component that maps ids to `unitHref(pack)` / `testHref(testId)` and drops unknown ids. If the JSON doesn't parse (for example a reply cut off by the length cap), the raw text is shown, still checked by `unknownReferences`. `num_predict` leaves headroom. | Ollama `format` (JSON schema, `answer` first); a parser beside `grounding.ts`; a suggestions component beside `ai-answer.tsx` | Yes. Free-text follow-up questions still get a plain answer, still checked by `unknownReferences` |
| **Algorithm guard** | Flag any move sequence in a reply and point to the algorithm bank instead, because small models invent algorithms | `grounding.ts` | Yes |
| **Fixed eval profiles** | About 30 made-up profiles (a sub-30 cuber with slow cross, a sub-12 cuber who's stuck, a newcomer with thin data, …) with "must say" and "must never say" checks ("never suggests ZBLL below sub-15", "only names real packs", "says the data is thin") | `tests/fixtures/coach-profiles/`, `npm run coach:eval` | Yes; see 3.3 |
| Weekly "what changed" review | Statistics first, words second | `lib/coach/weekly.ts` | Later; not needed for the first app |
| MCP connector for Claude/ChatGPT | Remote server reading the profile | Cloudflare Worker | **No.** It contradicts "everything stays on the Mac" and needs a server |

### 3.3 Testing the coach

- **Every run, no network (in `npm run validate`):** the context builder, the NDJSON reader, the JSON and partial-JSON parsers, the catalogue check and the algorithm guard run against the fixed profiles with good and bad sample replies. This tests our code, not the model.
- **On demand, on the owner's Mac:** `npm run coach:eval` sends the ~30 profiles to the local Ollama model and scores them automatically: zero unknown names, zero invented algorithms, the first suggestion matches the profile's weakest part (or explains why not), thin data is mentioned when it's thin. It includes a long multi-turn case that checks the reply still uses the profile after many turns (the context limit, 1.3). It runs on every pinned tag (2B, 4B and 9B) and records the Ollama version and model digest. Pass mark: at least 95% and **zero** "must never" breaks. Run it before any prompt, model or digest change. It costs nothing because it's local.
- **By hand:** the owner reads about 20 answers for cube mistakes (wrong orientation, invented numbers). Zero tolerated.

The profiles are made-up fixtures and are never written to any production table.

### 3.4 Where the chat lives

- It replaces "Your AI coach" at **`/hub/ask/`**, which sits under the Learning Hub's **Profile** section (in `lib/config/navigation.ts` the Profile item already matches `/coach` and `/hub/ask`; there is no separate Coach section). No new top-level place: the site stays Timer and Learning Hub. If a separate Coach entry is wanted, the navigation change goes into Phase 5b.
- **Short entry points** where advice is most useful. The solve profile already has one ("Ask your AI coach about this profile", `profile-ask-ai` in `components/hub/hub-profile.tsx`); it's reworded, gated by `features.coachChat`, and opens the chat with that question filled in. A new one goes at the end of a skill test result. Mouse clicks there never touch the timer.
- **Saved conversations, on the Mac only:** a new IndexedDB table (schema v11, a versioned migration with a test, like every earlier one) holding the app's chats. Not synced to Supabase, so they stay on the device. "Clear coach chats" goes in Settings → Your data.
- **Signing out deletes them.** Signing out empties every IndexedDB store (`signOutAndForget()` → `resetLocalData()`); synced tables come back from the account, but chats never do. Decision: accept that and say so. In the app, the sign-out dialog (`components/auth/sign-out-dialog.tsx`) says "Your coach chats on this Mac will be deleted", and Settings → Export includes the chats so they can be kept. A test covers both, next to the v11 migration test.
- The existing `coachThreads` table (v6) belongs to the guided Coach page's own conversation, not to the AI chat. It isn't touched.

### 3.5 Privacy: everything stays on the Mac

- The coach's prompt, the person's questions and the replies go only to `127.0.0.1:11434`. The app's security policy (1.6) blocks every other address from the page except Supabase (for sync, which already exists); the update check is made by the app's native side.
- The only new network use is **downloading the model** from Ollama's registry. That sends no SolveLab data.
- Chats are stored only in the app's IndexedDB. The coach training data share (anonymous test results, opt-out) is unchanged and has nothing to do with chats.
- The page that explains it shows the exact summary the model receives, so people can see "numbers only" for themselves.

### 3.6 Voice

"You talk to it, it talks back" here means typing and reading. Speaking out loud is possible later with **on-device speech recognition, where available**, and macOS's speech voices. macOS dictation itself can send audio to Apple, depending on the language and the Siri & Dictation settings, so voice would use only on-device recognition (for example `SFSpeechRecognizer` with `requiresOnDeviceRecognition`, from the Rust side) and stay off where that isn't available. Recommendation: text first, voice as a later phase (decision D11).

---

## 4. Website changes

### 4.1 One codebase, two builds

Add one build switch, `NEXT_PUBLIC_SOLVELAB_TARGET=web|desktop` (default `web`), read in one place (`lib/config/platform.ts`), and one feature flag in `lib/config/features.ts`:

| Setting | Web build | Mac app build |
| --- | --- | --- |
| `features.coachChat` | off | on |
| `features.offline` (service worker) | on | **off** (the app's pages are already on the Mac, and WebKit doesn't run service workers on the app's own `tauri://` scheme) |
| Sign-in redirect | `https://…/signed-in/` | `solvelab://auth/callback?flow=<nonce>` |
| "Get the Mac app" links | shown | hidden |
| Bluetooth timer option | shown | per D13 (hidden for the first release) |
| Scripts | `npm run build` → `out/` (unchanged) | `npm run build:desktop` → `out/`, then `tauri build` |

Because the pages are a static export, the desktop build is the same `out/` folder built with different switches. Pages, timer and Hub code don't fork. The Tauri project lives in `src-tauri/` in this repo.

**Two things a fresh build machine needs.** npm runs the `prebuild` hook (`npm run vendor`, which bundles cubing.js into the gitignored `public/vendor/`) only for a script named `build`, so `build:desktop` runs `npm run vendor` first; without it, scramble generation would fail at runtime. And the Supabase settings come from the gitignored `.env.local`, so the release workflow passes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both public values) as GitHub Actions variables, with `NEXT_PUBLIC_SOLVELAB_TARGET=desktop`. A CI check confirms the built app has the Supabase backend and `out/vendor/cubing/scramble.js`.

### 4.2 Replacing the web coach

- **`/hub/ask/` becomes "Get the Mac app"**: what the coach does, "runs on your Mac, private, free", what's needed (an Apple-silicon Mac with macOS 14+, about 2–7 GB of free disk for the model, and an administrator password to install Ollama; on a school or parent-managed Mac, ask whoever manages it), a download button, and a plain note that the website keeps everything else. On a phone or a Windows PC it says the coach is Mac only. It keeps one **"Copy my summary"** button (D8): it copies the numbers summary from `context.ts` so someone without the app can paste it into an AI they already use. No keys, nothing stored, nothing sent.
- **The other places that point at the web coach** are reworded to "Get the Mac app" or hidden behind `features.coachChat`: the profile link (`components/hub/hub-profile.tsx`), Settings' "Your own AI" row, which names Claude, ChatGPT, Gemini, OpenRouter and a model on your computer (`components/settings/settings-panel.tsx`), the guided Coach page's "Ask your own AI — Claude, ChatGPT or Gemini" link (`components/coach/coach-dashboard.tsx`), and the Hub's "Ask the coach" tile (`components/hub/hub-variants.tsx`). `tests/e2e/ai-coach.spec.ts` is replaced by a spec for the new page.
- **Remove** the OpenRouter sign-in, the API-key setup (`lib/ai/keys.ts`, `components/hub/api-key-setup.tsx`), the hand-off links and the web Ollama option, with their tests, and the OpenAI-style `streamChat()`/`parseStream()` they use (the app has its own `/api/chat` client). `context.ts` and `grounding.ts` stay (the app and the copy button use them).
- **Wipe saved secrets once:** on the first visit after the change, the site deletes `solvelab.ai.openrouter` and `solvelab.ai.apiKey` from localStorage (and `solvelab.ai.openrouterVerifier` from sessionStorage, where it lives; it holds no key and goes when the tab closes) and shows a one-time note: "The AI coach moved to the Mac app. Your saved OpenRouter or API key was removed from this browser; you can revoke it on the provider's site." Leaving dead keys in browsers would be a privacy risk.
- **Saved conversations:** the web "Your AI coach" never saved its chats (they lived only in the open page), so there's nothing to migrate. The guided Coach page's `coachThreads` stay as they are.
- **Timing:** the web change goes live **the same day a signed and notarized app can be downloaded**, so Mac users never simply lose the coach. If there's only an ad-hoc signed build (the parent said no, or enrollment is still pending), the web chat stays until the owner decides again: an app that needs a trip to System Settings and shows a malware-style warning isn't a replacement most people get through.

### 4.3 Privacy Policy and Terms

The Privacy Policy (`app/privacy/page.tsx`) currently doesn't mention the outside-AI paths (OpenRouter, API keys, hand-off) at all, so the web change also closes that gap. New text:

- **Privacy, new section "The coach in the Mac app":** the coach runs on your Mac through Ollama; your questions, the replies and your numbers summary are not sent to SolveLab or anyone else; chats are stored only on your Mac, can be cleared in Settings, and are deleted when you sign out of the app; the app downloads the model from Ollama's servers, which see your IP address like any download; Ollama is a separate program with its own privacy terms.
- **Privacy, "The app":** the app keeps your data in its own storage on the Mac; signed-in times sync to your Supabase account exactly like the website; the app checks for updates (sending its version number).
- **Privacy, "Copy my summary":** the website copies your numbers summary to your clipboard only; what you paste into another AI is between you and that service.
- **Terms:** the coach's advice is generated by an AI model and can be wrong; check algorithms in the algorithm bank; the app is provided as-is; Ollama and Qwen are third-party software under their own licences (MIT and Apache-2.0), and SolveLab ships notices for them.

These are short edits. The existing open item still stands: the owner should get a quick review of the legal text before launch (HANDOFF §10). The parent, as the Apple developer of record (5.1), should read it too.

---

## 5. Distribution

### 5.1 Signing and notarization

| | **Apple Developer Program ($99 a year)** | **Ad-hoc signed (no Apple account)** |
| --- | --- | --- |
| First open | Opens normally after the download check | macOS blocks it. Since macOS 15 Sequoia, the old Control-click → Open shortcut is gone: people must try to open it, then go to **System Settings → Privacy & Security → Open Anyway**, and confirm with an administrator's password (a parent's, on a Mac a parent set up) ([MacRumors](https://www.macrumors.com/2024/08/06/macos-sequoia-gatekeeper-security-change/), [Michael Tsai](https://mjtsai.com/blog/2024/07/05/sequoia-removes-gatekeeper-contextual-menu-override/)). On a school or IT-managed Mac the setting may not be there at all ([Apple](https://support.apple.com/en-us/102445)) |
| Trust | "From an identified developer", notarized by Apple | "Apple could not verify…", which looks like malware to most people |
| Auto-update | Smooth | Works through Tauri's own signed updates, but each new build may trigger the warning again |
| Fit | Public release | Friends and testers who are told what to expect |

**Ad-hoc, not unsigned.** With no signing identity set, `tauri build` makes a completely unsigned app, and on Apple silicon a downloaded app with no signature at all is reported as "damaged" with no Open Anyway button ([Tauri macOS signing](https://v2.tauri.app/distribute/sign/macos/), [tauri#8763](https://github.com/tauri-apps/tauri/issues/8763)). Test builds therefore set `bundle.macOS.signingIdentity: "-"` in `tauri.conf.json` (an ad-hoc signature). Before a build goes to friends, it's downloaded through a browser onto a second Mac (so macOS treats it as downloaded) and opened by following the friends' guide step by step.

**The owner is a minor.** The Apple Developer Program requires the member to be of legal age, with no guardian exception ([enrollment](https://developer.apple.com/support/enrollment/): "be the legal age of majority in your region"; [Program License Agreement §3.1](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)). The Apple Account behind it can't be shared, and an individual membership can't add the owner as a team member ([roles](https://developer.apple.com/help/account/manage-your-team/roles)). So **a parent enrolls as an individual and is the only person who signs in to that account.** The owner never signs in to the parent's Apple Account, and agents never handle the Apple ID password, the certificate's private key or the notarization credential.

> **For a parent: what you'd be agreeing to**
>
> - **Cost:** $99 every year. If the membership lapses, copies already shipped keep working, but no new signed updates can go out until it's renewed ([membership renewal](https://developer.apple.com/help/account/membership/renewal/)).
> - **Your name:** your full legal name appears as the developer on every copy. Showing "SolveLab" instead needs an organization membership, which needs a registered company and a D-U-N-S number; not recommended.
> - **Legal:** you accept Apple's agreement and become the developer of record, so please read the app's Privacy Policy and Terms (4.3) too.
> - **Steps only you can do** (about an hour, plus Apple's review wait): enroll with your Apple Account (two-factor on); create a Developer ID Application certificate on the family Mac and export it; create a notarization credential (an app-specific password, or an App Store Connect API key); then add these as secrets on the GitHub repo yourself. For that last step you need your own GitHub account, added as a collaborator on `bhargava-gumpula/solvelab`. The owner never sees these values.
> - **One backup to keep:** a copy of the app's update key (5.2).

**Recommendation:** test builds go out ad-hoc signed to a few friends with a one-page "how to open it" guide (including "you may need a parent's administrator password" and "school Macs may not work"). Before the public download, a parent enrolls and the app is signed and notarized. If the parent says no, the app can still be offered ad-hoc signed with the guide, but the web chat isn't removed for it (4.2), and expect few people to get through.

### 5.2 Hosting the download and updates

| | **GitHub Releases** (repo `bhargava-gumpula/solvelab`, already public) | **Cloudflare** (Pages or R2) |
| --- | --- | --- |
| Cost | Free | Free at this size |
| Updater file | `tauri-action` builds, signs and uploads the .dmg, the `.app.tar.gz` update and `latest.json` in one step | We'd upload these ourselves |
| Download link | Stable "latest" URL | Our own domain (nicer) |
| Effort | Lowest | More |

**Recommendation: GitHub Releases**, with the "Get the Mac app" page and the marketing site linking to the latest release. Builds run in GitHub Actions on a macOS runner. Pushing tags and publishing releases needs the owner's approval each time (AGENTS.md). The Tauri updater checks `latest.json` on launch, asks before installing, and refuses any update not signed with SolveLab's update key.

**The update key.** It's made once. A GitHub secret can't be read back, so it's not a place to keep the only copy. Keep the private key and its password in GitHub secrets (for the build) **and** in two backups outside GitHub, for example the owner's password manager and an encrypted USB drive the parent keeps. If every copy is lost, nobody who already has the app can get updates again; they'd have to reinstall by hand ([Tauri updater](https://v2.tauri.app/plugin/updater/)). **Changing the key** later: ship one update signed with the old key that carries the new public key (the updater can take its public key at runtime), then sign everything after it with the new key.

**Keeping the signing secrets away from other code.** The web pages are built (`npm ci`, `npm run build:desktop`) in a job that has no secrets, so the hundreds of dependency install scripts never run next to them. Only the Tauri bundle-and-sign job reads the Apple and update-key secrets, and it runs in a protected GitHub Environment that needs the owner's approval.

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

Each phase ends with `npm run validate`, `npx playwright test --workers=1`, the app test suite (from Phase 2 on), screenshots, a dev log entry and a **review stop**. Estimates are agent-days of work, not calendar days. The Cloudflare deploy of 5.1 (HANDOFF §14 B5) is still pending and should go out first, because the app syncs against Supabase.

**Testing the real app.** Playwright's WebKit is its own build of recent WebKit, not the Mac's WKWebView that the app runs in, which changes with each macOS release. The web build also never turns on the desktop-only paths (`coachChat`, no service worker, the `tauri://` origin, the security policy, Tauri commands, the deep link), so Phases 2–5 could pass every web check while the app itself is broken. From Phase 2 on, an **app-level smoke suite** runs against the desktop build with WebdriverIO and Tauri's embedded WebDriver server (the way Tauri supports WebDriver on macOS, [Tauri WebDriver docs](https://v2.tauri.app/develop/tests/webdriver/)): the app launches; Space starts and stops the timer and a click doesn't; the 3D cube renders; no security-policy violations on any route; the coach page works against a stub server on `127.0.0.1:11434`; `/hub/ask/` passes an axe accessibility check; and `open 'solvelab://auth/callback?…'` reaches the installed app. It runs in GitHub Actions on the oldest available macOS runner (ideally macOS 14, the app's minimum) and the newest, and it's part of every phase's checks. The Playwright WebKit project stays as a quick early warning.

| # | Phase | What's in it | Effort | Owner / parent steps |
| --- | --- | --- | --- | --- |
| 1 | **Spike: will it run?** | Tauri v2 shell loading `out/`; WebKit pass over Timer, Hub, lesson player (3D cube), trainer, stats; Space-bar checks, including `eventTimestamp()` in the real app window with a busy main thread; keyboard-only and VoiceOver walk of Timer, Hub and lesson player; confirm Bluetooth is missing (for D13); one call to a local Ollama from the app page (confirms the `tauri://` origin); a Playwright WebKit project for the main specs | 3–4 | Install Rust (one command); look at screenshots; answer D13 |
| 1+ | **WebKit fixes** | Whatever Phase 1 finds; sized when Phase 1 ends | 2–4 (reserve) | Look at screenshots |
| 2 | **Two builds, one codebase** | `NEXT_PUBLIC_SOLVELAB_TARGET`, `lib/config/platform.ts`, `features.coachChat`, service worker off in the app, `build:desktop` (with the vendor step), app icon, menus, window size, the fixed bundle identifier, the full security policy and capabilities file (1.6), `tabFocusesLinks` on, Bluetooth option per D13, the app smoke suite and its macOS CI | 3–4 | Approve app name and icon |
| 3 | **Sign-in in the app** | `skipBrowserRedirect` plus the opener for sign-in, linking and the identity-taken retry; `completeSupabaseReturnFromUrl()` with `exchangeCodeForSession` and the return path; `onOpenUrl` and `getCurrent()`; the nonce check and fixed error messages; tests, including the scripted deep-link check on the installed app | 3–4 | Approve the Supabase redirect allow-list change (Aside does it) |
| 4 | **Ollama setup** | Detection from the Rust side, install guide, "Open Ollama", version floor, memory tiers, pinned tags and digests, model download that outlives the page, cancel and disk check, chat states, timeout and error messages, unload on the Timer for 16 GB Macs and smaller; measure time to the first word and tokens/s, cold and warm, llama.cpp and MLX variants, on the M5 Air and a smaller Mac if available | 4–5 | Try the first run on their Mac |
| 5a | **The coach: engine** | Native `/api/chat` client (NDJSON reader, `num_ctx` 8K, `num_predict`, `think: false`, `format`, `keep_alive`) with tests; context v2 (range, attempts, trend, weak cases, not-yet); the `id: title` catalogue; structured replies with partial-JSON streaming and the raw-text fallback; algorithm guard; eval fixtures (with a long multi-turn case) and `coach:eval` on every pinned tag; model default settled by the eval | 4–6 | — |
| 5b | **The coach: chat and storage** | Chat UI at `/hub/ask/` (the log is a polite live region that announces finished replies, not single words; focus returns to the input after sending; the "thinking" state is announced), suggestions component, entry points (the reworded profile one and the test result), IndexedDB v11 chats, sign-out warning, chats in Export, Settings clear | 4–5 | Read ~20 answers for cube mistakes |
| 6 | **Website changes** | "Get the Mac app" page with "Copy my summary", the four other coach links reworded or hidden, `ai-coach.spec.ts` replaced, removal of OpenRouter / keys / hand-off and the old stream parser, one-time key wipe and note, Privacy and Terms text | 3–4 | Approve the text; quick legal review |
| 7 | **Packaging and release** | `tauri-action` workflow (a build job without secrets, a protected signing job, the Supabase variables, the vendor and backend check), updater key with two backups outside GitHub and the key-change note, ad-hoc signed (`signingIdentity: "-"`) test build checked on a second Mac and then sent to friends, then a signed and notarized build, GitHub Release, marketing site fixed, web change and app go live the same day | 4 (+ waiting on Apple) | Parent: the Apple steps and GitHub secrets in 5.1; owner: keep the update-key backups, approve tag, release and deploy |

**Total: about 30–40 agent-days**, plus 3–5 more if D13 picks native Bluetooth, plus Apple's enrollment wait (often a day or two, sometimes longer). Every deep-link test needs a build installed in `/Applications`, which is part of these numbers. In calendar time, with nine review stops and Apple's wait, expect very roughly 2–3 months, assuming an agent-day is about a working day and each review takes a few days.

### Phase 1 outcome (dev log 199, 2026-10-04)

**It runs, and Tauri stays.** The spike `SolveLab.app` (about 18 MB, ad-hoc signed, macOS 14 minimum) opens a real window with the Timer and the 3D cube, reaches a local Ollama from the `tauri://localhost` origin (HTTP 200, no CORS block), has no Bluetooth (D13 is simply true), has WebGL, and routes `/hub/`, `/train/`, `/stats/` resolve. The timer rule held in a test hook: a click did not start it, Space started and stopped it. Not yet checked: the real Space key in the real window, VoiceOver and keyboard-only, `eventTimestamp()` under a busy main thread, and any signed-in page. The Playwright WebKit pass is mostly unresolved because the machine was overloaded (timeouts, 17 of 18 Hub tests passed, 2 timer tests passed); one failure looks real (Hub course chip leaves the URL on the old course). Phase 1+ is sized at about 2-3 agent-days: the Hub URL bug 0.5-1, a cheaper test seed 0.25, a rerun on a quiet machine 0.5-1, the Phase 1 leftovers 1. Electron stays only as a fallback; nothing seen calls for it.

### Risks

| Risk | How likely | What we do |
| --- | --- | --- |
| Something looks or behaves wrong in WebKit (3D cube, glass, motion, keyboard, VoiceOver) | Medium | Phase 1 finds it first; a fix-up reserve after it; the app smoke suite on old and new macOS; Electron stays a fallback |
| Bluetooth-timer users lose Bluetooth in the app | Certain (WebKit) | D13: say so in the app and point to the website in Chrome; native Bluetooth if testers ask |
| People don't get through installing Ollama, or can't on a managed Mac | Medium | A clear guide with screenshots and the administrator-password note; measure with testers; bundling Ollama is plan B (it doesn't help on managed Macs) |
| A 4B model gives wrong cube advice | Medium | The "not yet" list, structured replies, catalogue and algorithm checks, and the eval set before every change; offer 9B on bigger Macs |
| Long chats lose the summary (the 4K default context) | High without the fix | `num_ctx` 8K on every request, history cap, `prompt_eval_count` check, a long multi-turn eval case |
| Unsigned builds scare people off | High if not notarized | Parent enrollment before the public release; the web chat isn't removed until a notarized build exists |
| Deep link can't be tested in development | Certain | Test the built app installed in `/Applications`; a scripted check in the app smoke suite |
| Ollama changes its API, default origins or what a tag means | Low–Medium | A minimum version; explicit variant tags with digests; the spike checks the origin; the app can switch to a Rust-side call |
| The model download fails or fills the disk | Medium | Show the size first, check free space, allow cancel and resume (Ollama resumes pulls) |
| Web users on Windows, Linux or phones lose the coach | Certain (by decision) | Say so plainly on "Get the Mac app"; "Copy my summary" gives them a no-keys fallback |
| Two release trains (website and app) drift | Medium | One codebase, one version number, released together |
| Data kept only in the app is lost (identifier change, sign-out) | Low | Fixed bundle identifier; the sign-out dialog warns; Export includes chats |
| Signing secrets leak | Low | Web build in a job without secrets; secrets only in the approved signing job; entered by the parent; never in the repo or in an agent's hands |
| Update key lost | Low, but very high impact | Two backups outside GitHub (5.2) |

---

## 7. Decisions for the owner

**All thirteen are DECIDED (owner, 2026-10-04).** Each row gives the owner's choice, with the plan's earlier recommendation kept in the notes where the owner chose differently or added a condition. Where an earlier section (0, 4.2, 5.1, 6 risks) still talks about a parent enrolling, a notarized build, or keeping the web chat for unsigned builds, this section wins.

Words used below: **WebKit** is the engine Safari uses, and the Mac app would use it too. A **spike** is a short first try to see whether something works. A **deep link** is a `solvelab://` link that opens the app. **Loopback** means the app briefly runs its own tiny web page on the Mac for the browser to come back to. The **eval set** is the fixed list of made-up profiles the coach is tested against. **PKCE** is the sign-in safety check that makes a stolen sign-in code useless. **Notarized** means Apple has checked the app, so the Mac opens it without warnings.

| # | Decision | Owner's choice | Notes |
| --- | --- | --- | --- |
| D1 | **App shell** | **DECIDED: Tauri v2.** A real Mac app built with web tech: all code inside the app, works offline. | The owner rejected the word "wrapper"; use "Mac app" in all copy and docs. Phase 1 still checks SolveLab in WebKit (Safari's engine). |
| D2 | **How people get Ollama** | **DECIDED: guided install.** | Bundle later only if testers get stuck. |
| D3 | **Default model** | **DECIDED: `qwen3.5:4b` (q4_K_M) by default, `qwen3.5:9b` on Macs with 24 GB or more, `qwen3.5:2b` on 8 GB Macs.** | Pinned variant tags and digests as in 2.2. The eval set on the M5 Air can still change the pinned tag, not the tiering. |
| D4 | **Which Macs** | **DECIDED: Apple silicon only, macOS 14 or newer.** | Intel is out. |
| D5 | **Apple Developer Program** | **DECIDED: no Apple Developer account. Builds are ad-hoc signed (`bundle.macOS.signingIdentity: "-"`) and come with a "how to open it" guide.** | The owner accepted the trade-offs: the Gatekeeper warning on first open; Open Anyway in System Settings plus an administrator's password; managed (school or work) Macs may block it entirely, and those users get no coach because D8 removes the web coach; updates may show the warning again. Overrides the plan's recommendation (a parent enrolls before the public download) and its earlier suggestion to keep the web chat for unsigned builds. No parent enrollment, notarization or Apple secrets in the release job. The second-Mac check of a browser-downloaded build (5.1) still applies. |
| D6 | **Where the download lives** | **DECIDED: GitHub Releases with the Tauri updater.** | Updater key backed up twice outside GitHub (5.2). |
| D7 | **Sign-in return** | **DECIDED: sign in through the system browser and return by the `solvelab://` deep link.** | Needs the one Supabase redirect allow-list change (Aside, with the owner's approval at that time). Sign-in is only testable on a fully built app in `/Applications`. |
| D8 | **What the website keeps** | **DECIDED: remove the web coach. `/hub/ask/` becomes "Get the Mac app".** | The chat, OpenRouter, API keys and hand-off links go. The plan's "Copy my summary" button was not part of the decision as recorded; treat it as an open detail for the owner, not as decided. Overrides the plan's idea of keeping the web chat for unsigned builds (see D5). |
| D9 | **App chat history** | **DECIDED: kept on the Mac only.** | Signing out of the app deletes the chats; the sign-out dialog says so and Export can keep a copy. |
| D10 | **Marketing site** | **DECIDED: fix it before launch.** | Mac only, Apple silicon, the right version, mention the private AI coach (5.4). |
| D11 | **Voice** | **DECIDED: text first.** | Voice later, on-device speech recognition only. |
| D12 | **Version and timing** | **DECIDED: the web change and the app ship together as 6.0.** | The plan's condition "only once a signed and notarized build exists" no longer applies, because D5 means none will; 6.0 ships with the ad-hoc signed build, after the 5.1 deploy is out. Deploying still happens only when the owner asks. |
| D13 | **Bluetooth timers in the app** | **DECIDED: hidden in the app for the first release (website only).** | "Bluetooth timers: use the website in Chrome". Native Bluetooth (`btleplug`) later if testers ask. |

---

## Review log

Reviewed 2026-10-04. Each finding was checked against the code on `desktop-app` or the cited source before it was applied.

| # | Finding | Verdict | Why |
| --- | --- | --- | --- |
| 1 | Minimum Ollama version should be 0.17.5, not 0.17.4 | Applied | The v0.17.5 notes add the 0.8B–9B sizes and fix the GPU/CPU split crash and the repetition bug; v0.17.4 only adds the family. Floor set to 0.17.5, final floor = the eval's Ollama version (2.1, 2.2). The later version numbers in the finding weren't checked, so they aren't cited. |
| 2 | `qwen3.5:2b` is 8-bit; 8-bit isn't "double" | Applied | The `qwen3.5:2b` page shows Q8_0, 2.7 GB (2.0 GB model + 671 MB BF16 projector); tags page: 2b/4b/9b q4_K_M 1.9/3.3/6.6 GB, q8_0 2.7/5.2/10 GB (1.4–1.6×). 8 GB tier is now `2b-q4_K_M`; "about 1.5×". |
| 3 | Bare tags don't pin the weights | Applied, changed | Tags page: `qwen3.5:4b` is 3.3–4.0 GB, MLX and llama.cpp, republished 2 hours earlier; v0.40.0-rc2 runs MLX by default. Explicit variant tags and digests are pinned. The size shown before a download comes from the config, not `/api/pull`'s `total`, because that total is only known once the pull starts. |
| 4 | Speed figures are estimates, 38–45 tok/s unsupported | Applied | modelfit.io gives no 4B figure and labels its numbers estimates; llmcheck.net gives "estimated" 40 tok/s computed from bandwidth. Rewritten; prompt reading and model load added; Phase 4 measures time to the first word. |
| 5 | `/api/chat` options vs reused `/v1` code | Applied | `providers.ts:132` is `/v1/chat/completions`, `:146` reads only `data:` lines. Chose `/api/chat` (only it can set `num_ctx`, see #22) with a new NDJSON client (1.3, 3.1). |
| 6 | CSP `127.0.0.1` vs code `localhost` | Applied | `OLLAMA_CHAT` uses `localhost`; CSP host matching is literal. One base URL constant, `127.0.0.1`, feeds both. |
| 7 | Apple minors clause is about pre-release materials | Applied | The Developer Agreement's 13-to-majority text sits under "Permitted Age for Accessing Pre-Release Materials"; the account can't be shared; DPLA §3.1 and the enrollment page require legal age. 5.1 rewritten. |
| 8 | Unsigned isn't ad-hoc signed | Applied | Tauri's macOS signing docs: ad-hoc (`-`) is needed on Apple silicon; tauri#8763 shows "damaged" without it. `signingIdentity: "-"` and a second-Mac check added (5.1, Phase 7). |
| 9 | Electron deep links don't work in development on macOS | Applied | Electron docs: "will only work when your app is packaged"; Info.plist only. Table cell corrected. |
| 10 | `single-instance` not needed on macOS | Applied | Tauri deep-linking docs tie it to Linux and Windows. Dropped; `onOpenUrl` and `getCurrent()` used. |
| 11 | `streamChat`/`parseStream` can't send or read what's planned | Applied | `fetchChat` sends a fixed body (`providers.ts:216`); `parseStream` reads `choices[0].delta.content`. Option A (native client) chosen and budgeted in Phase 5a. |
| 12 | Sign-in navigates the app window to Google | Applied | `actions.ts:135-147` passes only `redirectTo` and `queryParams`. `skipBrowserRedirect` plus the opener plugin added (1.4, Phase 3). |
| 13 | Return handler doesn't exchange the code or take a URL | Applied | `actions.ts:185-192` reads `window.location`, needs `/signed-in/`; exchange is via `detectSessionInUrl` (`client.ts`). `completeSupabaseReturnFromUrl()` added. |
| 14 | CSP host mismatch (second report) | Applied | Same as #6. |
| 15 | More web-coach surfaces than listed | Applied | Confirmed in `hub-profile.tsx`, `settings-panel.tsx`, `coach-dashboard.tsx`, `hub-variants.tsx` and `ai-coach.spec.ts`. Listed in 3.4 and 4.2. |
| 16 | Sign-out erases local-only chats | Applied, option (a) | `resetLocalData` clears every store. Chose to warn in the sign-out dialog and include chats in Export, with a test (3.4, D9). |
| 17 | Structured JSON doesn't fit the text pipeline; catalogue has no ids | Applied | `ask-ai.tsx` appends text, `ai-answer.tsx` splits lines, `catalogue()` lists titles only. Partial-JSON reader, new suggestions component and an `id: title` catalogue added (3.1, 3.2). |
| 18 | CI build lacks Supabase settings and the cubing bundle | Applied | `prebuild` runs only for `build`; `/public/vendor/` and `.env*` are gitignored; `accountBackend()` needs the env vars. Fixed in 4.1 and Phase 7. |
| 19 | Verifier is in sessionStorage | Applied | `providers.ts:85` uses `sessionStorage`. Wipe list corrected. |
| 20 | No Coach section in Hub navigation | Applied | `navigation.ts`: the Profile item matches `/coach` and `/hub/ask`. Corrected in 3.4 and 4.2. |
| 21 | Sign-in needs more than a redirect change (cold start) | Applied | Merged with #12 and #13; `getCurrent()` added for cold start, retry goes through the browser. Phase 3 re-costed. |
| 22 | Ollama's 4K default context truncates the prompt | Applied | Ollama docs: under 24 GiB, 4K; `/v1` can't set `num_ctx`. `num_ctx` 8K, history cap, `prompt_eval_count` check, long eval case (1.3, 3.3). |
| 23 | No Web Bluetooth in WebKit | Applied | `adapters.ts:84-85` returns null without `navigator.bluetooth`. Added to 1.1, 1.2, risks and new decision D13. |
| 24 | Playwright WebKit isn't WKWebView; desktop paths untested | Applied | `playwright.config.ts` is Chromium only; Tauri docs: macOS WebDriver only through the embedded server. App smoke suite added to every phase (section 6). |
| 25 | Update key kept only as a GitHub secret; leak exposure | Applied, changed | Tauri updater docs confirm the loss warning. Two backups, key-change note, protected signing job. Used a separate build job without secrets instead of `npm ci --ignore-scripts`, which could break packages that need install scripts. |
| 26 | Forged `solvelab://` links can trigger the error branch | Applied | `actions.ts:193-210` withdraws shares, signs out and shows `error_description`. Nonce check and fixed messages added (1.4). |
| 27 | Two APIs and two hosts (third report) | Applied | Same as #5 and #6. |
| 28 | Bare tags in the tier table; eval only on one model | Applied | Same evidence as #3. Eval runs on every pinned tag; `qwen3:4b` fallback dropped rather than evaluated (D3). |
| 29 | No full CSP or capabilities list | Applied | No CSP in the repo; Tauri's CSP example needs `ipc:`; source links use `target="_blank"`. New section 1.6. Also noted that Tauri's nonces make browsers ignore `'unsafe-inline'`, so the sweep decides `style-src`. |
| 30 | Unhandled Ollama failure modes | Applied, changed | Detection by bundle id and by any answering server, states, 60 s retry, error messages, download that outlives the page, unload on the Timer (1.5, 2.3). For a custom `OLLAMA_HOST`, chose "default address required" because the security policy is fixed at build time. |
| 31 | Reply time leaves out prompt reading and loading; JSON can't be read while streaming | Applied | Merged with #4 and #17. The "plain answer before a JSON block" option wasn't used because `format` makes the whole reply JSON; partial-JSON reading instead. |
| 32 | No accessibility work | Applied | `WKPreferences.tabFocusesLinks` defaults to off; no axe tooling in the repo. New section 1.7, Phase 1, 2 and 5b items, axe check in the app suite. |
| 33 | Effort underestimated | Applied | Re-estimated at 30–40 agent-days; Phase 5 split into 5a and 5b; a WebKit fix-up reserve after Phase 1. |
| 34 | Web coach could be removed with only an unsigned app | Applied | Removal now waits for a notarized build (4.2, 5.1, D12); "Copy my summary" kept on the web (D8). |
| 35 | App storage depends on the bundle identifier | Applied | Identifier fixed in Phase 2 and recorded as never-change; no App Sandbox without migration; chats in Export (1.4). |
| 36 | Timing uses `event.timeStamp`, not `performance.now()` | Applied | `input.ts:64-71` confirmed. Sentence corrected; real-WKWebView check added to Phase 1 (1.5). |
| 37 | macOS dictation isn't always on-device | Applied | Voice now means on-device recognition only (3.6, D11). |
| 38 | A parent can't decide from what the plan says | Applied, changed | Apple: individual memberships can't add team members; Developer ID certificates need Account Holder or Admin; apps already shipped keep working after a lapse. Added the "For a parent" box. GitHub's docs say a collaborator on a personal repo can create secrets, so the parent needs collaborator access rather than "admin". Apple auto-renewal is optional on the website, so the box says "every year" rather than "auto-renewing". |
| 39 | Open Anyway needs an administrator; managed Macs | Applied | Apple: the setting may be missing on managed Macs; Ollama asks to add a link in `/usr/local/bin`. Notes added to section 0, 2.3, 4.2, 5.1 and the risks. |
| 40 | Losing the update key is permanent | Applied | Same source as #25; "Update key lost" risk row added. |
| 41 | D8 lists only benefits | Applied, recommendation changed | The cost (no AI help for anyone off Apple-silicon Macs) is now in D8, and the recommendation now keeps a "Copy my summary" button (no keys stored), since #34 also relies on it. |
| 42 | Decision rows use unexplained terms; no calendar estimate | Applied | A short word list above the table; "what you'd notice" and cost lines in D1 and D7; a rough calendar range under the phase table. |

No finding was rejected. Seven were applied in a changed form (#3, #16, #25, #30, #31, #38, #41), for the reasons given.
