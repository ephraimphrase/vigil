from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# Mirrors apps/web/db/schema/triggers.ts field-for-field. Logs actions that
# already fired (see user_triggers.py for the alert conditions that decide
# whether one should). `id` is a surrogate primary key the ORM requires;
# the original raw table had none, and nothing queries by it.
class Trigger(SQLModel, table=True):
    __tablename__ = "triggers"

    id: Optional[int] = Field(default=None, primary_key=True)
    protocol: str
    timestamp: datetime
    action: Optional[str] = None
    reason: Optional[str] = None
    tx_hash: Optional[str] = None
