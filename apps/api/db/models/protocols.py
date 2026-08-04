from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


# Protocol detail pages. Real columns for the scalar/queryable fields;
# JSONB for the parts that are genuinely nested or have per-protocol
# dynamic shape (signals' keys differ per protocol; risk/contracts/
# incidents/dependencies are simple lists with no cross-protocol query
# need yet - normalizing those into 4 more join tables would be
# over-engineering for data nothing queries across protocols today).
# scoreHistory is NOT duplicated here - it's served from health_scores,
# which already exists and is what apps/api actually writes to.
#
# Only ever written by apps/web's seed script (drizzle) - apps/api just
# owns this table's DDL as part of the schema it's the source of truth
# for. Mirrors apps/web/db/schema/protocols.ts field-for-field.
class Protocol(SQLModel, table=True):
    __tablename__ = "protocols"

    id: str = Field(primary_key=True)
    name: str
    ticker: Optional[str] = None
    icon: Optional[str] = None
    aliases: List[str] = Field(default=[], sa_column=Column(JSONB, nullable=False))
    category: str
    chain: str
    settlement_layer: Optional[str] = None
    kind: str
    description: str
    launch_date: str
    # "org/repo" slug for the contract repo ingestion/github.py polls for
    # commit/release signals (e.g. "aave/aave-v3-core") - distinct from
    # links["github"], which is just the org's github.com page for display.
    # None for protocols with no repo tracked yet; GithubFetcher falls
    # back to an empty payload in that case.
    github_repo: Optional[str] = None
    # CoinGecko coin id ingestion/market.py polls (e.g. "compound-governance-token",
    # not "compound" - CoinGecko's own slug often differs from the protocol id,
    # sometimes because of an unrelated coin claiming the plain name first).
    # None falls back to using the protocol id itself, since that already
    # matches CoinGecko for some protocols.
    coingecko_id: Optional[str] = None
    # DeFiLlama slug(s) ingestion/tvl.py polls (e.g. ["compound-finance"],
    # not "compound" - some protocols' DeFiLlama slug differs from their
    # own id). Some protocols are split across multiple DeFiLlama entries
    # for the same protocol (e.g. Velodrome's v2/v3 aren't rolled up under
    # one slug there) - listing more than one sums their TVL together.
    # None falls back to using the protocol id itself as the sole slug,
    # since that already matches DeFiLlama for most protocols.
    defillama_slug: Optional[List[str]] = Field(default=None, sa_column=Column(JSONB))
    # True for protocols whose /protocol/{slug} response is large enough
    # (>500KB) to time out - those use the fast /tvl/{slug} endpoint
    # instead and skip 24h/7d delta calculation.
    defillama_use_fast_endpoint: bool = False
    # ERC20 token contract ingestion/whales.py (and liquidations.py) query
    # via Alchemy's Transfers/Logs APIs. None for protocols with no token
    # tracked yet; both fetchers fall back to an empty payload in that case.
    whale_token_address: Optional[str] = None
    # LunarCrush ticker symbol ingestion/social.py polls (e.g. "AAVE").
    # None falls back to an empty payload.
    lunarcrush_symbol: Optional[str] = None
    # Subreddits ingestion/sentiment.py searches for mentions (e.g.
    # ["Aave", "defi"]). None falls back to searching just ["defi"].
    sentiment_subreddits: Optional[List[str]] = Field(default=None, sa_column=Column(JSONB))
    # Snapshot.org governance space ENS name(s) ingestion/dao.py polls
    # (e.g. ["aavedao.eth"]) - more than one queries all of them together
    # in a single providers/dao.py call (space_in), for protocols governed
    # across multiple spaces. None/empty falls back to an empty payload.
    snapshot_space: Optional[List[str]] = Field(default=None, sa_column=Column(JSONB))
    # {signal_key: label} for "typed" (category-specific) signals with no
    # real API source - ingestion/typed_signals.py answers these via a
    # search-grounded LLM question built from the label (e.g.
    # {"badDebt": "Bad debt"}). None/empty means this protocol has none
    # tracked. See ingestion/typed_signals.py for which signals were
    # deliberately excluded here because a real API covers them instead
    # (peg deviation, market maturity, volume/fees, exploit history,
    # collateral concentration).
    typed_signal_catalog: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    links: dict[str, Any] = Field(default={}, sa_column=Column(JSONB, nullable=False))
    market: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    assessment: dict[str, Any] = Field(default={}, sa_column=Column(JSONB, nullable=False))
    assessment_history: List[Any] = Field(default=[], sa_column=Column(JSONB, nullable=False))
    signals: dict[str, Any] = Field(default={}, sa_column=Column(JSONB, nullable=False))
    risk: List[Any] = Field(default=[], sa_column=Column(JSONB, nullable=False))
    contracts: List[Any] = Field(default=[], sa_column=Column(JSONB, nullable=False))
    incidents: List[Any] = Field(default=[], sa_column=Column(JSONB, nullable=False))
    dependencies: List[Any] = Field(default=[], sa_column=Column(JSONB, nullable=False))
    ask_suggestions: List[str] = Field(default=[], sa_column=Column(JSONB, nullable=False))
    updated_at: datetime = Field(default_factory=datetime.utcnow)
