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
from ingestion.typed_signals import TypedSignalsFetcher

ONCHAIN_FETCHERS: dict[OnchainSignalKey, BaseFetcher] = {
    "tvl": TvlFetcher(),
    "whales": WhalesFetcher(),
    "fees": FeesFetcher(),
    "volume": VolumeFetcher(),
    "yields": YieldsFetcher(),
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

# Kept separate from OFFCHAIN_FETCHERS, not because it fetches
# differently (routers/webhook/ingest.py still sweeps it the same way,
# see TYPED_FETCHERS usage there), but because everything downstream of
# ingestion treats it differently: TypedSignalsFetcher.channel is "typed"
# (its own Redis root - vigil:data:{protocol}:typed:typed_signals -
# alongside onchain/offchain, not nested under either), scoring/scorer.py
# excludes it from the tree it sends to the scoring LLM (it already
# carries its own normalized/raw/confidence from
# ingestion/typed_signals.py's search-grounded call, so re-scoring it
# would be redundant), and scoring/signals.py writes it into
# protocols.signals["typed"] instead of ["onchain"/"offchain"]. Its own
# per-signal TTL cache (see ingestion/typed_signals.py) means most sweeps
# make zero or few real calls even though this runs on every sweep
# alongside everything else.
TYPED_FETCHERS: dict[str, BaseFetcher] = {
    "typed_signals": TypedSignalsFetcher(),
}


async def fetch_all_onchain(protocol: str) -> RawOnchainSignals:
    return {key: await fetcher.fetch(protocol) for key, fetcher in ONCHAIN_FETCHERS.items()}


async def fetch_all_offchain(protocol: str) -> RawOffchainSignals:
    return {key: await fetcher.fetch(protocol) for key, fetcher in OFFCHAIN_FETCHERS.items()}
