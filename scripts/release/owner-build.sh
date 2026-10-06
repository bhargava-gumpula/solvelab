#!/usr/bin/env bash
# The one command the owner runs, in their own Terminal, from the SolveLab folder:
#   scripts/release/owner-build.sh
# Builds the signed Mac app and puts everything to upload in release-out/.
# The updater key stays in ~/.tauri/solvelab-updater.key; this script never prints it, and the
# password is typed here (hidden), kept only in this process and never written to disk.
set -euo pipefail
cd "$(dirname "$0")/../.."

KEY_FILE="${TAURI_KEY_FILE:-$HOME/.tauri/solvelab-updater.key}"

node -e '
  const k = require("./src-tauri/tauri.conf.json").plugins.updater.pubkey;
  process.exit(Buffer.from(k, "base64").toString().includes("minisign public key") ? 0 : 1);
' || { echo "plugins.updater.pubkey in src-tauri/tauri.conf.json is still the placeholder. Run: node scripts/release/set-pubkey.mjs \"\$(cat ~/.tauri/solvelab-updater.key.pub)\"" >&2; exit 1; }
[ -f "$KEY_FILE" ] || { echo "No updater key at $KEY_FILE (make it with: npx tauri signer generate -w $KEY_FILE)." >&2; exit 1; }

read -rsp "Updater key password (hidden; just press Return if it has none): " TAURI_SIGNING_PRIVATE_KEY_PASSWORD
echo
# Tauri's build accepts the key's path or its text; the path keeps the secret off the command line.
export TAURI_SIGNING_PRIVATE_KEY="$KEY_FILE"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD

npm run build:desktop
test -f out/vendor/cubing/scramble.js || { echo "out/vendor/cubing/scramble.js is missing; scrambles would fail." >&2; exit 1; }
grep -rqF "supabase.co" out/_next/static || { echo "The Supabase URL isn't in the built pages (is it in .env.local?); sign-in would fail." >&2; exit 1; }
npx tauri build --target aarch64-apple-darwin --config src-tauri/tauri.release.conf.json

node scripts/release/make-latest-json.mjs
