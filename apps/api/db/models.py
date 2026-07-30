import os
import logging
from datetime import datetime

import psycopg2
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://vigil:vigil@localhost:5432/vigil")


class HealthScore(BaseModel):
    protocol: str
    timestamp: datetime
    score: float                # 0-100
    reasoning: str
    risk_flags: List[str]
    delta_from_24h_avg: float


_DB_SCHEMA = """
CREATE TABLE IF NOT EXISTS signal_cache (
    protocol   TEXT NOT NULL,
    key        TEXT NOT NULL,
    value      TEXT,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (protocol, key)
);

CREATE TABLE IF NOT EXISTS signal_history (
    protocol  TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    key       TEXT NOT NULL,
    value     DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS health_scores (
    protocol  TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    score     DOUBLE PRECISION,
    reasoning TEXT
);

CREATE TABLE IF NOT EXISTS triggers (
    protocol  TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    action    TEXT,
    reason    TEXT,
    tx_hash   TEXT
);

-- User-configured alert conditions (distinct from `triggers`, which logs
-- actions that already fired). routers/webhook.py evaluates these against
-- a freshly computed score on every /webhook/score/{protocol} call.
CREATE TABLE IF NOT EXISTS user_triggers (
    id             SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    protocol       TEXT NOT NULL,
    condition      TEXT NOT NULL,
    action_slug    TEXT NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- Protocol detail pages. Real columns for the scalar/queryable fields;
-- JSONB for the parts that are genuinely nested or have per-protocol
-- dynamic shape (signals' keys differ per protocol; risk/contracts/
-- incidents/dependencies are simple lists with no cross-protocol query
-- need yet - normalizing those into 4 more join tables would be
-- over-engineering for data nothing queries across protocols today).
-- scoreHistory is NOT duplicated here - it's served from health_scores,
-- which already exists and is what apps/api actually writes to.
CREATE TABLE IF NOT EXISTS protocols (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    ticker         TEXT,
    icon           TEXT,
    aliases        JSONB NOT NULL DEFAULT '[]',
    category       TEXT NOT NULL,
    chain          TEXT NOT NULL,
    settlement_layer TEXT,
    kind           TEXT NOT NULL,
    description    TEXT NOT NULL,
    launch_date    TEXT NOT NULL,
    links          JSONB NOT NULL DEFAULT '{}',
    market         JSONB,
    assessment     JSONB NOT NULL DEFAULT '{}',
    assessment_history JSONB NOT NULL DEFAULT '[]',
    signals        JSONB NOT NULL DEFAULT '{}',
    risk           JSONB NOT NULL DEFAULT '[]',
    contracts      JSONB NOT NULL DEFAULT '[]',
    incidents      JSONB NOT NULL DEFAULT '[]',
    dependencies   JSONB NOT NULL DEFAULT '[]',
    ask_suggestions JSONB NOT NULL DEFAULT '[]',
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- One row per protocol's vault strategy (see BeefyStrategyAdapter /
-- IVigilProtocolAdapter in apps/contracts). All fields are scalar except
-- `rewards`, a short list of reward token symbols with no query need of
-- its own.
CREATE TABLE IF NOT EXISTS strategies (
    protocol_id        TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL,
    description         TEXT NOT NULL,
    adapter             TEXT NOT NULL,
    strategy_address    TEXT NOT NULL,
    strat_name          TEXT NOT NULL,
    native              TEXT NOT NULL,
    rewards             JSONB NOT NULL DEFAULT '[]',
    harvest_on_deposit   BOOLEAN NOT NULL,
    asset                TEXT NOT NULL,
    want                 TEXT NOT NULL,
    allocated            DOUBLE PRECISION NOT NULL,
    target_weight        DOUBLE PRECISION NOT NULL,
    actual_weight        DOUBLE PRECISION NOT NULL,
    score                DOUBLE PRECISION NOT NULL,
    apy                  DOUBLE PRECISION NOT NULL,
    last_rebalance       TIMESTAMP NOT NULL,
    paused               BOOLEAN NOT NULL,
    retired              BOOLEAN NOT NULL,
    last_harvest         TIMESTAMP NOT NULL,
    harvestable           BOOLEAN NOT NULL,
    max_withdraw          DOUBLE PRECISION NOT NULL,
    max_deposit           DOUBLE PRECISION,
    deposit_fee            DOUBLE PRECISION NOT NULL,
    withdraw_fee            DOUBLE PRECISION NOT NULL
);
"""


def get_connection() -> psycopg2.extensions.connection:
    """Returns a connection to the shared Postgres instance (see /docker-compose.yml).
    Unlike sqlite3, psycopg2 connections have no .execute() shortcut - callers
    must open a cursor: `with con.cursor() as cur: cur.execute(...)`.
    """
    return psycopg2.connect(DATABASE_URL)


def init_db():
    """Initializes the Postgres schema. Idempotent (CREATE TABLE IF NOT EXISTS)."""
    try:
        con = get_connection()
        with con.cursor() as cur:
            cur.execute(_DB_SCHEMA)
        con.commit()
        con.close()
        logger.debug("[DB] Schema initialized against shared Postgres instance")
    except psycopg2.Error as e:
        logger.error("[DB] Failed to initialize schema: %s", e)
        raise


# Initialize on import
init_db()
