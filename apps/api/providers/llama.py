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
YIELDS_BASE_URL = "https://yields.llama.fi"


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


async def get_fees(slug: str) -> dict:
    """
    /summary/fees/{slug} - protocol fee/revenue totals (24h/48hto24h/7d/
    30d/1y/all-time, all USD) plus 1d/7d/30d % change. Not every protocol
    has fee data tracked (verified 2026-08-03: works for lending
    protocols too, e.g. interest spread counts as a fee, not just DEXs) -
    a non-200 here means "not tracked for this slug", which callers
    should treat as empty rather than a hard failure.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE_URL}/summary/fees/{slug}")
        if r.status_code != 200:
            raise RuntimeError(f"DeFiLlama /summary/fees/{slug} returned {r.status_code}")
        return r.json()


async def get_dex_volume(slug: str) -> dict:
    """
    /summary/dexs/{slug} - protocol DEX trading volume totals (same
    24h/7d/30d/1y/all-time shape as get_fees). Only meaningful for
    DEX-type protocols - verified 2026-08-03: 400s for lending protocols
    (Compound, Silo, Morpho), 200s for actual DEXs (Curve, Velodrome,
    Shadow) - callers should treat a non-200 as "not a DEX", not a
    failure.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE_URL}/summary/dexs/{slug}")
        if r.status_code != 200:
            raise RuntimeError(f"DeFiLlama /summary/dexs/{slug} returned {r.status_code}")
        return r.json()


async def get_pools() -> list:
    """
    /pools on yields.llama.fi (a different subdomain/service than the
    rest of this file) - every yield-bearing pool DeFiLlama tracks,
    across every protocol and chain: ~15.7k pools, ~10MB, verified
    2026-08-03. No per-protocol endpoint exists here, unlike get_fees/
    get_dex_volume - callers filter by a pool's `project` field
    themselves (see ingestion/yields.py), same "list everything, filter
    yourself" shape as get_hacks(). Given the size, callers should cache
    this rather than call it once per protocol per ingest cycle.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{YIELDS_BASE_URL}/pools")
        if r.status_code != 200:
            raise RuntimeError(f"DeFiLlama /pools returned {r.status_code}")
        data = r.json()
        return data.get("data", []) if isinstance(data, dict) else []
