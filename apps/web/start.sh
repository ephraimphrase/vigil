#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

ROOT="$(cd ../.. && pwd)"
CONTAINER="vigil-postgres"

if ! command -v docker &>/dev/null; then
  echo "docker not found — install Docker to run the shared Postgres instance." >&2
  exit 1
fi

echo "Starting Postgres (docker compose)..."
docker compose -f "$ROOT/docker-compose.yml" up -d postgres

echo -n "Waiting for Postgres to be healthy..."
until [[ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)" == "healthy" ]]; do
  echo -n "."
  sleep 1
done
echo " ready."

exec next dev --turbopack --port 3001
