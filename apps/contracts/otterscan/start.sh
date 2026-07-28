#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

CONTAINER_NAME="vigil-otterscan"
PORT=5100

if [[ "${1:-}" == "--fresh" ]]; then
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
fi

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Otterscan is already running: http://localhost:$PORT"
  exit 0
fi

# Remove a stopped container from a previous run before recreating it.
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

# Otterscan is a static SPA - the container just serves files over nginx and
# never talks to anvil itself. ERIGON_URL is baked into config.json and read
# by the BROWSER, so it must be a host-reachable address (localhost), not
# host.docker.internal - that's a Docker-internal-only DNS name the browser
# can't resolve.
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:80" \
  -e ERIGON_URL="http://localhost:8545" \
  otterscan/otterscan:latest >/dev/null

echo "Otterscan is up: http://localhost:$PORT"
