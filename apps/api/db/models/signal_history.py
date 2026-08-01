from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# Raw signal time series used for normalization moving averages. No
# natural key (a protocol/key pair recurs once per fetch) - `id` is a
# surrogate primary key SQLAlchemy's ORM requires, not part of any
# existing query. Python-only - not mirrored in apps/web's Drizzle schema.
class SignalHistory(SQLModel, table=True):
    __tablename__ = "signal_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    protocol: str
    timestamp: datetime
    key: str
    value: Optional[float] = None
