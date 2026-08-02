import json
from fastapi import APIRouter

from integrations.redis_client import redis_client
from .schemas import DynamicSignal

router = APIRouter()


@router.post("/webhook/ingest", tags=["Webhooks"])
async def ingest_dynamic_signal(signal: DynamicSignal):
    """
    Universal ingestion funnel for all external data sources.
    Data is saved into a dynamic Redis tree.
    """
    redis_key = f"vigil:data:{signal.protocol}:{signal.domain}:{signal.category}"

    # Store the value. If it's a complex type, serialize it.
    if isinstance(signal.value, (dict, list)):
        value_str = json.dumps(signal.value)
    else:
        value_str = str(signal.value)

    await redis_client.hset(redis_key, signal.metric_name, value_str)

    # Optionally store metadata
    if signal.metadata:
        await redis_client.hset(f"{redis_key}:meta", signal.metric_name, json.dumps(signal.metadata))

    return {"status": "success", "saved_to": redis_key}
