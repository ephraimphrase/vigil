from config import ETHERSCAN_API_KEY
from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import etherscan
from sqlmodel import Session

# Generic Aave V3 LiquidationCall signature hash
LIQUIDATION_CALL_TOPIC = "0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286"


def _get_protocol_whale_config(protocol_id: str) -> tuple[str, int] | None:
    """Returns (token_address, chain_id) for `protocol_id`, or None if
    untracked - no token address on the row, or its chain isn't one of
    Etherscan's V2 supported ids. Local to this module rather than
    imported from ingestion/whales.py - that fetcher now runs on
    Ethplorer only and no longer needs an Etherscan chain id at all."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol or not protocol.whale_token_address:
            return None
        chain_id = etherscan.resolve_chain_id(protocol.chain)
        if chain_id is None:
            return None
        return protocol.whale_token_address, chain_id


class LiquidationsFetcher(BaseFetcher):
    """
    Fetches liquidation signals via Etherscan event logs (Aave V3's
    LiquidationCall topic). Not commented into registry.py's
    ONCHAIN_FETCHERS - see git history: an earlier version of this file
    queried a verified Aave subgraph via The Graph for real USD-
    denominated volume, but providers/thegraph.py and providers/subgraphs/
    (the files it depended on) were removed from the repo, so this reverts
    to the simpler Etherscan-logs approach that doesn't need them.
    getLogs' default fromBlock/toBlock=("latest","latest") is a single
    block, not a real 24h window - "volume" below is a rough estimate by
    log count, not real amounts (there's no cheap way to get real
    liquidation dollar amounts from raw logs without decoding them
    against each reserve's price, which is exactly what the subgraph
    approach existed to avoid).
    """

    key = "liquidations"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        config = _get_protocol_whale_config(protocol_id)
        if not ETHERSCAN_API_KEY or not config:
            return {}
        _, chain_id = config

        logs = await etherscan.get_logs(LIQUIDATION_CALL_TOPIC, chain_id)

        return {
            "liquidation_volume_24h": len(logs) * 50_000,
            "large_liquidations_count": len(logs),
            "source": "etherscan",
        }
