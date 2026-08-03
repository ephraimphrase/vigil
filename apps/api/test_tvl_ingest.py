"""
End-to-end smoke test for TVL ingestion only. Fetches real TVL data for
one protocol via TvlFetcher (through resilient_fetch.safe_fetch, so the
Postgres last-known-good cache path gets exercised too), then stores it
under the same Redis key convention routers/webhook/ingest.py and
routers/webhook/tree.py expect (vigil:data:{protocol}:{domain}:{category}).

Nothing in the app currently wires fetchers -> Redis on a schedule -
this script is that missing glue, scoped to just the "tvl" signal, so it
can be checked end-to-end in Redis Commander (localhost:8082).

Run with: python test_tvl_ingest.py [protocol_id]
"""

import asyncio
import json
import sys

from ingestion.resilient_fetch import safe_fetch
from ingestion.tvl import TvlFetcher
from integrations.redis_client import redis_client


async def main(protocol_id: str) -> None:
    fetcher = TvlFetcher()

    print(f"Fetching TVL for '{protocol_id}'...")
    result = await safe_fetch(fetcher, protocol_id)
    print(json.dumps(result, indent=2))

    if result["status"] != "ok":
        print(f"\nFetch failed: {result['error']}")
        return

    redis_key = f"vigil:data:{protocol_id}:{result['channel']}:{result['key']}"
    for metric, value in result["payload"].items():
        value_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
        await redis_client.hset(redis_key, metric, value_str)

    print(f"\nStored in Redis at key: {redis_key}")
    stored = await redis_client.hgetall(redis_key)
    print(json.dumps(stored, indent=2))


if __name__ == "__main__":
    protocol = sys.argv[1] if len(sys.argv) > 1 else "aave"
    asyncio.run(main(protocol))
