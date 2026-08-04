import json
from datetime import datetime, timezone

from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import search_llm
from sqlmodel import Session, select

_SYSTEM_PROMPT = """
You answer a batch of factual questions about multiple DeFi protocols
using current web search results. Return ONLY valid JSON, no markdown
formatting or other text, in this exact shape:
{
  "<protocol_id>": {
    "<signal_key>": {
      "raw": "<1-2 sentence factual answer, with numbers/dates where available>",
      "normalized": <float 0.0-1.0, where 1.0 = no concern / healthy and 0.0 = severe / critical>,
      "confidence": "<high|medium|low, based on how consistent/recent your sources are>"
    }
  }
}
Answer every protocol_id and signal_key given, even briefly if sources
are thin - never omit a key.
"""

# Per-signal TTL, not one blanket rate - a signal describing fixed
# architecture (a contract that's immutable, whether V4 hooks are used at
# all) doesn't need re-asking on the same schedule as one that can
# genuinely shift week to week (bad debt, oracle health). Once a STATIC
# signal is cached, it stops appearing in future batch questions at all
# until its TTL actually lapses - shrinks cost over time, not just at the
# first fetch. Keys not listed here default to DEFAULT_TTL_HOURS.
STATIC_TTL_HOURS = 24 * 90    # quarterly - architecture/design facts, rarely change post-launch
DEFAULT_TTL_HOURS = 24 * 7    # weekly - everything else (concentration %, market share, bad debt, etc.)

_STATIC_SIGNAL_KEYS = {
    "immutability",        # morpho - core contract upgradability, permanent by design
    "hookSurface",          # bunni - V4 hook usage, an architecture choice
    "hookRisk",             # uniswap - same
    "poolComplexity",       # balancer - pool-type surface, architectural
    "marketIsolation",      # gmx, silo - isolated-market design, architectural
    "dualGovernance",       # lido - governance mechanism design
    "permissionlessListing", # silo - protocol's permission model
    "postIncidentAudit",    # bunni - a historical fact once true, doesn't change
    "poolUnification",      # stargate - architecture status
    "rangeManagerRisk",     # kodiak - architecture
    "strategyComplexity",   # tokemak - design pattern, not a live number
}


def _ttl_hours_for(signal_key: str) -> int:
    return STATIC_TTL_HOURS if signal_key in _STATIC_SIGNAL_KEYS else DEFAULT_TTL_HOURS


# {(protocol_id, signal_key): {"data": {...}, "fetched_at": datetime}} -
# per-(protocol, signal) cache, not one shared blob, so a fresh DYNAMIC
# signal for one protocol doesn't force-refresh an already-fresh STATIC
# signal for another.
_cache: dict[tuple[str, str], dict] = {}


def _get_catalog_from_db() -> dict[str, tuple[str, dict[str, str]]]:
    """Returns {protocol_id: (name, {signal_key: label})} for every
    protocol with a non-empty Protocol.typed_signal_catalog - the "what
    to ask, and about which signals we have no real API for" config lives
    on the protocol row itself (see db/models/protocols.py), not
    hardcoded here, same as whale_token_address/coingecko_id/
    snapshot_space already work."""
    with Session(engine) as session:
        rows = session.exec(select(Protocol.id, Protocol.name, Protocol.typed_signal_catalog)).all()
    return {
        row.id: (row.name, row.typed_signal_catalog)
        for row in rows
        if row.typed_signal_catalog
    }


def _build_batch_question(due: dict[str, tuple[str, dict[str, str]]]) -> str:
    lines = []
    for protocol_id, (name, entries) in due.items():
        questions = "; ".join(f'{key}: "{label}"' for key, label in entries.items())
        lines.append(f'- {protocol_id} ({name}): {questions}')
    return (
        "For each DeFi protocol and signal below, answer as of today. "
        "Protocol id, then signal_key: label pairs to answer for that protocol:\n"
        + "\n".join(lines)
    )


async def _get_all_typed_signals() -> dict[str, dict]:
    """Refreshes only the (protocol, signal) pairs whose own TTL has
    actually lapsed (see _ttl_hours_for), in one batched search-grounded
    call covering just that due subset - not a fixed weekly sweep of
    everything. If nothing is due, no call is made at all. Cached at
    module level, per (protocol_id, signal_key); every protocol's
    _fetch_payload reads its own slice out of this rather than
    triggering its own call."""
    now = datetime.now(timezone.utc)
    catalog = _get_catalog_from_db()
    if not catalog:
        return {}

    due: dict[str, tuple[str, dict[str, str]]] = {}
    for protocol_id, (name, entries) in catalog.items():
        due_entries = {}
        for key, label in entries.items():
            cached = _cache.get((protocol_id, key))
            if cached and (now - cached["fetched_at"]).total_seconds() < _ttl_hours_for(key) * 3600:
                continue  # still fresh - not due
            due_entries[key] = label
        if due_entries:
            due[protocol_id] = (name, due_entries)

    if due:
        from integrations.llm import llm_client
        if llm_client:
            response = await llm_client.chat.completions.create(
                model=search_llm.SEARCH_MODEL,
                max_tokens=8000,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": _build_batch_question(due)},
                ],
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = {}  # leave stale/missing entries as-is rather than fail the whole refresh

            for protocol_id, (_, due_entries) in due.items():
                proto_answers = parsed.get(protocol_id, {})
                if not isinstance(proto_answers, dict):
                    continue
                for key, label in due_entries.items():
                    answer = proto_answers.get(key)
                    if not isinstance(answer, dict):
                        continue
                    _cache[(protocol_id, key)] = {
                        "data": {
                            "label":      label,
                            "raw":        answer.get("raw", ""),
                            "normalized": max(0.0, min(1.0, float(answer.get("normalized", 0.5)))),
                            "confidence": answer.get("confidence", "low"),
                        },
                        "fetched_at": now,
                    }

    result: dict[str, dict] = {}
    for protocol_id, (_, entries) in catalog.items():
        signals = {}
        for key in entries:
            cached = _cache.get((protocol_id, key))
            if cached:
                signals[key] = cached["data"]
        if signals:
            result[protocol_id] = signals
    return result


class TypedSignalsFetcher(BaseFetcher):
    """
    Ingestion only - every "typed" signal for a protocol that has no real
    API source (Protocol.typed_signal_catalog - see db/models/protocols.py
    for what's deliberately excluded from that catalog and why), answered
    via search-grounded LLM calls (see _get_all_typed_signals) batched
    across whichever protocols/signals are actually due for refresh per
    their own TTL - the only fetcher in this codebase that doesn't
    process protocols independently of each other, because the
    underlying cost (a real paid web-search fee per call, not a
    free-tier API) makes batching worth breaking that pattern for.
    """

    key = "typed_signals"
    channel = "typed"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        all_signals = await _get_all_typed_signals()
        signals = all_signals.get(protocol_id)
        if not signals:
            return {}
        # Flattened rather than nested under one "typed_signals" key - every
        # other fetcher's payload keys become their own Redis hash field
        # (see routers/webhook/ingest.py's ingest_all_signals), so each
        # individual typed signal (badDebt, vaultCount, ...) gets the same
        # treatment instead of being buried inside one JSON blob field.
        return {**signals, "source": "perplexity-search"}
