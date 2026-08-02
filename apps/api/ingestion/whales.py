import httpx
from config import ALCHEMY_API_KEY
from ingestion.base_fetcher import BaseFetcher

# Known protocol token contracts for Alchemy transfers
PROTOCOL_TOKENS = {
    "aave": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    "compound": "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    "uniswap": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "curve": "0xD533a949740bb3306d119CC777fa900bA034cd52",
    "makerdao": "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    "lido": "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32"
}


class WhalesFetcher(BaseFetcher):
    """Fetches large wallet outflows using Alchemy Transfers API."""

    key = "whales"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        token = PROTOCOL_TOKENS.get(protocol_id)
        if not ALCHEMY_API_KEY or not token:
            return {}

        url = f"https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"
        payload = {
            "id": 1,
            "jsonrpc": "2.0",
            "method": "alchemy_getAssetTransfers",
            "params": [{
                "fromBlock": "0x0",
                "toBlock": "latest",
                "category": ["erc20"],
                "withMetadata": False,
                "excludeZeroValue": True,
                "maxCount": "0x3e8",
                "contractAddresses": [token]
            }]
        }

        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json=payload)
            if r.status_code != 200:
                raise RuntimeError(f"Alchemy API returned {r.status_code}")

            data = r.json()
            transfers = data.get("result", {}).get("transfers", [])

            whale_outflow = 0
            max_transfer = 0
            for tx in transfers[-100:]:
                val = float(tx.get("value", 0) or 0)
                if val > 1_000_000:
                    whale_outflow += val
                    if val > max_transfer:
                        max_transfer = val

            return {
                "net_outflow_24h": whale_outflow,
                "suspicious_team_transfers": 1 if whale_outflow > 5_000_000 else 0,
                "largest_single_transfer": max_transfer
            }
