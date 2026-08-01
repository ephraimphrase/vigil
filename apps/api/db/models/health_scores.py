from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# Mirrors apps/web/db/schema/healthScores.ts field-for-field - that Drizzle
# schema exists purely for typed queries on the frontend and is generated
# to match this definition, so any column added/renamed here must be
# mirrored there too. `id` is a surrogate primary key the ORM requires;
# the original raw table had none, and nothing queries by it.
class HealthScoreRow(SQLModel, table=True):
    __tablename__ = "health_scores"

    id: Optional[int] = Field(default=None, primary_key=True)
    protocol: str
    timestamp: datetime
    score: Optional[float] = None
    reasoning: Optional[str] = None
