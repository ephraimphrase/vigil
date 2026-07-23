"""
Canonical raw-signal shapes for apps/api/ingestion/.

Every fetcher returns one of these TypedDicts regardless of which upstream
provider backs it. Swapping a provider (e.g. LunarCrush -> CCData for
SocialSignal) means only the fetcher's internals change — normalizer.py,
scheduler.py, and the scorer never see a vendor-specific field name.
"""

from typing import Optional, TypedDict


class TvlSignal(TypedDict):
    tvl_current: float
    tvl_delta_24h: float
    tvl_delta_7d: float


class LiquidationSignal(TypedDict):
    liquidation_volume_24h: float
    large_liquidations_count: int


class WhaleSignal(TypedDict):
    net_outflow_24h: float
    suspicious_team_transfers: int
    largest_single_transfer: float


class GithubSignal(TypedDict):
    commits_30d: int
    commits_7d: int
    open_issues: int
    days_since_last_release: float
    emergency_risk_penalty: float


class SentimentSignal(TypedDict):
    sentiment_score: float
    post_count_7d: int
    avg_upvotes: float
    risk_keywords: list[str]


class SecuritySignal(TypedDict):
    hack_count_90d: int
    hack_count_180d: int
    total_lost_90d: float


class NewsSignal(TypedDict):
    news_sentiment: float
    article_count_7d: int
    key_risk: Optional[str]


class SocialSignal(TypedDict):
    social_volume_24h: float
    influence_score: float   # 0-100 reach/attention score (e.g. LunarCrush Galaxy Score, CCData social rank)
    sentiment_score: float   # 0-1
    social_dominance: float  # % of total crypto social volume


class GovernanceSignal(TypedDict):
    governance_risk_score: float


class RawOnchainSignals(TypedDict):
    tvl: TvlSignal
    liquidations: LiquidationSignal
    whales: WhaleSignal


class RawOffchainSignals(TypedDict):
    github: GithubSignal
    sentiment: SentimentSignal
    security: SecuritySignal
    news: NewsSignal
    social: SocialSignal
    snapshot: GovernanceSignal
