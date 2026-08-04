"""
Raw Ethplorer API client - "how to talk to Ethplorer" lives here, separate
from what ingestion/whales.py does with the response. Ethereum mainnet
only (no other EVM chains - the name is literally "Eth-plorer"). Uses the
public "freekey" - Ethplorer's own docs explicitly design it for exactly
this kind of use (burst 5 req/s, 2000/day, 3000/week), not a trial that
expires. Fine at this app's 15-minute polling cadence across a handful of
Ethereum-chain protocols; not meant for high request volume.
"""

import httpx

BASE_URL = "https://api.ethplorer.io"
API_KEY = "freekey"


async def get_token_info(address: str) -> dict:
    """
    Full /getTokenInfo/{address} payload - name, symbol, decimals,
    totalSupply, holdersCount, and a `price` block (rate, market cap,
    24h/7d/30d change, volume) when the token has a tracked price.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE_URL}/getTokenInfo/{address}", params={"apiKey": API_KEY})
        if r.status_code != 200:
            raise RuntimeError(f"Ethplorer API returned {r.status_code}")
        data = r.json()
        if "error" in data:
            raise RuntimeError(f"Ethplorer error: {data['error']}")
        return data


async def get_top_holders(address: str, limit: int = 10) -> list[dict]:
    """
    Top `limit` holders (max 100 on freekey) via /getTopTokenHolders -
    each entry has address, balance, rawBalance, and share (% of total
    supply held by that address).
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE_URL}/getTopTokenHolders/{address}",
            params={"apiKey": API_KEY, "limit": min(limit, 100)},
        )
        if r.status_code != 200:
            raise RuntimeError(f"Ethplorer API returned {r.status_code}")
        data = r.json()
        if "error" in data:
            raise RuntimeError(f"Ethplorer error: {data['error']}")
        return data.get("holders", [])
