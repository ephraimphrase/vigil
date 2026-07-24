import httpx
from config import ALCHEMY_API_KEY
from ingestion.whales import PROTOCOL_TOKENS
from ingestion.schemas import LiquidationSignal

def _empty_liquidation_signal() -> LiquidationSignal:
    return {
        "liquidation_volume_24h": 0,
        "large_liquidations_count": 0
    }

async def fetch_liquidations(protocol: str) -> LiquidationSignal:
    """
    Fetches liquidation signals via Alchemy Logs.
    Returns neutral zeros if the API key is missing or the request fails.
    """
    token = PROTOCOL_TOKENS.get(protocol)
    
    if not ALCHEMY_API_KEY or not token:
        return _empty_liquidation_signal()

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
        try:
            r = await client.post(url, json=payload)
            if r.status_code == 200:
                data = r.json()
                logs = data.get("result", [])
                
                # In production, we'd parse the log data for actual volume.
                # For this simplified implementation, we estimate volume by log count.
                return {
                    "liquidation_volume_24h": len(logs) * 50_000,
                    "large_liquidations_count": len(logs)
                }
            else:
                raise Exception(f"Alchemy API returned {r.status_code}")
                
        except Exception as e:
            print(f"[WARN] Alchemy liquidations fetch failed for {protocol}: {e}")
            return _empty_liquidation_signal()
