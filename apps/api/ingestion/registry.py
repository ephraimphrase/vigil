"""
The standard for how a signal is found: one SignalKey -> BaseFetcher
instance per domain. Every fetcher already speaks the same BaseFetcher.fetch()
contract, so adding a signal is one entry here - callers never need to
know which provider backs which key.
"""

from typedefs import OffchainSignalKey, OnchainSignalKey, RawOffchainSignals, RawOnchainSignals
from ingestion.base_fetcher import BaseFetcher
from ingestion.tvl import TvlFetcher
from ingestion.liquidations import LiquidationsFetcher
from ingestion.whales import WhalesFetcher
from ingestion.github import GithubFetcher
from ingestion.sentiment import SentimentFetcher
from ingestion.security import SecurityFetcher
from ingestion.news import NewsFetcher
from ingestion.social import SocialFetcher
from ingestion.dao import DaoFetcher
from ingestion.market import MarketFetcher
from ingestion.fees import FeesFetcher
from ingestion.volume import VolumeFetcher
from ingestion.yields import YieldsFetcher

ONCHAIN_FETCHERS: dict[OnchainSignalKey, BaseFetcher] = {
    "tvl": TvlFetcher(),
    "whales": WhalesFetcher(),
    "fees": FeesFetcher(),
    "volume": VolumeFetcher(),
    "yields": YieldsFetcher(),
    # "liquidations": LiquidationsFetcher(),  # needs ETHERSCAN_API_KEY, not configured - would always return {}
}

OFFCHAIN_FETCHERS: dict[OffchainSignalKey, BaseFetcher] = {
     "github": GithubFetcher(),
     "sentiment": SentimentFetcher(),
     "security": SecurityFetcher(),
     "news": NewsFetcher(),
     "social": SocialFetcher(),
     "market": MarketFetcher(),
     "dao": DaoFetcher(),
}


async def fetch_all_onchain(protocol: str) -> RawOnchainSignals:
    return {key: await fetcher.fetch(protocol) for key, fetcher in ONCHAIN_FETCHERS.items()}


async def fetch_all_offchain(protocol: str) -> RawOffchainSignals:
    return {key: await fetcher.fetch(protocol) for key, fetcher in OFFCHAIN_FETCHERS.items()}
