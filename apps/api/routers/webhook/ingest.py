import json
import time

from fastapi import APIRouter, BackgroundTasks, HTTPException
from sqlmodel import Session, select

from config import INGEST_WEBHOOK_SECRET
from db.models import Protocol, engine
from ingestion.registry import OFFCHAIN_FETCHERS, ONCHAIN_FETCHERS, TYPED_FETCHERS
from ingestion.resilient_fetch import safe_fetch
from integrations.redis_client import redis_client
from scoring.scorer import run_scoring_sweep

router = APIRouter()

# Single shared status hash rather than one per run - a run in progress is
# the only state callers need to poll for (see /webhook/ingest/status);
# who ran the previous one doesn't matter once it's done.
STATUS_KEY = "vigil:ingest:status"

# _run_ingest_sweep runs as a BackgroundTasks job inside the same process
# that handled the triggering request - it does NOT survive that
# container being torn down (a redeploy, a restart, an OOM kill). If that
# happens mid-sweep, nothing ever flips "active" back to false, since
# only the sweep's own completion/error handler does that. Past this many
# seconds, a still-"active" flag is treated as abandoned rather than
# trusted forever - a real sweep never legitimately takes this long, so
# this self-heals a stuck lock instead of permanently 409-blocking every
# future trigger.
STALE_AFTER_SECONDS = 20 * 60


async def is_ingest_active() -> bool:
    status = await redis_client.hgetall(STATUS_KEY)
    if status.get("active") != "true":
        return False
    started_at = status.get("started_at")
    if started_at and (time.time() - float(started_at)) > STALE_AFTER_SECONDS:
        return False
    return True


@router.get("/webhook/ingest/status", tags=["Webhooks"])
async def ingest_status():
    """
    Whether a run kicked off by POST /webhook/ingest is currently in
    progress, and when the last run started/finished - the source of
    truth for real completion state, since ingest_all_signals itself now
    returns immediately rather than waiting for the sweep to finish (see
    that endpoint for why).
    """
    status = await redis_client.hgetall(STATUS_KEY)
    if not status:
        return {"active": False, "started_at": None, "completed_at": None}
    return {
        "active":              status.get("active") == "true",
        "started_at":          float(status["started_at"]) if status.get("started_at") else None,
        "completed_at":        float(status["completed_at"]) if status.get("completed_at") else None,
        "protocols_processed": int(status["protocols_processed"]) if status.get("protocols_processed") else None,
        "signals_processed":   int(status["signals_processed"]) if status.get("signals_processed") else None,
        "error":               status.get("error") or None,
    }


async def _run_ingest_sweep() -> None:
    """The actual fetch-everything-then-score work: every registered
    fetcher (ingestion/registry.py's ONCHAIN_FETCHERS + OFFCHAIN_FETCHERS
    + TYPED_FETCHERS - tvl, liquidations, whales, fees, volume, yields,
    github, sentiment, security, news, social, snapshot, market,
    typed_signals) for every protocol in the `protocols` table, through
    the Postgres last-known-good cache (safe_fetch). Each result lands in
    Redis (vigil:data:{protocol}:{channel}:{key}). typed_signals runs
    here too but rarely does real work - its own per-signal TTL cache
    (see ingestion/typed_signals.py) means most sweeps make zero or few
    actual search-LLM calls. Once every protocol has been fetched, runs
    scoring/scorer.py's run_scoring_sweep against that freshly written
    data. Run as a background task by ingest_all_signals rather than
    inline, so the triggering HTTP call doesn't have to stay connected
    for however long this takes (reliably minutes, not seconds).
    """
    try:
        with Session(engine) as session:
            protocol_ids = session.exec(select(Protocol.id)).all()

        fetchers = {**ONCHAIN_FETCHERS, **OFFCHAIN_FETCHERS, **TYPED_FETCHERS}
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

        await redis_client.hset(STATUS_KEY, mapping={
            "active":              "false",
            "completed_at":        str(time.time()),
            "protocols_processed": str(len(protocol_ids)),
            "signals_processed":   str(len(results)),
            "error":               "",
        })
    except Exception as e:
        await redis_client.hset(STATUS_KEY, mapping={
            "active":       "false",
            "completed_at": str(time.time()),
            "error":        str(e),
        })


@router.post("/webhook/ingest", tags=["Webhooks"])
async def ingest_all_signals(background_tasks: BackgroundTasks, secret: str | None = None):
    """
    Kicks off a full ingest+score sweep (see _run_ingest_sweep) in the
    background and returns immediately, rather than blocking until the
    sweep finishes - a full run walks every protocol x every registered
    fetcher sequentially and then scores each one, which reliably takes
    minutes. Blocking the HTTP response on that would risk the calling
    webhook (KeeperHub, on a 15-minute schedule - see
    scoring/prompt.py's SYSTEM_PROMPT, which assumes that cadence) timing
    out well before the sweep is actually done, even though the sweep
    itself completed fine. Poll GET /webhook/ingest/status for real
    completion state instead of trusting this response's latency.

    If INGEST_WEBHOOK_SECRET is set, requires ?secret=<value> to match or
    returns 401 - unset (the local-dev default) leaves this endpoint open,
    same as before this check existed. Set INGEST_WEBHOOK_SECRET in
    production so this isn't a public, unauthenticated, cost-incurring
    trigger.

    Refuses to start a second run while one is already active (see
    is_ingest_active) - an overlapping run would double the load on the
    already-slow per-repo GitHub calls and could interleave its writes
    with the run in progress.
    """
    if INGEST_WEBHOOK_SECRET and secret != INGEST_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing secret")

    if await is_ingest_active():
        raise HTTPException(status_code=409, detail="Ingestion already in progress")

    await redis_client.hset(STATUS_KEY, mapping={"active": "true", "started_at": str(time.time())})
    background_tasks.add_task(_run_ingest_sweep)

    return {"status": "started"}
