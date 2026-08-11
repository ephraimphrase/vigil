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
  if [[ -n "${BASE_RPC_URL:-}" ]]; then
    FORK_BLOCK_NUMBER="${FORK_BLOCK_NUMBER:-33000000}"
    echo "No local chain detected — starting anvil forked from Base ($BASE_RPC_URL) at block $FORK_BLOCK_NUMBER..."
    nohup anvil --fork-url "$BASE_RPC_URL" --chain-id 8453 --fork-block-number "$FORK_BLOCK_NUMBER" \
      > /tmp/vigil-anvil.log 2>&1 &
  else
    echo "No local chain detected — starting anvil in the background..."
    nohup anvil > /tmp/vigil-anvil.log 2>&1 &
  fi
  disown
  until curl -s -o /dev/null "$RPC_URL"; do sleep 0.5; done
  echo "Anvil is up (logs: /tmp/vigil-anvil.log)."
else
  echo "Using already-running chain at $RPC_URL"
fi

echo
echo "== Deploying WETH9 =="
forge script script/deploy/DeployWETH.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

echo
echo "== Pulling and deploying DeFi tokens =="
forge script script/deploy/SeedTokens.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

echo
echo "== Deploying and funding Faucet =="
forge script script/deploy/DeployFaucet.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

echo
echo "== Generating role keys (any of ORACLE_ADMIN/SCORER/GUARDIAN/VAULT_KEEPER not already set) =="
./script/shell/generate-roles.sh
set -a
source .env
set +a

echo
echo "== Deploying core stack (HealthOracle, VaultFactory, VigilVault, VigilZapRouter) =="
forge script script/deploy/DeployAll.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

echo
echo "== Syncing deployed contracts to apps/web =="
(cd ../web && npx tsx scripts/sync-contracts.ts && npx tsx scripts/sync-test-tokens.ts)

echo
echo "Done. Chain stays up at $RPC_URL — run 'pnpm explorer' to visualize it."
