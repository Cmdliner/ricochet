#!/usr/bin/env bash
# Update the server to the latest code on the main branch. Run it on the server:  ./deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

git pull --ff-only
cd deploy
docker compose up -d --build --remove-orphans
docker image prune -f > /dev/null
docker compose ps
