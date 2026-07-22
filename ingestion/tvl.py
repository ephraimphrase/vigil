import httpx

async def fetch_tvl(protocol: str) -> dict:
    """
    Fetches TVL using DeFiLlama API.
    """
    # Defillama uses specific slugs, map them if needed
    slug_map = {
        "aave": "aave",
        "compound": "compound",
        "uniswap": "uniswap",
        "curve": "curve-dex",
        "makerdao": "makerdao"
    }
    
    slug = slug_map.get(protocol, protocol)
    
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(f"https://api.llama.fi/protocol/{slug}")
            if r.status_code == 200:
                data = r.json()
                tvl = data.get("tvl", [])
                
                if not tvl:
                    return {"tvl_current": 0, "tvl_delta_24h": 0, "tvl_delta_7d": 0}
                    
                current_tvl = tvl[-1].get("totalLiquidityUSD", 0)
                
                # Simplified delta calculation for hackathon
                return {
                    "tvl_current": current_tvl,
                    "tvl_delta_24h": 0.0, # Placeholder
                    "tvl_delta_7d": 0.0   # Placeholder
                }
        except Exception:
            pass
            
    return {"tvl_current": 0, "tvl_delta_24h": 0, "tvl_delta_7d": 0}
