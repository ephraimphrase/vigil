from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# Last-known-good value per (protocol, key), written by
# ingestion/resilient_fetch.py so a transient upstream failure can fall
# back to the last successful fetch instead of a hardcoded default.
# Python-only - not mirrored in apps/web's Drizzle schema.
class SignalCache(SQLModel, table=True):
    __tablename__ = "signal_cache"

    protocol: str = Field(primary_key=True)
    key: str = Field(primary_key=True)
    value: Optional[str] = None
    updated_at: datetime
