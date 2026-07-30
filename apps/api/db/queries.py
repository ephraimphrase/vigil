import psycopg2
import logging
from datetime import datetime, timedelta
from typing import List, Dict
from db.models import get_connection

logger = logging.getLogger(__name__)


def get_user_triggers(protocol: str) -> List[Dict]:
    """Returns user-configured alert conditions for a protocol - each dict has
    condition/action_slug/wallet_address, matching what routers/webhook.py evaluates."""
    try:
        con = get_connection()
        with con.cursor() as cur:
            cur.execute(
                "SELECT wallet_address, condition, action_slug FROM user_triggers WHERE protocol = %s",
                (protocol,),
            )
            rows = cur.fetchall()
        con.close()
        return [{"wallet_address": r[0], "condition": r[1], "action_slug": r[2]} for r in rows]
    except psycopg2.Error as e:
        logger.error("[DB] get_user_triggers failed: %s", e)
        return []


def get_24h_average(protocol: str) -> float:
    """Returns the average health score for the past 24 hours. Returns 100.0 if no data yet."""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    try:
        con = get_connection()
        with con.cursor() as cur:
            cur.execute(
                "SELECT AVG(score) FROM health_scores WHERE protocol = %s AND timestamp >= %s",
                (protocol, cutoff),
            )
            row = cur.fetchone()
        con.close()
        return float(row[0]) if row and row[0] is not None else 100.0
    except psycopg2.Error as e:
        logger.error("[DB] get_24h_average failed: %s", e)
        return 100.0


def get_signal_history(protocol: str, days: int = 90) -> List[Dict]:
    """Returns historical raw signals for normalization moving averages."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    try:
        con = get_connection()
        with con.cursor() as cur:
            cur.execute(
                "SELECT timestamp, key, value FROM signal_history WHERE protocol = %s AND timestamp >= %s ORDER BY timestamp DESC",
                (protocol, cutoff),
            )
            rows = cur.fetchall()
        con.close()
        return [{"timestamp": r[0], "key": r[1], "value": r[2]} for r in rows]
    except psycopg2.Error as e:
        logger.error("[DB] get_signal_history failed: %s", e)
        return []


def save_health_score(protocol: str, score: float, reasoning: str) -> None:
    try:
        con = get_connection()
        with con.cursor() as cur:
            cur.execute(
                "INSERT INTO health_scores (protocol, timestamp, score, reasoning) VALUES (%s, %s, %s, %s)",
                (protocol, datetime.utcnow(), score, reasoning),
            )
        con.commit()
        con.close()
    except psycopg2.Error as e:
        logger.error("[DB] save_health_score failed: %s", e)


def save_signal_history(protocol: str, signals: dict) -> None:
    try:
        con = get_connection()
        ts = datetime.utcnow()
        rows = [
            (protocol, ts, key, float(val))
            for key, val in signals.items()
            if isinstance(val, (int, float))
        ]
        with con.cursor() as cur:
            cur.executemany(
                "INSERT INTO signal_history (protocol, timestamp, key, value) VALUES (%s, %s, %s, %s)",
                rows,
            )
        con.commit()
        con.close()
    except psycopg2.Error as e:
        logger.error("[DB] save_signal_history failed: %s", e)


def save_trigger(protocol: str, action: str, reason: str, tx_hash: str) -> None:
    try:
        con = get_connection()
        with con.cursor() as cur:
            cur.execute(
                "INSERT INTO triggers (protocol, timestamp, action, reason, tx_hash) VALUES (%s, %s, %s, %s, %s)",
                (protocol, datetime.utcnow(), action, reason, tx_hash),
            )
        con.commit()
        con.close()
    except psycopg2.Error as e:
        logger.error("[DB] save_trigger failed: %s", e)


def get_latest_scores() -> List[Dict]:
    """Returns the most recent health score for every protocol."""
    try:
        con = get_connection()
        with con.cursor() as cur:
            # Use a subquery to get the latest row per protocol rather than relying on MAX(timestamp)
            # returning potentially mismatched columns
            cur.execute("""
                SELECT h.protocol, h.score, h.reasoning, h.timestamp
                FROM health_scores h
                INNER JOIN (
                    SELECT protocol, MAX(timestamp) AS max_ts
                    FROM health_scores
                    GROUP BY protocol
                ) latest ON h.protocol = latest.protocol AND h.timestamp = latest.max_ts
            """)
            rows = cur.fetchall()
        con.close()
        return [{"protocol": r[0], "score": r[1], "reasoning": r[2], "timestamp": r[3]} for r in rows]
    except psycopg2.Error as e:
        logger.error("[DB] get_latest_scores failed: %s", e)
        return []


def get_score_history(protocol: str, limit: int = 24) -> List[Dict]:
    try:
        con = get_connection()
        with con.cursor() as cur:
            cur.execute(
                "SELECT timestamp, score FROM health_scores WHERE protocol = %s ORDER BY timestamp DESC LIMIT %s",
                (protocol, limit),
            )
            rows = cur.fetchall()
        con.close()
        # Return in ascending chronological order for charting
        return [{"timestamp": r[0], "score": r[1]} for r in reversed(rows)]
    except psycopg2.Error as e:
        logger.error("[DB] get_score_history failed: %s", e)
        return []


def get_recent_triggers(limit: int = 10) -> List[Dict]:
    try:
        con = get_connection()
        with con.cursor() as cur:
            cur.execute(
                "SELECT protocol, timestamp, action, reason, tx_hash FROM triggers ORDER BY timestamp DESC LIMIT %s",
                (limit,),
            )
            rows = cur.fetchall()
        con.close()
        return [
            {"protocol": r[0], "timestamp": r[1], "action": r[2], "reason": r[3], "tx_hash": r[4]}
            for r in rows
        ]
    except psycopg2.Error as e:
        logger.error("[DB] get_recent_triggers failed: %s", e)
        return []
