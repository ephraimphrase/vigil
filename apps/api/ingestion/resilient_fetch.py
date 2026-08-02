import json
from datetime import datetime

from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session, select

from db.models import SignalCache, engine
from ingestion.base_fetcher import BaseFetcher
from typedefs import Signal


async def safe_fetch(fetcher: BaseFetcher, protocol: str) -> Signal:
    """
    Wraps a BaseFetcher with a fallback to the last known good payload when
    the fetch comes back status="error" - prevents a single transient
    upstream failure from resetting a signal to its empty defaults.
    BaseFetcher.fetch() never raises, so this checks `status` rather than
    catching an exception.
    """
    result = await fetcher.fetch(protocol)

    if result["status"] == "error":
        last_good = _get_last_good(protocol, result["key"])
        if last_good is not None:
            print(f"[WARN] {result['key']} fetch failed for {protocol} ({result['error']}), using last known good")
            return {**result, "status": "ok", "payload": last_good}
        return result

    _store_last_good(protocol, result["key"], result["payload"])
    return result

def _store_last_good(protocol: str, key: str, value):
    # Store complex types as JSON strings
    if isinstance(value, (dict, list)):
        val_str = json.dumps(value)
    else:
        val_str = str(value)

    with Session(engine) as session:
        stmt = insert(SignalCache).values(protocol=protocol, key=key, value=val_str, updated_at=datetime.utcnow())
        stmt = stmt.on_conflict_do_update(
            index_elements=[SignalCache.protocol, SignalCache.key],
            set_={"value": stmt.excluded.value, "updated_at": stmt.excluded.updated_at},
        )
        session.exec(stmt)
        session.commit()

def _get_last_good(protocol: str, key: str):
    with Session(engine) as session:
        row = session.exec(
            select(SignalCache)
            .where(SignalCache.protocol == protocol, SignalCache.key == key)
            .order_by(SignalCache.updated_at.desc())
            .limit(1)
        ).first()

    if row:
        val = row.value
        try:
            # Try to parse back to dict if it was JSON
            return json.loads(val)
        except json.JSONDecodeError:
            try:
                return float(val)
            except ValueError:
                return val
    return None
