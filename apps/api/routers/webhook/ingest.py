import json
from fastapi import APIRouter
from sqlmodel import Session, select

from db.models import Protocol, engine
from ingestion.registry import OFFCHAIN_FETCHERS, ONCHAIN_FETCHERS
from ingestion.resilient_fetch import safe_fetch
from integrations.redis_client import redis_client

router = APIRouter()


@router.post("/webhook/ingest", tags=["Webhooks"])
async def ingest_all_signals():
    """
    Runs every registered fetcher (ingestion/registry.py's
    ONCHAIN_FETCHERS + OFFCHAIN_FETCHERS - tvl, liquidations, whales,
    github, sentiment, security, news, social, snapshot) for every
    protocol in the `protocols` table, through the Postgres
    last-known-good cache (safe_fetch). Each result lands in the dynamic
    Redis tree routers/webhook/tree.py's build_dynamic_tree() reads for
    scoring (vigil:data:{protocol}:{channel}:{key}). Meant to be called
    on a schedule (an external cron hitting this endpoint every 15
    minutes matches the cadence scoring/prompt.py's SYSTEM_PROMPT already
    assumes) rather than per-request.
    """
    with Session(engine) as session:
        protocol_ids = session.exec(select(Protocol.id)).all()

    fetchers = {**ONCHAIN_FETCHERS, **OFFCHAIN_FETCHERS}
    results = []

    for protocol_id in protocol_ids:
        for signal_key, fetcher in fetchers.items():
            result = await safe_fetch(fetcher, protocol_id)

            if result["status"] == "ok":
                redis_key = f"vigil:data:{protocol_id}:{result['channel']}:{result['key']}"
                for metric, value in result["payload"].items():
                    value_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
                    await redis_client.hset(redis_key, metric, value_str)

            results.append({
                "protocol": protocol_id,
                "signal":   signal_key,
                "status":   result["status"],
                "error":    result["error"],
            })

    return {
        "status": "success",
        "protocols_processed": len(protocol_ids),
        "signals_processed": len(results),
        "results": results,
    }
