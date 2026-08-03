from datetime import datetime, timedelta, timezone

from ingestion.base_fetcher import BaseFetcher
from providers import thegraph
from providers.subgraphs import aave as aave_subgraph

# providers/subgraphs/aave.py is the single source of truth for which id
# is "the" Aave V3 Ethereum-mainnet subgraph, and for the LiquidationCall
# query itself - see apps/api/subgraphs.md for how the id was cross-
# checked against aave/protocol-subgraphs. Scoped to Aave-style protocols
# only for now, same as the code this replaces (it hardcoded Aave's
# LiquidationCall event topic hash) - a second lending protocol needs its
# own subgraph_id and schema confirmed the same way before being added
# (see providers/subgraphs/ for the Messari-schema candidates already
# verified for compound/venus/morpho/silo/gmx, not yet wired in here).
AAVE_V3_ETHEREUM_SUBGRAPH_ID = aave_subgraph.SUBGRAPHS["v3"]

# Below this, a single liquidation isn't "large" - keeps the count
# meaningful instead of just re-stating the total. The code this replaces
# conflated the two: it returned every liquidation's count as
# "large_liquidations_count" with no size threshold at all.
LARGE_LIQUIDATION_USD = 100_000


class LiquidationsFetcher(BaseFetcher):
    """
    Fetches Aave V3 (Ethereum mainnet) liquidation events via The Graph's
    decentralized network (see providers/thegraph.py) - replaces the
    Etherscan getLogs approach this used to use, which queried
    fromBlock="latest" to toBlock="latest" by default (a single block,
    not the 24h window "liquidation_volume_24h" claims) and estimated
    volume by log count rather than real amounts. The subgraph's
    LiquidationCall entity gives real USD-denominated collateral amounts
    directly (collateralAmount, collateralReserve.decimals,
    collateralAssetPriceUSD), no block-range math or volume guessing
    needed.
    """

    key = "liquidations"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        if protocol_id != "aave":
            return {}

        since = int((datetime.now(timezone.utc) - timedelta(hours=24)).timestamp())
        data = await thegraph.query(AAVE_V3_ETHEREUM_SUBGRAPH_ID, aave_subgraph.LIQUIDATIONS_QUERY, {"since": since})
        calls = data.get("liquidationCalls", [])

        volume_usd = 0.0
        large_count = 0
        for c in calls:
            decimals = int(c["collateralReserve"]["decimals"])
            amount = int(c["collateralAmount"]) / (10 ** decimals)
            usd = amount * float(c["collateralAssetPriceUSD"])
            volume_usd += usd
            if usd >= LARGE_LIQUIDATION_USD:
                large_count += 1

        return {
            "liquidation_volume_24h":   round(volume_usd, 2),
            "liquidation_count_24h":    len(calls),
            "large_liquidations_count": large_count,
            "source":                   "thegraph",
        }
