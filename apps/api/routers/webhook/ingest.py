import json
import time

from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select

from db.models import Protocol, engine
from ingestion.registry import OFFCHAIN_FETCHERS, ONCHAIN_FETCHERS
from ingestion.resilient_fetch import safe_fetch
from integrations.redis_client import redis_client
from scoring.scorer import run_scoring_sweep

router = APIRouter()

# Single shared status hash rather than one per run - a run in progress is
# the only state callers need to poll for (see /webhook/ingest/status);
# who ran the previous one doesn't matter once it's done.
STATUS_KEY = "vigil:ingest:status"


async def is_ingest_active() -> bool:
    return await redis_client.hget(STATUS_KEY, "active") == "true"


@router.get("/webhook/ingest/status", tags=["Webhooks"])
async def ingest_status():
    """
    Whether a run kicked off by POST /webhook/ingest is currently in
    progress, and when the last run started/finished - useful since a
    full run walks every protocol x every fetcher sequentially and can
    take a while (see ingest_all_signals below).
    """
    status = await redis_client.hgetall(STATUS_KEY)
    if not status:
        return {"active": False, "started_at": None, "completed_at": None}
    return {
        "active":       status.get("active") == "true",
        "started_at":   float(status["started_at"]) if status.get("started_at") else None,
        "completed_at": float(status["completed_at"]) if status.get("completed_at") else None,
    }


@router.post("/webhook/ingest", tags=["Webhooks"])
async def ingest_all_signals():
    """
    Runs every registered fetcher (ingestion/registry.py's
    ONCHAIN_FETCHERS + OFFCHAIN_FETCHERS - tvl, liquidations, whales,
    github, sentiment, security, news, social, snapshot) for every
    protocol in the `protocols` table, through the Postgres
    last-known-good cache (safe_fetch). Each result lands in Redis
    (vigil:data:{protocol}:{channel}:{key}). Once every protocol has been
    fetched, runs scoring/scorer.py's run_scoring_sweep against that
    freshly written data - done here rather than left to the caller so a
    manual/on-demand call gets the same ingest+score behavior every time.
    Nothing calls this on a schedule in-process right now (main.py has no
    lifespan hook for it) - an external cron hitting this endpoint every
    15 minutes would match the cadence scoring/prompt.py's SYSTEM_PROMPT
    assumes, but that's not currently set up. Refuses to start a second
    run while one is already active (see is_ingest_active) - an
    overlapping run would double the load on the already-slow per-repo
    GitHub calls and could interleave its writes with the run in
    progress.
    """
    if await is_ingest_active():
        raise HTTPException(status_code=409, detail="Ingestion already in progress")

    await redis_client.hset(STATUS_KEY, mapping={"active": "true", "started_at": str(time.time())})

    try:
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

        await run_scoring_sweep()

        return {
            "status": "success",
            "protocols_processed": len(protocol_ids),
            "signals_processed": len(results),
            "results": results,
        }
    finally:
        await redis_client.hset(STATUS_KEY, mapping={"active": "false", "completed_at": str(time.time())})
