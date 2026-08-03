from config import ETHERSCAN_API_KEY
from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import etherscan
from sqlmodel import Session


def get_protocol_whale_config(protocol_id: str) -> tuple[str, int] | None:
    """Returns (token_address, chain_id) for `protocol_id`'s whale-transfer
    queries, or None if untracked - no token address on the row, or its
    chain isn't one of Etherscan's V2 supported ids."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol or not protocol.whale_token_address:
            return None
        chain_id = etherscan.resolve_chain_id(protocol.chain)
        if chain_id is None:
            return None
        return protocol.whale_token_address, chain_id


class WhalesFetcher(BaseFetcher):
    """Fetches large wallet outflows via Etherscan's token-transfer API."""

    key = "whales"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        config = get_protocol_whale_config(protocol_id)
        if not ETHERSCAN_API_KEY or not config:
            return {}
        token, chain_id = config

        transfers = await etherscan.get_token_transfers(token, chain_id, offset=100)

        whale_outflow = 0.0
        max_transfer = 0.0
        for tx in transfers:
            decimals = int(tx.get("tokenDecimal") or 18)
            val = float(tx.get("value", 0) or 0) / (10 ** decimals)
            if val > 1_000_000:
                whale_outflow += val
                if val > max_transfer:
                    max_transfer = val

        return {
            "net_outflow_24h": whale_outflow,
            "suspicious_team_transfers": 1 if whale_outflow > 5_000_000 else 0,
            "largest_single_transfer": max_transfer
        }
