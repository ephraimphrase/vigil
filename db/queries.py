import sqlite3
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict
from db.models import get_connection

logger = logging.getLogger(__name__)


def get_24h_average(protocol: str) -> float:
    """Returns the average health score for the past 24 hours. Returns 100.0 if no data yet."""
    cutoff = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    try:
        con = get_connection()
        row = con.execute(
            "SELECT AVG(score) FROM health_scores WHERE protocol = ? AND timestamp >= ?",
            (protocol, cutoff),
        ).fetchone()
        con.close()
        return float(row[0]) if row and row[0] is not None else 100.0
    except sqlite3.Error as e:
        logger.error("[DB] get_24h_average failed: %s", e)
        return 100.0


def get_signal_history(protocol: str, days: int = 90) -> List[Dict]:
    """Returns historical raw signals for normalization moving averages."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    try:
        con = get_connection()
        rows = con.execute(
            "SELECT timestamp, key, value FROM signal_history WHERE protocol = ? AND timestamp >= ? ORDER BY timestamp DESC",
            (protocol, cutoff),
        ).fetchall()
        con.close()
        return [{"timestamp": r[0], "key": r[1], "value": r[2]} for r in rows]
    except sqlite3.Error as e:
        logger.error("[DB] get_signal_history failed: %s", e)
        return []


def save_health_score(protocol: str, score: float, reasoning: str) -> None:
    try:
        con = get_connection()
        con.execute(
            "INSERT INTO health_scores (protocol, timestamp, score, reasoning) VALUES (?, ?, ?, ?)",
            (protocol, datetime.utcnow().isoformat(), score, reasoning),
        )
        con.commit()
        con.close()
    except sqlite3.Error as e:
        logger.error("[DB] save_health_score failed: %s", e)


def save_signal_history(protocol: str, signals: dict) -> None:
    try:
        con = get_connection()
        ts = datetime.utcnow().isoformat()
        rows = [
            (protocol, ts, key, float(val))
            for key, val in signals.items()
            if isinstance(val, (int, float))
        ]
        con.executemany(
            "INSERT INTO signal_history (protocol, timestamp, key, value) VALUES (?, ?, ?, ?)",
            rows,
        )
        con.commit()
        con.close()
    except sqlite3.Error as e:
        logger.error("[DB] save_signal_history failed: %s", e)


def save_trigger(protocol: str, action: str, reason: str, tx_hash: str) -> None:
    try:
        con = get_connection()
        con.execute(
            "INSERT INTO triggers (protocol, timestamp, action, reason, tx_hash) VALUES (?, ?, ?, ?, ?)",
            (protocol, datetime.utcnow().isoformat(), action, reason, tx_hash),
        )
        con.commit()
        con.close()
    except sqlite3.Error as e:
        logger.error("[DB] save_trigger failed: %s", e)


def get_latest_scores() -> List[Dict]:
    """Returns the most recent health score for every protocol."""
    try:
        con = get_connection()
        # Use a subquery to get the latest row per protocol rather than relying on MAX(timestamp)
        # returning potentially mismatched columns across SQLite versions
        rows = con.execute("""
            SELECT h.protocol, h.score, h.reasoning, h.timestamp
            FROM health_scores h
            INNER JOIN (
                SELECT protocol, MAX(timestamp) AS max_ts
                FROM health_scores
                GROUP BY protocol
            ) latest ON h.protocol = latest.protocol AND h.timestamp = latest.max_ts
        """).fetchall()
        con.close()
        return [{"protocol": r[0], "score": r[1], "reasoning": r[2], "timestamp": r[3]} for r in rows]
    except sqlite3.Error as e:
        logger.error("[DB] get_latest_scores failed: %s", e)
        return []


def get_score_history(protocol: str, limit: int = 24) -> List[Dict]:
    try:
        con = get_connection()
        rows = con.execute(
            "SELECT timestamp, score FROM health_scores WHERE protocol = ? ORDER BY timestamp DESC LIMIT ?",
            (protocol, limit),
        ).fetchall()
        con.close()
        # Return in ascending chronological order for charting
        return [{"timestamp": r[0], "score": r[1]} for r in reversed(rows)]
    except sqlite3.Error as e:
        logger.error("[DB] get_score_history failed: %s", e)
        return []


def get_recent_triggers(limit: int = 10) -> List[Dict]:
    try:
        con = get_connection()
        rows = con.execute(
            "SELECT protocol, timestamp, action, reason, tx_hash FROM triggers ORDER BY timestamp DESC LIMIT ?",
            (limit,),
        ).fetchall()
        con.close()
        return [
            {"protocol": r[0], "timestamp": r[1], "action": r[2], "reason": r[3], "tx_hash": r[4]}
            for r in rows
        ]
    except sqlite3.Error as e:
        logger.error("[DB] get_recent_triggers failed: %s", e)
        return []
