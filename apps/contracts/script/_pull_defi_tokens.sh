#!/usr/bin/env bash
set -euo pipefail

# ─── CONSTANTS ───
BASE="https://api.coingecko.com/api/v3/coins/markets"
QUERY="vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=250"

# ─── FETCH ───
# CoinGecko caps per_page at 250, so top-500-by-market-cap needs both pages.
# Pages are fetched to temp files rather than shell variables: passing the
# full payload to jq via --argjson blows past the shell's argument-length
# limit once the harness environment adds enough exported vars.
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -s "${BASE}?${QUERY}&page=1" >"$TMP_DIR/page1.json"
curl -s "${BASE}?${QUERY}&page=2" >"$TMP_DIR/page2.json"

# ─── FILTER + SHAPE ───
# Filters applied (see conversation for why each one is here):
#   market_cap > 1,000,000   - kills dead/zero-cap legacy wrapper tokens
#   total_volume > 0         - kills tokens with no real liquidity
# NOT applied here: market_cap_rank IS NOT NULL — some legit liquid-staking
# tokens (stETH, frxETH) get a null rank from CoinGecko on purpose. Add a
# symbol whitelist if you want rank-based filtering without losing those.
#
# Key order in the object below must match TokenData's struct field order
# in PullDefiTokens.s.sol exactly - Foundry's JSON decode is positional.
jq -n --slurpfile p1 "$TMP_DIR/page1.json" --slurpfile p2 "$TMP_DIR/page2.json" '
  ($p1[0] + $p2[0])
  | map(select(
      .market_cap > 1000000
      and .total_volume > 0
    ))
  | map({
      symbol: .symbol,
      name: .name,
    })
'
