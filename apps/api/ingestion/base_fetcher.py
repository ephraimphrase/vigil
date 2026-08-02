import time
from abc import ABC, abstractmethod
from typing import Any, ClassVar

from typedefs import Signal, SignalChannel, SignalKey, SignalStatus


# ─── BASE FETCHER ───
class BaseFetcher(ABC):
    key: ClassVar[SignalKey]
    channel: ClassVar[SignalChannel]

    async def fetch(self, protocol_id: str) -> Signal:
        try:
            payload = await self._fetch_payload(protocol_id)
            status: SignalStatus = "ok"
            error = None
        except Exception as exc:
            payload = {}
            status = "error"
            error = str(exc)

        return {
            "key": self.key,
            "channel": self.channel,
            "protocol_id": protocol_id,
            "status": status,
            "fetched_at": time.time(),
            "error": error,
            "payload": payload,
        }

    @abstractmethod
    async def _fetch_payload(self, protocol_id: str) -> dict[str, Any]:
        """Return only the provider-specific body. Envelope is not your problem."""
        ...
