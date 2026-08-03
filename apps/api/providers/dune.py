"""
Raw Dune Analytics API client - "how to talk to Dune" lives here, separate
from what any given fetcher does with the response. Dune only answers
pre-built SQL queries by numeric id (dune.com/queries/{id}) - there's no
generic "give me whale transfers for token X" endpoint here, so callers
need a query already saved on Dune before any of this is useful.
"""

import httpx
from config import DUNE_API_KEY

BASE_URL = "https://api.dune.com/api/v1"


def _headers() -> dict:
    if not DUNE_API_KEY:
        raise RuntimeError("DUNE_API_KEY not configured")
    return {"X-Dune-API-Key": DUNE_API_KEY}


async def get_latest_results(query_id: int) -> list[dict]:
    """
    Latest cached results for a saved query - no fresh execution, no
    credits spent. Dune's own cache is usually minutes to hours old;
    fine for anything that doesn't need real-time data.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BASE_URL}/query/{query_id}/results", headers=_headers())
        if r.status_code != 200:
            raise RuntimeError(f"Dune API returned {r.status_code}")
        return r.json().get("result", {}).get("rows", [])


async def execute_query(query_id: int, params: dict | None = None) -> str:
    """Triggers a fresh execution of `query_id` (spends credits), returns
    the execution_id to pass to get_execution_status()/get_execution_results()."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{BASE_URL}/query/{query_id}/execute",
            headers=_headers(),
            json={"query_parameters": params or {}},
        )
        if r.status_code != 200:
            raise RuntimeError(f"Dune API returned {r.status_code}")
        return r.json()["execution_id"]


async def get_execution_status(execution_id: str) -> str:
    """One of QUERY_STATE_PENDING/EXECUTING/COMPLETED/FAILED/CANCELLED -
    poll this until COMPLETED before calling get_execution_results()."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE_URL}/execution/{execution_id}/status", headers=_headers())
        if r.status_code != 200:
            raise RuntimeError(f"Dune API returned {r.status_code}")
        return r.json().get("state", "UNKNOWN")


async def get_execution_results(execution_id: str) -> list[dict]:
    """Results for a prior execute_query() call, once its status is COMPLETED."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BASE_URL}/execution/{execution_id}/results", headers=_headers())
        if r.status_code != 200:
            raise RuntimeError(f"Dune API returned {r.status_code}")
        return r.json().get("result", {}).get("rows", [])
