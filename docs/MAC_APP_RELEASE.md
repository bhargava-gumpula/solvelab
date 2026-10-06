# Releasing SolveLab for Mac

How a Mac app release is built and published (plan: `docs/DESKTOP_APP_PLAN.md` 5.1, 5.2 and Phase 7). The app is **ad-hoc signed** (`signingIdentity: "-"`, no Apple Developer account, decision D5), downloaded from **GitHub Releases** and kept up to date by the **Tauri updater** (D6). The web change and the app ship together as 6.0.

**Only the owner** makes the updater key, adds the GitHub secrets, pushes tags and publishes releases. Agents never generate, read, copy or store the private key or its password, and the key never goes into the repo or a chat.

## How it fits together

- `.github/workflows/desktop-release.yml` runs when a tag like `app-v6.0.0` is pushed.
  - **`pages` job** (Ubuntu, no secrets): `npm ci`, `npm run build:desktop` with the Supabase URL and publishable key from repository variables, then checks that `out/vendor/cubing/scramble.js` and the Supabase backend are in the build.
  - **`release` job** (macOS, Apple silicon): runs in the protected `release` environment, so it waits for the owner's approval. It checks the tag matches the app version and that `plugins.updater.pubkey` really is an updater public key (not the placeholder, and never a pasted private key), installs only the Tauri CLI (the project's packages aren't installed next to the secrets), then `tauri-apps/tauri-action` builds the app and `.dmg`, signs the app ad-hoc, signs the update with the updater key and uploads everything to a **draft** release: the `.dmg`, the update (`.app.tar.gz` and its `.sig`) and `latest.json`. A last step checks the update's signature names this version and was made with the key matching `plugins.updater.pubkey`.
- `src-tauri/tauri.release.conf.json` adds the `.dmg` and the update files. They're left out of normal builds because the update files can't be made without the private key.
- The app checks `https://github.com/bhargava-gumpula/solvelab/releases/latest/download/latest.json` when it opens (`plugins.updater` in `src-tauri/tauri.conf.json`). It installs nothing without a click, refuses any update not signed with the updater key, and only installs a **higher** version whose signature names that same version (`requireSignedVersion`), so an old signed update can't be passed off as a new one.
- `releases/latest` means the newest **published, non-pre-release** release. A draft is invisible to the app until it's published. **Don't publish any other GitHub release as "latest"** (for example a website release): the app would look for `latest.json` there and stop seeing updates. Mark such releases as pre-releases, or untick "Set as the latest release".

## One-time setup (owner)

### 1. Make the updater key on your own Mac

In the SolveLab folder in Terminal:

```sh
npx tauri signer generate -w ~/.tauri/solvelab-updater.key
```

It asks for a password twice: pick a strong one and save it in your password manager straight away. It writes two files:

- `~/.tauri/solvelab-updater.key`: the **private key**. Secret.
- `~/.tauri/solvelab-updater.key.pub`: the **public key**. Not secret.

**Keep two backups outside GitHub**, each with the key file and its password (a GitHub secret can't be read back, so it isn't a backup):

1. Your password manager: a secure note with the text of `solvelab-updater.key` and the password.
2. An encrypted USB drive that a parent keeps (format it in Disk Utility as "APFS (Encrypted)"): copy both `.key` files onto it.

If every copy is lost, nobody who already has the app can get updates again; they'd have to download and install the next version by hand ([Tauri updater](https://v2.tauri.app/plugin/updater/)).

### 2. Put the public key in the app

Replace `OWNER_ADDS_PUBLIC_KEY` in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`) with the one line in `solvelab-updater.key.pub`. `pbcopy < ~/.tauri/solvelab-updater.key.pub` copies it. The public key is safe to commit or hand to an agent; the release workflow refuses to build until it's there.

### 3. Make the protected `release` environment and its two secrets

On github.com, repo `bhargava-gumpula/solvelab` → **Settings** → **Environments** → **New environment**, name it `release`:

1. **Required reviewers:** tick it and add yourself. Every release then waits for your approval.
2. **Deployment branches and tags:** choose "Selected branches and tags" → **Add deployment branch or tag rule** → Ref type **Tag** → pattern `app-v*`.
3. **Environment secrets** → **Add environment secret**, twice:
   - `TAURI_SIGNING_PRIVATE_KEY`: the whole text of `solvelab-updater.key`. Run `pbcopy < ~/.tauri/solvelab-updater.key`, then paste, so it never shows on screen.
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the key's password.

Environment secrets (rather than repository secrets) are only given to the job that names the `release` environment, after you approve it.

### 4. Check the two repository variables

Settings → Secrets and variables → Actions → **Variables** should already have `SUPABASE_URL` and `SUPABASE_ANON_KEY` (set for `keep-alive.yml`). They're the public values the website uses, so they're variables, not secrets. Nothing to add if they're there.

## Each release (owner)

Shortcut: `node scripts/release/set-pubkey.mjs "$(cat ~/.tauri/solvelab-updater.key.pub)"` once, then `scripts/release/owner-build.sh` builds the signed app locally and fills `release-out/` (dmg, update, .sig, `latest.json`) to upload to a release tagged `app-v<version>`.

1. **Set the version.** In `src-tauri/tauri.conf.json` set `"version"` (for example `"6.0.0"`); for 6.0 also bump `package.json`. Commit, and merge to `main` once approved.
2. **Push the tag** from `main` (it must be `app-v` plus that exact version):
   ```sh
   git tag app-v6.0.0
   git push origin app-v6.0.0
   ```
3. **Approve the build.** Actions → "Mac app release" → the run for your tag. After `pages` finishes, `release` shows "Waiting for review": **Review deployments** → tick `release` → **Approve and deploy**. It takes about 10–20 minutes.
4. **Check the draft.** The run must be green with no warning about the update being "signed with a different key" (that means the `release` secret and `plugins.updater.pubkey` are from different key pairs: delete the draft and fix it, or installed apps could never update again). Releases → "SolveLab for Mac 6.0.0" (Draft) should have the `.dmg`, the `.app.tar.gz`, its `.sig` and `latest.json`.
5. **Second-Mac check** (plan 5.1). On a second Mac, signed in to GitHub (drafts are only visible to you), download the `.dmg` in a browser and follow `docs/HOW_TO_OPEN_MAC_APP.md` step by step: install, the first-open steps, sign in with Google, time a solve with Space.
6. **Publish.** Edit the draft → leave **Set as the latest release** ticked → **Publish release**. From then on the download works for everyone and installed apps offer the update the next time they open.
7. **Website, same day.** Point the "Get the Mac app" download link (`MAC_APP.downloadUrl` in `lib/config/mac-app.ts`) at `https://github.com/bhargava-gumpula/solvelab/releases/latest` and deploy the website as in `docs/HANDOFF.md` §8.

A manual run (Actions → Mac app release → **Run workflow**), even one started on a tag, only builds the pages, as a check; it never touches the secrets or a release.

## What friends see

- **Download:** the release page, with a short note and a link to the "How to open" guide. They download the `.dmg` and drag SolveLab into Applications.
- **First open:** macOS stops the app because it isn't registered with Apple. They confirm once in System Settings → Privacy & Security → Open Anyway (macOS 15 and newer, with their Mac password, or a parent's on a Mac a parent set up) or with Control-click → Open (macOS 14). On a school or work Mac it may be blocked completely. Full steps: `docs/HOW_TO_OPEN_MAC_APP.md`, also on the "Get the Mac app" page.
- **After that:** it opens normally.
- **Updates:** when they open the app after a release is published, a small note in the corner says "Update available (6.0.1). Restart?". **Restart** downloads it, checks the signature, installs it and reopens the app; **Later** asks again next time. Offline, or with no newer version, they see nothing. If the signature doesn't match, they see "Couldn't update" and keep their version. On a Mac where they aren't an administrator, macOS asks for an administrator's name and password to replace the app in Applications (a parent's, on a Mac a parent set up). macOS usually doesn't ask again after an update; if it does, it's the same steps as the first open.

## Rollback

The updater only installs a **higher** version than the one running, so the way back is always forwards.

- **Bad draft, not published:** delete the draft release, then the tag (`git push origin :refs/tags/app-v6.0.1` and `git tag -d app-v6.0.1`). Nobody saw it.
- **Bad release, already published:**
  1. Stop it spreading: edit that release and tick **Set as a pre-release** (or make the previous release "latest" again). `releases/latest/download/latest.json` then points at the previous, lower version, so apps that haven't updated aren't offered the bad one. The previous release's `.dmg` becomes the download again.
  2. Fix it properly: put the last good code back (revert on `main`), raise the version past the bad one (for example `6.0.2`), tag and release as usual. Everyone on the bad version is offered the fix.
  3. If the bad version won't open at all, its users download the previous good `.dmg` from Releases and drag it into Applications, replacing the broken one.
- **Website:** roll back as in `docs/HANDOFF.md` §8 if the web change has to go too.

## If the updater key is lost or leaked

- **Leaked** (someone else may have the private key or its password): make a new key pair (step 1), ship one more update signed with the **old** key whose `tauri.conf.json` carries the **new** public key, then replace the two `release` secrets with the new key and sign everything after that with it. That one release's run warns that the update was "signed with a different key"; that's expected there. Someone with the old key still can't put an update in front of users without also being able to publish releases on the repo.
- **Lost** (every copy gone): installed apps can't be updated. Make a new key, release the next version, and ask everyone to download it by hand once.
