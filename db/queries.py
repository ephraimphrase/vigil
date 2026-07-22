import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict
from db.models import DB_PATH

def get_24h_average(protocol: str) -> float:
    """Returns the average health score for the past 24 hours."""
    con = sqlite3.connect(DB_PATH)
    cutoff = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    
    row = con.execute(
        "SELECT AVG(score) FROM health_scores WHERE protocol = ? AND timestamp >= ?",
        (protocol, cutoff)
    ).fetchone()
    
    con.close()
    return float(row[0]) if row and row[0] is not None else 100.0

def get_signal_history(protocol: str, days: int = 90) -> List[Dict]:
    """Returns historical raw signals for normalization moving averages."""
    con = sqlite3.connect(DB_PATH)
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    
    rows = con.execute(
        "SELECT timestamp, key, value FROM signal_history WHERE protocol = ? AND timestamp >= ?",
        (protocol, cutoff)
    ).fetchall()
    
    con.close()
    
    history = []
    # Group by timestamp (roughly) to reconstruct dictionaries
    # For simplicity in this hackathon, we'll return flat records
    for row in rows:
        history.append({
            "timestamp": row[0],
            "key": row[1],
            "value": row[2]
        })
    return history

def save_health_score(protocol: str, score: float, reasoning: str):
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "INSERT INTO health_scores (protocol, timestamp, score, reasoning) VALUES (?, ?, ?, ?)",
        (protocol, datetime.utcnow().isoformat(), score, reasoning)
    )
    con.commit()
    con.close()

def save_signal_history(protocol: str, signals: dict):
    con = sqlite3.connect(DB_PATH)
    ts = datetime.utcnow().isoformat()
    for key, val in signals.items():
        if isinstance(val, (int, float)):
            con.execute(
                "INSERT INTO signal_history (protocol, timestamp, key, value) VALUES (?, ?, ?, ?)",
                (protocol, ts, key, float(val))
            )
    con.commit()
    con.close()

def save_trigger(protocol: str, action: str, reason: str, tx_hash: str):
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "INSERT INTO triggers (protocol, timestamp, action, reason, tx_hash) VALUES (?, ?, ?, ?, ?)",
        (protocol, datetime.utcnow().isoformat(), action, reason, tx_hash)
    )
    con.commit()
    con.close()

def get_latest_scores() -> List[Dict]:
    """Returns the most recent health score for every protocol."""
    con = sqlite3.connect(DB_PATH)
    rows = con.execute('''
        SELECT protocol, score, reasoning, MAX(timestamp) 
        FROM health_scores 
        GROUP BY protocol
    ''').fetchall()
    con.close()
    return [{"protocol": r[0], "score": r[1], "reasoning": r[2], "timestamp": r[3]} for r in rows]

def get_score_history(protocol: str, limit: int = 24) -> List[Dict]:
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        "SELECT timestamp, score FROM health_scores WHERE protocol = ? ORDER BY timestamp DESC LIMIT ?",
        (protocol, limit)
    ).fetchall()
    con.close()
    return [{"timestamp": r[0], "score": r[1]} for r in reversed(rows)]

def get_recent_triggers(limit: int = 10) -> List[Dict]:
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        "SELECT protocol, timestamp, action, reason, tx_hash FROM triggers ORDER BY timestamp DESC LIMIT ?",
        (limit,)
    ).fetchall()
    con.close()
    return [{
        "protocol": r[0], 
        "timestamp": r[1], 
        "action": r[2], 
        "reason": r[3],
        "tx_hash": r[4]
    } for r in rows]
