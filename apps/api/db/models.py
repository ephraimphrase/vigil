import sqlite3
import logging
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

logger = logging.getLogger(__name__)

DB_PATH = "db/vigil.sqlite"



class HealthScore(BaseModel):
    protocol: str
    timestamp: datetime
    score: float                # 0-100
    reasoning: str
    risk_flags: List[str]
    delta_from_24h_avg: float


_DB_SCHEMA = """
CREATE TABLE IF NOT EXISTS signal_cache (
    protocol   TEXT,
    key        TEXT,
    value      TEXT,
    updated_at DATETIME,
    PRIMARY KEY (protocol, key)
);

CREATE TABLE IF NOT EXISTS signal_history (
    protocol  TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    key       TEXT NOT NULL,
    value     REAL
);

CREATE TABLE IF NOT EXISTS health_scores (
    protocol  TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    score     REAL,
    reasoning TEXT
);

CREATE TABLE IF NOT EXISTS triggers (
    protocol  TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    action    TEXT,
    reason    TEXT,
    tx_hash   TEXT
);
"""


def get_connection() -> sqlite3.Connection:
    """Returns a configured SQLite connection with WAL mode for concurrency."""
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    return con


def init_db():
    """Initializes the SQLite database schema. Idempotent (CREATE TABLE IF NOT EXISTS)."""
    try:
        con = get_connection()
        con.executescript(_DB_SCHEMA)
        con.commit()
        con.close()
        logger.debug("[DB] Schema initialized at %s", DB_PATH)
    except sqlite3.Error as e:
        logger.error("[DB] Failed to initialize schema: %s", e)
        raise


# Initialize on import
init_db()
