"""
Raw DeFiLlama API client - "how to talk to DeFiLlama" lives here, separate
from what any given fetcher (tvl.py, security.py) does with the response.
Every function here does exactly one HTTP call and returns exactly what
DeFiLlama sent back (or a minimal decode for the plain-text /tvl endpoint) -
no filtering, no scoring, no picking-a-subset-of-fields. That happens in
the fetchers that call this.
"""

import httpx

BASE_URL = "https://api.llama.fi"


async def get_protocol(slug: str) -> dict:
    """
    Full /protocol/{slug} payload - the richest DeFiLlama endpoint for a
    single protocol: tvl time-series, market cap, chain breakdown,
    hallmarks (notable historical events), funding raises, hacks, audits,
    socials, and more. ~100KB-1.6MB depending on the protocol's history.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BASE_URL}/protocol/{slug}")
        if r.status_code != 200:
            raise RuntimeError(f"DeFiLlama /protocol/{slug} returned {r.status_code}")
        return r.json()


async def get_tvl(slug: str) -> float:
    """
    Fast /tvl/{slug} endpoint - current TVL only, no metadata, no
    time-series. Use for protocols where get_protocol() would time out.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE_URL}/tvl/{slug}")
        if r.status_code != 200:
            raise RuntimeError(f"DeFiLlama /tvl/{slug} returned {r.status_code}")
        return float(r.text.strip())


async def get_hacks() -> list:
    """/hacks - every known DeFi hack DeFiLlama tracks, across all protocols."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BASE_URL}/hacks")
        if r.status_code != 200:
            raise RuntimeError(f"DeFiLlama /hacks returned {r.status_code}")
        data = r.json()
        return data if isinstance(data, list) else []
