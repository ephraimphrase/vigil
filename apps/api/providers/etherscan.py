"""
Raw Etherscan API client (V2, multichain) - "how to talk to Etherscan"
lives here, separate from what any given fetcher (whales.py,
liquidations.py) does with the response. One API key works across every
chain Etherscan's V2 unified endpoint supports - which chain to query is
picked with the `chainid` param, not a different base URL per chain
(V1's per-chain domains like api.arbiscan.io are deprecated).
"""

import httpx
from config import ETHERSCAN_API_KEY

BASE_URL = "https://api.etherscan.io/v2/api"

# Chain ids for every value ingestion/*.py's Protocol.chain column holds
# today (see apps/web/seed/protocol-detail/*.json). "multichain" isn't a
# single chain and has no id here - resolve_chain_id() returns None for it,
# same as any chain Etherscan's V2 API doesn't cover.
CHAIN_IDS = {
    "ethereum":  1,
    "arbitrum":  42161,
    "optimism":  10,
    "base":      8453,
    "bnb-chain": 56,
    "berachain": 80094,
    "sonic":     146,
}


def resolve_chain_id(chain: str) -> int | None:
    """Looks up the Etherscan V2 chainid for a Protocol.chain value."""
    return CHAIN_IDS.get(chain)


async def get_token_transfers(contract_address: str, chain_id: int, *, offset: int = 100) -> list[dict]:
    """
    Most recent ERC20 transfers for `contract_address` on `chain_id` -
    module=account&action=tokentx, sorted newest-first so `offset` recent
    transfers means the last N transfers, not a fromBlock=0 scan of the
    entire chain's history. Each result's `value` is the raw token amount
    (not decimal-adjusted) - divide by 10**int(tokenDecimal) yourself.
    """
    if not ETHERSCAN_API_KEY:
        raise RuntimeError("ETHERSCAN_API_KEY not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(BASE_URL, params={
            "chainid": chain_id,
            "module": "account",
            "action": "tokentx",
            "contractaddress": contract_address,
            "page": 1,
            "offset": offset,
            "sort": "desc",
            "apikey": ETHERSCAN_API_KEY,
        })
        if r.status_code != 200:
            raise RuntimeError(f"Etherscan API returned {r.status_code}")
        data = r.json()
        result = data.get("result")
        return result if isinstance(result, list) else []


async def get_logs(
    topic0: str,
    chain_id: int,
    *,
    address: str | None = None,
    from_block: str = "latest",
    to_block: str = "latest",
) -> list[dict]:
    """
    Event logs matching `topic0` on `chain_id` - module=logs&action=getLogs.
    `address` narrows to a single contract; omitted, Etherscan matches the
    topic across every contract on the chain.
    """
    if not ETHERSCAN_API_KEY:
        raise RuntimeError("ETHERSCAN_API_KEY not configured")

    params = {
        "chainid": chain_id,
        "module": "logs",
        "action": "getLogs",
        "topic0": topic0,
        "fromBlock": from_block,
        "toBlock": to_block,
        "apikey": ETHERSCAN_API_KEY,
    }
    if address:
        params["address"] = address

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(BASE_URL, params=params)
        if r.status_code != 200:
            raise RuntimeError(f"Etherscan API returned {r.status_code}")
        data = r.json()
        result = data.get("result")
        return result if isinstance(result, list) else []
