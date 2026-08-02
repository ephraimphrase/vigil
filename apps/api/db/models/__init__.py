# ─────────────────────────────────────────────────────────────
# SQLModel schema - describes the tables apps/web/db/schema/*.ts mirrors
# for typed queries there. apps/api stays the DDL source of truth (see
# init_db below), so any column added/renamed in one of these files must
# be mirrored on the frontend too.
# ─────────────────────────────────────────────────────────────

import logging

from sqlmodel import SQLModel

from .engine import DATABASE_URL, engine
from .health_score import HealthScore
from .health_scores import HealthScoreRow
from .protocols import Protocol
from .signal_cache import SignalCache
from .signal_history import SignalHistory
from .strategies import Strategy
from .triggers import Trigger
from .user_triggers import UserTrigger

__all__ = [
    "DATABASE_URL",
    "engine",
    "HealthScore",
    "HealthScoreRow",
    "Protocol",
    "SignalCache",
    "SignalHistory",
    "Strategy",
    "Trigger",
    "UserTrigger",
    "init_db",
]

logger = logging.getLogger(__name__)


def init_db():
    """Initializes the Postgres schema. Idempotent (CREATE TABLE IF NOT EXISTS)."""
    try:
        SQLModel.metadata.create_all(engine)
        logger.debug("[DB] Schema initialized against shared Postgres instance")
    except Exception as e:
        logger.error("[DB] Failed to initialize schema: %s", e)
        raise


# Initialize on import
init_db()
