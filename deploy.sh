#!/usr/bin/env bash
#
# socialvista-deploy — pull latest code and (re)build/restart the prod stack.
#
# Install on the VPS as a global command (run once):
#   chmod +x /root/socialvista/deploy.sh
#   ln -sf /root/socialvista/deploy.sh /usr/local/bin/socialvista-deploy
# Then from anywhere:  socialvista-deploy
#
set -euo pipefail

# Resolve the repo dir even when invoked via the /usr/local/bin symlink.
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> [1/4] Pulling latest code (git pull --ff-only)..."
git pull --ff-only

echo "==> [2/4] Building and (re)starting the stack (db + migrate + app)..."
docker compose up -d --build

echo "==> [3/4] Pruning dangling images..."
docker image prune -f >/dev/null

echo "==> [4/4] Status:"
docker compose ps

echo
echo "==> Done. Live at https://socialvista.co.in"
