#!/usr/bin/env bash
set -euo pipefail

# ─── CONSTANTS ───
BASE="https://api.coingecko.com/api/v3/coins/markets"
QUERY="vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=250"

# ─── FETCH ───
# CoinGecko caps per_page at 250, so top-500-by-market-cap needs both pages.
PAGE1="$(curl -s "${BASE}?${QUERY}&page=1")"
PAGE2="$(curl -s "${BASE}?${QUERY}&page=2")"

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
jq -n --argjson p1 "$PAGE1" --argjson p2 "$PAGE2" '
  ($p1 + $p2)
  | map(select(
      .market_cap > 1000000
      and .total_volume > 0
    ))
  | map({
      symbol: .symbol,
      name: .name,
    })
'
