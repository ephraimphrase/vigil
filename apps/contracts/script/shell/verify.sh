#!/usr/bin/env bash
# Verifies every contract in data/<chainid>/deployedContracts.json on
# Etherscan (works for Base/Base Sepolia too via Etherscan's unified V2
# API - one ETHERSCAN_API_KEY, --chain picks the network). Only makes
# sense for a real, publicly-reachable deployment: RPC_URL pointing at
# localhost means there's nothing for a public explorer to find, even if
# it's impersonating a real chain id via a fork, so this refuses to run
# against it rather than submit a doomed (or, worse, wrong) verification.
#
# Usage: ./script/shell/verify.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.example to .env first." >&2
  exit 1
fi
set -a
source "$ENV_FILE"
set +a

: "${RPC_URL:?RPC_URL not set in .env}"
: "${ETHERSCAN_API_KEY:?ETHERSCAN_API_KEY not set in .env - get one at https://etherscan.io/apidashboard, works across chains via the Etherscan V2 API}"

if [[ "$RPC_URL" == *localhost* || "$RPC_URL" == *127.0.0.1* ]]; then
  echo "RPC_URL ($RPC_URL) is local - nothing to verify. Point RPC_URL at a real deployment (see .env.example's Base Sepolia / Base mainnet sections) first." >&2
  exit 1
fi

CHAIN_ID="$(cast chain-id --rpc-url "$RPC_URL")"
MANIFEST="data/$CHAIN_ID/deployedContracts.json"

if [[ ! -f "$MANIFEST" ]]; then
  echo "No $MANIFEST found - nothing deployed on chain $CHAIN_ID yet." >&2
  exit 1
fi

# Known contract name -> <path>:<name> forge verify-contract identifier.
# Extend this alongside DeployRegistrar._registerContract() call sites -
# a name registered there but missing here just gets skipped below.
declare -A CONTRACT_PATHS=(
  [WETH9]="src/token/WETH9.sol:WETH9"
  [HealthOracle]="src/oracle/HealthOracle.sol:HealthOracle"
  [VaultFactory]="src/vault/VaultFactory.sol:VaultFactory"
  [VigilVault]="src/vault/VigilVault.sol:VigilVault"
  [VigilZapRouter]="src/router/VigilZapRouter.sol:VigilZapRouter"
)

names="$(grep -oE '"[A-Za-z0-9_]+"\s*:' "$MANIFEST" | tr -d '": ')"

for name in $names; do
  address="$(
    python3 - "$MANIFEST" "$name" <<'PYEOF' || true
import json, sys
data = json.load(open(sys.argv[1]))
print(data.get(sys.argv[2], ""))
PYEOF
  )"

  path="${CONTRACT_PATHS[$name]:-}"
  if [[ -z "$path" ]]; then
    echo "Skipping $name - no known source path (add it to CONTRACT_PATHS in this script)."
    continue
  fi
  if [[ -z "$address" ]]; then
    echo "Skipping $name - couldn't read its address out of $MANIFEST."
    continue
  fi

  echo
  echo "== Verifying $name ($address) on chain $CHAIN_ID =="
  forge verify-contract "$address" "$path" \
    --chain "$CHAIN_ID" \
    --rpc-url "$RPC_URL" \
    --etherscan-api-key "$ETHERSCAN_API_KEY" \
    --guess-constructor-args \
    --watch
done
