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
  [Faucet]="src/token/Faucet.sol:Faucet"
)

# DeployManyMockVaults.s.sol registers many vaults/adapters under
# per-instance labels (e.g. "Vault_steth-0", "Aave_steth-0_aave") instead
# of the fixed names above, so those need a pattern fallback rather than
# an exact CONTRACT_PATHS entry: anything named "Vault_*" is a VigilVault,
# anything else not already known is a MockStrategyAdapter (the only other
# contract type that script deploys per-instance).
resolve_path() {
  local name="$1"
  if [[ -n "${CONTRACT_PATHS[$name]:-}" ]]; then
    echo "${CONTRACT_PATHS[$name]}"
  elif [[ "$name" == Vault_* ]]; then
    echo "src/vault/VigilVault.sol:VigilVault"
  else
    echo "src/adapter/MockStrategyAdapter.sol:MockStrategyAdapter"
  fi
}

names="$(grep -oE '"[A-Za-z0-9_-]+"\s*:' "$MANIFEST" | tr -d '": ')"

for name in $names; do
  address="$(
    python3 - "$MANIFEST" "$name" <<'PYEOF' || true
import json, sys
data = json.load(open(sys.argv[1]))
print(data.get(sys.argv[2], ""))
PYEOF
  )"

  path="$(resolve_path "$name")"
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
