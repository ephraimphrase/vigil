#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Missing apps/contracts/.env — copy .env.example to .env first." >&2
  exit 1
fi
set -a
source .env
set +a

: "${RPC_URL:?RPC_URL not set in .env}"
: "${DEPLOYER_KEY:?DEPLOYER_KEY not set in .env}"

if [[ "${1:-}" == "--fresh" ]]; then
  echo "Restarting anvil for a clean chain (wipes all existing state)..."
  lsof -ti:8545 -sTCP:LISTEN | xargs kill 2>/dev/null || true
  sleep 1
  if [[ -d blockscout/services/blockscout-db-data ]]; then
    echo "Wiping Blockscout index (explorer DB does not reset with anvil)..."
    ./blockscout/reset-data.sh
  fi
fi

if ! curl -s -o /dev/null "$RPC_URL"; then
  echo "No local chain detected — starting anvil in the background..."
  nohup anvil > /tmp/vigil-anvil.log 2>&1 &
  disown
  until curl -s -o /dev/null "$RPC_URL"; do sleep 0.5; done
  echo "Anvil is up (logs: /tmp/vigil-anvil.log)."
else
  echo "Using already-running chain at $RPC_URL"
fi

echo
echo "== Deploying WETH9 =="
forge script script/DeployWETH.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

echo
echo "== Pulling and deploying DeFi tokens =="
forge script script/PullDefiTokens.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

echo
echo "Done. Chain stays up at $RPC_URL — run 'pnpm explorer' to visualize it."
