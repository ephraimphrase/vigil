#!/usr/bin/env bash
# Generates a fresh local dev keypair for DEPLOYER_KEY and any HealthOracle/
# Vault role (ORACLE_ADMIN, ORACLE_SCORER, ORACLE_GUARDIAN, VAULT_KEEPER)
# not already set in .env, so local deploys get real distinct addresses per
# role instead of every vm.envOr(...) fallback collapsing to the same
# shared anvil account - the exact role-separation defeat HealthOracle.sol's
# own comments warn against, even for local testing.
#
# Addresses are written to .env (deploy.sh / DeployAll.s.sol read them via
# vm.envOr / --private-key). Private keys go one-per-file under .keys/
# instead - the whole folder is gitignored, local-dev-only, never for
# production - each file is self-labeled with what that key actually does.
#
# DEPLOYER_KEY is different from the other four: it broadcasts every
# deploy transaction and pays its own gas, so a freshly generated key
# starts at 0 balance. On local anvil (chain 31337) this script auto-funds
# it via the anvil_setBalance cheat RPC; on any other chain there's no
# cheat available - you fund it yourself (a testnet faucet, or a transfer).
set -euo pipefail
cd "$(dirname "$0")/../.."

ENV_FILE=".env"
KEYS_DIR=".keys"
RPC_URL="${RPC_URL:-http://localhost:8545}"
FUND_AMOUNT_WEI="10000000000000000000" # 10 ETH, matches anvil's own default account balance

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.example to .env first." >&2
  exit 1
fi

mkdir -p "$KEYS_DIR"

declare -A DESCRIPTIONS=(
  [DEPLOYER_KEY]="Broadcasts every deploy transaction and pays its own gas. The only key here that needs a funded balance to do anything."
  [ORACLE_ADMIN]="HealthOracle's DEFAULT_ADMIN_ROLE - registers protocols, grants/revokes the other oracle roles. Ultimate control over the oracle."
  [ORACLE_SCORER]="HealthOracle's SCORER_ROLE - the only key that can write health scores. Deliberately the least-protected key in the system; a leaked key is bounded by MAX_DELTA/MIN_INTERVAL, not by trust in this key."
  [ORACLE_GUARDIAN]="HealthOracle's GUARDIAN_ROLE - can only force a score to zero in an emergency. One-directional by design: this key can never raise a score."
  [VAULT_KEEPER]="VigilVault's KEEPER_ROLE - the only key that can call rebalance() to move funds across adapters based on HealthOracle scores."
)
ROLES=(DEPLOYER_KEY ORACLE_ADMIN ORACLE_SCORER ORACLE_GUARDIAN VAULT_KEEPER)
generated_any=false

get_env_value() {
  grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d '=' -f2- || true
}

for role in "${ROLES[@]}"; do
  current="$(get_env_value "$role")"
  if [[ -n "$current" ]]; then
    echo "$role already set, skipping."
    continue
  fi

  echo "Generating a fresh local dev key for $role..."
  output="$(cast wallet new)"
  address="$(echo "$output" | grep "Address:" | awk '{print $2}')"
  privkey="$(echo "$output" | grep "Private key:" | awk '{print $3}')"

  # DEPLOYER_KEY's .env value IS the private key (forge script --private-key
  # expects that directly); the other four are plain addresses, read as
  # `address` via vm.envOr in Solidity.
  env_value="$address"
  if [[ "$role" == "DEPLOYER_KEY" ]]; then
    env_value="$privkey"
  fi

  if grep -qE "^$role=" "$ENV_FILE"; then
    sed -i "s|^$role=.*|$role=$env_value|" "$ENV_FILE"
  else
    echo "$role=$env_value" >> "$ENV_FILE"
  fi

  cat > "$KEYS_DIR/$role.txt" <<EOF
Role:        $role
What it is:  ${DESCRIPTIONS[$role]}
Address:     $address
Private key: $privkey
EOF

  if [[ "$role" == "DEPLOYER_KEY" ]]; then
    chain_id="$(cast chain-id --rpc-url "$RPC_URL" 2>/dev/null || true)"
    if [[ "$chain_id" == "31337" ]]; then
      cast rpc anvil_setBalance "$address" "$FUND_AMOUNT_WEI" --rpc-url "$RPC_URL" >/dev/null
      echo "  Funded with 10 ETH on local anvil."
    else
      echo "  WARNING: not on local anvil (chain id: ${chain_id:-unreachable}) - this key has 0 balance and can't pay gas until you fund it yourself (e.g. a testnet faucet)."
    fi
  fi

  echo "  $role -> $address"
  generated_any=true
done

echo
if [[ "$generated_any" == true ]]; then
  echo "New addresses/keys written to $ENV_FILE."
  echo "Full private key + description for each, one file per role, under $KEYS_DIR/."
else
  echo "All roles already configured in $ENV_FILE - nothing generated."
fi
