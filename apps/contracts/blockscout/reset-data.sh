#!/usr/bin/env bash
# Wipe Blockscout's local index. Required after a fresh anvil chain or old txs will still show.
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE_FILE=anvil.yml
DATA_DIRS=(
  services/blockscout-db-data
  services/stats-db-data
  services/redis-data
)

echo "Stopping Blockscout containers..."
docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

for dir in "${DATA_DIRS[@]}"; do
  if [[ -d "$dir" ]]; then
    echo "Removing $dir..."
    rm -rf "$dir"
  fi
done

echo "Blockscout index cleared."
