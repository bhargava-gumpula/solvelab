#!/usr/bin/env bash
# Copy the static export to the Pi and (re)start the SolveLab process.
# Cloudflare Tunnel still needs a public hostname pointing at localhost:4173.
#
# Machine details stay out of git: put them in .env.deploy at the repo root
# (git-ignored), for example
#   SOLVELAB_PI=user@pi-hostname
#   SOLVELAB_REMOTE=/home/user/Work/solvelab
#   SOLVELAB_NODE=/home/user/.nvm/versions/node/v20.20.2/bin/node
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env.deploy" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/.env.deploy"
fi
PI="${SOLVELAB_PI:?Set SOLVELAB_PI (user@host) in .env.deploy or the environment}"
REMOTE="${SOLVELAB_REMOTE:-Work/solvelab}"
NODE="${SOLVELAB_NODE:-node}"

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
