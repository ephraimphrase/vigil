#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

docker compose -f anvil.yml up -d

echo "Waiting for backend..."
until docker exec backend sh -c "wget -qO- http://127.0.0.1:4000/api/v2/blocks >/dev/null 2>&1"; do
  sleep 3
done

# nginx starts before the backend is actually ready and caches the bad
# upstream, so it needs a restart once backend is confirmed healthy.
docker restart proxy >/dev/null

echo "Blockscout is up: http://localhost"
