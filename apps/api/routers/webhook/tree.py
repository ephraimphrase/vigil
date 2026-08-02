import json
from typing import Any, Dict, List, Tuple

from fastapi import HTTPException

from integrations.redis_client import redis_client


async def build_dynamic_tree(protocol: str) -> Tuple[Dict[str, Any], List[str]]:
    """
    Reconstructs the dynamic onchain/offchain data tree for `protocol` from
    Redis (see ingest.py for how it's written). Raises 404 if nothing has
    been ingested for this protocol yet.
    """
    # 1. Fetch all keys for this protocol
    cursor = 0
    pattern = f"vigil:data:{protocol}:*"
    all_keys = []

    while True:
        cursor, keys = await redis_client.scan(cursor, match=pattern, count=100)
        all_keys.extend(keys)
        if cursor == 0:
            break

    if not all_keys:
        raise HTTPException(status_code=404, detail=f"No data found for protocol {protocol}")

    # 2. Reconstruct dynamic tree
    dynamic_tree: Dict[str, Any] = {"onchain": {}, "offchain": {}}

    for key in all_keys:
        if ":meta" in key:
            continue  # skip meta keys for the main tree

        parts = key.split(":")
        domain = parts[3]
        category = parts[4]

        if domain not in dynamic_tree:
            dynamic_tree[domain] = {}
        if category not in dynamic_tree[domain]:
            dynamic_tree[domain][category] = {}

        hash_data = await redis_client.hgetall(key)
        for metric, val in hash_data.items():
            try:
                # Attempt to parse json (lists/dicts/floats)
                dynamic_tree[domain][category][metric] = json.loads(val)
            except json.JSONDecodeError:
                # Fallback to float or string
                try:
                    dynamic_tree[domain][category][metric] = float(val)
                except ValueError:
                    dynamic_tree[domain][category][metric] = val

    return dynamic_tree, all_keys
