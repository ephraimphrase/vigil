from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# User-configured alert conditions (distinct from Trigger, which logs
# actions that already fired). Not currently evaluated anywhere - ingest.py
# only fetches signals into Redis, no scoring/trigger dispatch wired up.
# Mirrors apps/web/db/schema/userTriggers.ts field-for-field.
class UserTrigger(SQLModel, table=True):
    __tablename__ = "user_triggers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    wallet_address: str
    protocol: str
    condition: str
    action_slug: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
