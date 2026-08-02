import httpx
from config import ALCHEMY_API_KEY
from ingestion.whales import PROTOCOL_TOKENS
from ingestion.base_fetcher import BaseFetcher


class LiquidationsFetcher(BaseFetcher):
    """Fetches liquidation signals via Alchemy Logs."""

    key = "liquidations"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        token = PROTOCOL_TOKENS.get(protocol_id)
        if not ALCHEMY_API_KEY or not token:
            return {}

        url = f"https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"

        # Generic Aave V3 LiquidationCall signature hash
        payload = {
            "id": 1,
            "jsonrpc": "2.0",
            "method": "eth_getLogs",
            "params": [{
                "fromBlock": "latest",
                "toBlock": "latest",
                "topics": ["0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286"]
            }]
        }

        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json=payload)
            if r.status_code != 200:
                raise RuntimeError(f"Alchemy API returned {r.status_code}")

            data = r.json()
            logs = data.get("result", [])

            # In production, we'd parse the log data for actual volume.
            # For this simplified implementation, we estimate volume by log count.
            return {
                "liquidation_volume_24h": len(logs) * 50_000,
                "large_liquidations_count": len(logs)
            }
