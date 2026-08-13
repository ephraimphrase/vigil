import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import func
from sqlmodel import Session, select

from db.models import HealthScoreRow, Protocol, SignalHistory, Trigger, UserTrigger, engine

logger = logging.getLogger(__name__)


def get_user_triggers(protocol: str) -> List[Dict]:
    """Returns user-configured alert conditions for a protocol - each dict has
    condition/action_slug/wallet_address. Not currently evaluated anywhere;
    ingest.py only fetches signals into Redis, no scoring/trigger dispatch."""
    try:
        with Session(engine) as session:
            rows = session.exec(
                select(UserTrigger).where(UserTrigger.protocol == protocol)
            ).all()
        return [
            {"wallet_address": r.wallet_address, "condition": r.condition, "action_slug": r.action_slug}
            for r in rows
        ]
    except Exception as e:
        logger.error("[DB] get_user_triggers failed: %s", e)
        return []


def get_24h_average(protocol: str) -> float:
    """Returns the average health score for the past 24 hours. Returns 100.0 if no data yet."""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    try:
        with Session(engine) as session:
            avg = session.exec(
                select(func.avg(HealthScoreRow.score)).where(
                    HealthScoreRow.protocol == protocol, HealthScoreRow.timestamp >= cutoff
                )
            ).one()
        return float(avg) if avg is not None else 100.0
    except Exception as e:
        logger.error("[DB] get_24h_average failed: %s", e)
        return 100.0


def get_signal_history(protocol: str, days: int = 90) -> List[Dict]:
    """Returns historical raw signals for normalization moving averages."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    try:
        with Session(engine) as session:
            rows = session.exec(
                select(SignalHistory)
                .where(SignalHistory.protocol == protocol, SignalHistory.timestamp >= cutoff)
                .order_by(SignalHistory.timestamp.desc())
            ).all()
        return [{"timestamp": r.timestamp, "key": r.key, "value": r.value} for r in rows]
    except Exception as e:
        logger.error("[DB] get_signal_history failed: %s", e)
        return []


def save_health_score(protocol: str, score: float, reasoning: str) -> None:
    try:
        with Session(engine) as session:
            session.add(HealthScoreRow(protocol=protocol, timestamp=datetime.utcnow(), score=score, reasoning=reasoning))
            session.commit()
    except Exception as e:
        logger.error("[DB] save_health_score failed: %s", e)


def save_signal_history(protocol: str, signals: dict) -> None:
    try:
        ts = datetime.utcnow()
        rows = [
            SignalHistory(protocol=protocol, timestamp=ts, key=key, value=float(val))
            for key, val in signals.items()
            if isinstance(val, (int, float))
        ]
        with Session(engine) as session:
            session.add_all(rows)
            session.commit()
    except Exception as e:
        logger.error("[DB] save_signal_history failed: %s", e)


def get_previous_signal_value(protocol: str, key: str) -> Optional[float]:
    """Most recent stored value for (protocol, key) from before this
    sweep's write - used by scoring/signals.py to compute trend direction
    (up/down/flat) by comparing against what this sweep just computed."""
    try:
        with Session(engine) as session:
            row = session.exec(
                select(SignalHistory)
                .where(SignalHistory.protocol == protocol, SignalHistory.key == key)
                .order_by(SignalHistory.timestamp.desc())
                .limit(1)
            ).first()
        return row.value if row else None
    except Exception as e:
        logger.error("[DB] get_previous_signal_value failed: %s", e)
        return None


def save_signals(protocol: str, onchain: dict, offchain: dict) -> None:
    """Merges freshly-scored onchain/offchain signal groups into
    protocols.signals - only those two keys are touched, "typed" is left
    as whatever's already there (seed data, or ingestion/typed_signals.py's
    output once that's registered) since a scoring sweep doesn't produce it."""
    try:
        with Session(engine) as session:
            row = session.get(Protocol, protocol)
            if not row:
                return
            merged = dict(row.signals or {})
            merged["onchain"] = onchain
            merged["offchain"] = offchain
            row.signals = merged
            session.add(row)
            session.commit()
    except Exception as e:
        logger.error("[DB] save_signals failed: %s", e)


def save_market_data(protocol: str, market: dict) -> None:
    """Overwrites protocols.market with this sweep's freshly-fetched
    CoinGecko snapshot (already mapped to apps/web's Market shape by
    scoring/scorer.py's _map_market_data) - a full replace rather than a
    merge like save_signals, since it's always a complete point-in-time
    snapshot, not partial data to layer onto what's there."""
    try:
        with Session(engine) as session:
            row = session.get(Protocol, protocol)
            if not row:
                return
            row.market = market
            session.add(row)
            session.commit()
    except Exception as e:
        logger.error("[DB] save_market_data failed: %s", e)


def save_typed_signals(protocol: str, typed: dict) -> None:
    """Merges freshly-scored typed signals into protocols.signals["typed"] -
    only that key is touched, "onchain"/"offchain" are left as whatever
    save_signals last wrote for them."""
    try:
        with Session(engine) as session:
            row = session.get(Protocol, protocol)
            if not row:
                return
            merged = dict(row.signals or {})
            merged["typed"] = typed
            row.signals = merged
            session.add(row)
            session.commit()
    except Exception as e:
        logger.error("[DB] save_typed_signals failed: %s", e)


def save_trigger(protocol: str, action: str, reason: str, tx_hash: str) -> None:
    try:
        with Session(engine) as session:
            session.add(Trigger(protocol=protocol, timestamp=datetime.utcnow(), action=action, reason=reason, tx_hash=tx_hash))
            session.commit()
    except Exception as e:
        logger.error("[DB] save_trigger failed: %s", e)


def get_latest_scores() -> List[Dict]:
    """Returns the most recent health score for every protocol."""
    try:
        with Session(engine) as session:
            rows = session.exec(
                select(HealthScoreRow)
                .distinct(HealthScoreRow.protocol)
                .order_by(HealthScoreRow.protocol, HealthScoreRow.timestamp.desc())
            ).all()
        return [{"protocol": r.protocol, "score": r.score, "reasoning": r.reasoning, "timestamp": r.timestamp} for r in rows]
    except Exception as e:
        logger.error("[DB] get_latest_scores failed: %s", e)
        return []


def get_score_history(protocol: str, limit: int = 24) -> List[Dict]:
    try:
        with Session(engine) as session:
            rows = session.exec(
                select(HealthScoreRow)
                .where(HealthScoreRow.protocol == protocol)
                .order_by(HealthScoreRow.timestamp.desc())
                .limit(limit)
            ).all()
        # Return in ascending chronological order for charting
        return [{"timestamp": r.timestamp, "score": r.score} for r in reversed(rows)]
    except Exception as e:
        logger.error("[DB] get_score_history failed: %s", e)
        return []


def get_recent_triggers(limit: int = 10) -> List[Dict]:
    try:
        with Session(engine) as session:
            rows = session.exec(
                select(Trigger).order_by(Trigger.timestamp.desc()).limit(limit)
            ).all()
        return [
            {"protocol": r.protocol, "timestamp": r.timestamp, "action": r.action, "reason": r.reason, "tx_hash": r.tx_hash}
            for r in rows
        ]
    except Exception as e:
        logger.error("[DB] get_recent_triggers failed: %s", e)
        return []
