from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# User-configured alert conditions (distinct from Trigger, which logs
# actions that already fired). routers/webhook/triggers.py evaluates these
# against a freshly computed score on every /webhook/score/{protocol} call.
# Mirrors apps/web/db/schema/userTriggers.ts field-for-field.
class UserTrigger(SQLModel, table=True):
    __tablename__ = "user_triggers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    wallet_address: str
    protocol: str
    condition: str
    action_slug: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
