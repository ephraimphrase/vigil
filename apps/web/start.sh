#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

ROOT="$(cd ../.. && pwd)"

if ! command -v docker &>/dev/null; then
  echo "docker not found — install Docker to run the shared Postgres/Redis instances." >&2
  exit 1
fi

echo "Starting Postgres, Redis, and Redis Commander (docker compose)..."
docker compose -f "$ROOT/docker-compose.yml" up -d postgres redis redis-commander

wait_healthy() {
  local container="$1"
  echo -n "Waiting for $container to be healthy..."
  until [[ "$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null)" == "healthy" ]]; do
    echo -n "."
    sleep 1
  done
  echo " ready."
}

wait_healthy vigil-postgres
wait_healthy vigil-redis

exec next dev --turbopack --port 3001
