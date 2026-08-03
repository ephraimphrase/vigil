"""
The one scheduled trigger for ingestion + scoring - nothing in the app
previously called /webhook/ingest on its own (see git history on
routers/webhook/ingest.py; test_tvl_ingest.py used to call that "missing
glue"). Runs ingest_all_signals in-process on a fixed interval instead of
relying on external cron/webhook calls, so `docker compose up` + `uvicorn
main:app` is enough to keep data flowing with nothing else to configure.
Scoring isn't called separately here - ingest_all_signals runs
scoring/scorer.py's run_scoring_sweep itself once ingestion finishes, so
this loop and a manual POST /webhook/ingest behave identically.
"""

import asyncio
import logging

from routers.webhook.ingest import ingest_all_signals

logger = logging.getLogger(__name__)

# Matches the cadence scoring/prompt.py's SYSTEM_PROMPT already assumes
# ("data collected in the last 15 minutes").
INGEST_INTERVAL_SECONDS = 15 * 60


async def run_ingest_loop() -> None:
    """Forever loop: run the ingest+score sweep, wait, repeat. A failed
    run is logged and retried next interval rather than killing the loop
    - see ingest_all_signals's own per-fetcher error handling (safe_fetch)
    for how partial failures within a single run are already handled."""
    while True:
        try:
            await ingest_all_signals()
        except Exception:
            logger.exception("Scheduled ingest run failed")

        await asyncio.sleep(INGEST_INTERVAL_SECONDS)
