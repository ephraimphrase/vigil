from config import ETHERSCAN_API_KEY
from ingestion.whales import get_protocol_whale_config
from ingestion.base_fetcher import BaseFetcher
from providers import etherscan

# Generic Aave V3 LiquidationCall signature hash
LIQUIDATION_CALL_TOPIC = "0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286"


class LiquidationsFetcher(BaseFetcher):
    """Fetches liquidation signals via Etherscan event logs."""

    key = "liquidations"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        config = get_protocol_whale_config(protocol_id)
        if not ETHERSCAN_API_KEY or not config:
            return {}
        _, chain_id = config

        logs = await etherscan.get_logs(LIQUIDATION_CALL_TOPIC, chain_id)

        # In production, we'd parse the log data for actual volume.
        # For this simplified implementation, we estimate volume by log count.
        return {
            "liquidation_volume_24h": len(logs) * 50_000,
            "large_liquidations_count": len(logs)
        }
