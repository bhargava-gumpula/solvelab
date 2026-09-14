#!/usr/bin/env bash
# Copy the static export to the Pi and (re)start the SolveLab process.
# Cloudflare Tunnel still needs a public hostname pointing at localhost:4173.
set -euo pipefail

PI="${SOLVELAB_PI:-bhargavagumpula@10.0.0.16}"
REMOTE="${SOLVELAB_REMOTE:-/home/bhargavagumpula/Work/solvelab}"
NODE="${SOLVELAB_NODE:-/home/bhargavagumpula/.nvm/versions/node/v20.20.2/bin/node}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -d "$ROOT/out" ]] || ! find "$ROOT/out" -name index.html | grep -q .; then
  echo "No production build in out/. Run npm run build first." >&2
  exit 1
fi

ssh "$PI" "mkdir -p '$REMOTE/out' '$REMOTE/scripts'"
rsync -az --delete "$ROOT/out/" "$PI:$REMOTE/out/"
rsync -az "$ROOT/scripts/serve-static.mjs" "$PI:$REMOTE/scripts/serve-static.mjs"

ssh "$PI" "set -e
  export PATH=$(dirname "$NODE"):\$PATH
  export PORT=4173
  export SOLVELAB_CACHE=1
  cd '$REMOTE'
  if pm2 describe solvelab >/dev/null 2>&1; then
    pm2 restart solvelab --update-env
  else
    pm2 start scripts/serve-static.mjs --name solvelab --interpreter '$NODE'
  fi
  pm2 save
  sleep 1
  curl -sI --noproxy '*' http://127.0.0.1:4173/timer/ | head -n 8
"
