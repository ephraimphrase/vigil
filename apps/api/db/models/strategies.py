from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


# One row per deployed strategy contract (see BeefyStrategyAdapter /
# IVigilProtocolAdapter in apps/contracts). A protocol can have more than
# one strategy variant (e.g. Curve has 9 separate Convex/StakeDAO/Fx
# strategy contracts), so `id` - not protocol_id - is the primary key;
# protocol_id is a plain indexed column. All fields are scalar except
# `rewards`, a short list of reward token symbols with no query need of
# its own. No `score` column - a strategy's score IS its protocol's score
# (health_scores, keyed by protocol_id), never a second copy that can
# drift from it. /api/strategies joins health_scores at read time instead.
#
# Only ever written by apps/web's seed script (drizzle), same as Protocol.
# Mirrors apps/web/db/schema/strategies.ts field-for-field.
class Strategy(SQLModel, table=True):
    __tablename__ = "strategies"

    id: str = Field(primary_key=True)
    protocol_id: str = Field(index=True)
    name: str
    category: str
    description: str
    adapter: str
    strategy_address: str
    strat_name: str
    native: str
    rewards: List[str] = Field(default=[], sa_column=Column(JSONB, nullable=False))
    harvest_on_deposit: bool
    asset: str
    want: str
    allocated: float
    target_weight: float
    actual_weight: float
    apy: float
    last_rebalance: datetime
    paused: bool
    retired: bool
    last_harvest: datetime
    harvestable: bool
    max_withdraw: float
    max_deposit: Optional[float] = None
    deposit_fee: float
    withdraw_fee: float
