import json
from datetime import datetime
from typing import Awaitable, Callable, TypeVar

from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session, select

from db.models import SignalCache, engine

T = TypeVar("T")

async def safe_fetch(fetch_fn: Callable[[str], Awaitable[T]], protocol: str, signal_key: str, fallback: T | None = None) -> T:
    """
    Wraps any fetch function with a fallback to the last known good value.
    This prevents transient API failures from crashing the scoring loop.
    """
    if fallback is None:
        # Default fallback is typically a neutral dict or float
        fallback = 0.5

    try:
        result = await fetch_fn(protocol)
        _store_last_good(protocol, signal_key, result)
        return result
    except Exception as e:
        print(f"[WARN] {signal_key} fetch failed for {protocol}: {e}")
        last_good = _get_last_good(protocol, signal_key)
        return last_good if last_good is not None else fallback

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
