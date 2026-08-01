"""
One universal type for every ingestion signal, instead of a bespoke
TypedDict per provider. Every fetcher (tvl, github, sentiment, ...)
returns a Signal; which fields live inside it differs per signal, same as
it always did - the point isn't to type-check those fields, it's that
every fetcher, normalizer.py, resilient_fetch.py, and run_simulation.py's
mocks all speak the same one type instead of nine unrelated ones.
"""

from typing import Any, Literal

Signal = dict[str, Any]

OnchainSignalKey = Literal["tvl", "liquidations", "whales"]
OffchainSignalKey = Literal["github", "sentiment", "security", "news", "social", "snapshot"]
SignalKey = Literal[OnchainSignalKey, OffchainSignalKey]

RawOnchainSignals = dict[OnchainSignalKey, Signal]
RawOffchainSignals = dict[OffchainSignalKey, Signal]
