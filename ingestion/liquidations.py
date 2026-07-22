import httpx
import random
from config import ALCHEMY_API_KEY

# We will use the same token map for tracking large liquidations involving these assets
from ingestion.whales import PROTOCOL_TOKENS

# Global override for the hackathon demo
DEMO_OVERRIDE_LIQUIDATIONS = False

async def fetch_liquidations(protocol: str) -> dict:
    """
    Fetches liquidation signals. 
    In a full production environment, this is an Alchemy WebSocket listener 
    for `LiquidationCall` events. For this architecture (15m polling), 
    we simulate the latest window via HTTP or use realistic fallback data.
    """
    if DEMO_OVERRIDE_LIQUIDATIONS:
        # Force a massive liquidation cascade for the demo
        return {
            "liquidation_volume_24h": 150_000_000, 
            "large_liquidations_count": 45
        }

    token = PROTOCOL_TOKENS.get(protocol)
    
    if not ALCHEMY_API_KEY or not token:
        # Simulate nominal healthy state
        return {
            "liquidation_volume_24h": random.uniform(5_000, 50_000), 
            "large_liquidations_count": random.randint(0, 2)
        }

    # For the hackathon, we simulate querying the last hour of liquidation logs
    # using Alchemy's eth_getLogs. 
    url = f"https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"
    
    # This is a generic Aave V3 LiquidationCall signature hash
    # 0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "eth_getLogs",
        "params": [{
            "fromBlock": "latest", # In reality we'd subtract ~6000 blocks
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
                
                return {
                    "liquidation_volume_24h": len(logs) * 50_000, # Mocked value per log
                    "large_liquidations_count": len(logs)
                }
            else:
                raise Exception(f"Alchemy API returned {r.status_code}")
                
        except Exception as e:
            print(f"[WARN] Alchemy liquidations fetch failed for {protocol}: {e}")
            return {
                "liquidation_volume_24h": 0,
                "large_liquidations_count": 0
            }
