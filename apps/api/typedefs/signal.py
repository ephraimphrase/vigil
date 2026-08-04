"""
The universal envelope every ingestion signal is returned in (see
ingestion.base_fetcher.BaseFetcher). `payload` is the only part that
varies per provider - key/channel/status/fetched_at/error are identical in
shape across every signal, which is what lets normalizer.py,
resilient_fetch.py, and the registry treat all nine signals identically
instead of nine unrelated shapes.
"""

from typing import Any, Literal, Optional, TypedDict

SignalChannel = Literal["onchain", "offchain"]

OnchainSignalKey = Literal["tvl", "liquidations", "whales", "fees", "volume", "yields"]
OffchainSignalKey = Literal["github", "sentiment", "security", "news", "social", "snapshot", "market"]
SignalKey = Literal[OnchainSignalKey, OffchainSignalKey]

SignalStatus = Literal["ok", "error"]


class Signal(TypedDict):
    key: SignalKey
    channel: SignalChannel
    protocol_id: str
    status: SignalStatus
    fetched_at: float
    error: Optional[str]
    payload: dict[str, Any]


RawOnchainSignals = dict[OnchainSignalKey, Signal]
RawOffchainSignals = dict[OffchainSignalKey, Signal]
