import httpx
from config import ALCHEMY_API_KEY

# Known protocol token contracts for Alchemy transfers
PROTOCOL_TOKENS = {
    "aave": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    "compound": "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    "uniswap": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "curve": "0xD533a949740bb3306d119CC777fa900bA034cd52",
    "makerdao": "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    "lido": "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32"
}

def _empty_whale_signal() -> dict:
    return {
        "net_outflow_24h": 0,
        "suspicious_team_transfers": 0,
        "largest_single_transfer": 0
    }

async def fetch_whale_moves(protocol: str) -> dict:
    """
    Fetches large wallet outflows using Alchemy Transfers API.
    Returns neutral zeros if the API key is missing or the request fails.
    """
    token = PROTOCOL_TOKENS.get(protocol)
    
    if not ALCHEMY_API_KEY or not token:
        return _empty_whale_signal()

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
        try:
            r = await client.post(url, json=payload)
            if r.status_code == 200:
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
            else:
                raise Exception(f"Alchemy API returned {r.status_code}")
                
        except Exception as e:
            print(f"[WARN] Alchemy whales fetch failed for {protocol}: {e}")
            return _empty_whale_signal()
