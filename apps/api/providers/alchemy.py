"""
Raw Alchemy API client (JSON-RPC) - "how to talk to Alchemy" lives here,
separate from what any given fetcher (whales.py, liquidations.py) does
with the response. Unlike Etherscan's V2 API, Alchemy doesn't unify
chains behind one endpoint - each network has its own subdomain, same key.
"""

import httpx
from config import ALCHEMY_API_KEY

# Alchemy subdomain per Protocol.chain value this repo uses. Alchemy has
# no endpoint for berachain or sonic as of this writing, so they're
# absent here - resolve_network() returns None for those, same as any
# chain Alchemy doesn't cover.
NETWORK_SUBDOMAINS = {
    "ethereum":  "eth-mainnet",
    "arbitrum":  "arb-mainnet",
    "optimism":  "opt-mainnet",
    "base":      "base-mainnet",
    "bnb-chain": "bnb-mainnet",
}


def resolve_network(chain: str) -> str | None:
    """Looks up the Alchemy network subdomain for a Protocol.chain value."""
    return NETWORK_SUBDOMAINS.get(chain)


async def _rpc(network: str, method: str, params: list) -> dict:
    if not ALCHEMY_API_KEY:
        raise RuntimeError("ALCHEMY_API_KEY not configured")

    url = f"https://{network}.g.alchemy.com/v2/{ALCHEMY_API_KEY}"
    payload = {"id": 1, "jsonrpc": "2.0", "method": method, "params": params}

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(url, json=payload)
        if r.status_code != 200:
            raise RuntimeError(f"Alchemy API returned {r.status_code}")
        data = r.json()
        if "error" in data:
            raise RuntimeError(f"Alchemy RPC error: {data['error']}")
        return data.get("result", {}) or {}


async def get_asset_transfers(contract_address: str, network: str, *, max_count: int = 1000) -> list[dict]:
    """
    ERC20 transfers for `contract_address` via alchemy_getAssetTransfers,
    oldest-tracked-block through latest. Each result's `value` is already
    decimal-adjusted (unlike Etherscan's tokentx, which returns the raw
    integer amount) - no `tokenDecimal` division needed.
    """
    result = await _rpc(network, "alchemy_getAssetTransfers", [{
        "fromBlock": "0x0",
        "toBlock": "latest",
        "category": ["erc20"],
        "withMetadata": False,
        "excludeZeroValue": True,
        "maxCount": hex(max_count),
        "contractAddresses": [contract_address],
    }])
    return result.get("transfers", [])


async def get_logs(
    topic0: str,
    network: str,
    *,
    address: str | None = None,
    from_block: str = "latest",
    to_block: str = "latest",
) -> list[dict]:
    """Event logs matching `topic0` via eth_getLogs. `address` narrows to a single contract."""
    params = {"fromBlock": from_block, "toBlock": to_block, "topics": [topic0]}
    if address:
        params["address"] = address
    result = await _rpc(network, "eth_getLogs", [params])
    return result if isinstance(result, list) else []
