from datetime import datetime
from typing import List

from pydantic import BaseModel


# A scoring-pipeline value object, not a table row - it carries fields
# (risk_flags, delta_from_24h_avg) that never get persisted. What IS
# persisted is a HealthScoreRow (health_scores.py), written via
# db.queries.save_health_score.
class HealthScore(BaseModel):
    protocol: str
    timestamp: datetime
    score: float                # 0-100
    reasoning: str
    risk_flags: List[str]
    delta_from_24h_avg: float
