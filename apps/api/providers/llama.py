"""
Raw DeFiLlama API client - "how to talk to DeFiLlama" lives here, separate
from what any given fetcher (tvl.py, security.py) does with the response.
Every function here does exactly one HTTP call and returns exactly what
DeFiLlama sent back (or a minimal decode for the plain-text /tvl endpoint) -
no filtering, no scoring, no picking-a-subset-of-fields. That happens in
extract_metadata() below or in the fetchers that call this.
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


# Every scalar/simple field worth surfacing from a get_protocol() payload.
# Not every protocol populates every one of these (category/audits are
# common gaps) - .get() everywhere so a missing field is just None/empty,
# never an error.
_METADATA_KEYS = (
    "name", "symbol", "url", "description", "logo", "category",
    "twitter", "gecko_id", "cmcId", "mcap", "treasury", "methodology",
    "audits", "audit_links", "chains", "hallmarks",
)


def extract_metadata(data: dict) -> dict:
    """Pulls every extractable field off a get_protocol() payload - raw
    pass-through/counts only, no interpretation of what any of it means
    (that's scoring's job)."""
    metadata = {k: data.get(k) for k in _METADATA_KEYS}
    metadata["chain_count"] = len(data.get("chainTvls", {}))
    metadata["hacks"] = data.get("hacks", [])
    metadata["hacks_reported"] = len(data.get("hacks", []))
    metadata["raises"] = data.get("raises", [])
    metadata["raises_count"] = len(data.get("raises", []))
    metadata["total_raised"] = sum(r.get("amount") or 0 for r in data.get("raises", []))
    metadata["github_repos"] = data.get("github", [])
    metadata["stablecoins"] = data.get("stablecoins", [])
    metadata["governance_ids"] = data.get("governanceID", [])
    return metadata
