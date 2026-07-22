from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal

@dataclass
class TriggerEvent:
    protocol: str
    score: float
    delta: float
    action: Literal["reduce_25", "reduce_50", "exit"]
    reason: str

class TriggerAdapter(ABC):
    @abstractmethod
    async def detect(self) -> TriggerEvent | None:
        ...
