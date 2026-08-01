from pydantic import BaseModel, Field
from typing import Any, Dict, Optional


class DynamicSignal(BaseModel):
    protocol: str = Field(..., description="The name of the protocol (e.g., 'aave', 'curve')")
    domain: str = Field(..., description="Must be 'onchain' or 'offchain'")
    category: str = Field(..., description="e.g., 'market', 'security', 'social', 'governance', 'oracle'")
    metric_name: str = Field(..., description="The unique name of the signal (e.g., 'flashloan_volume')")
    value: Any = Field(..., description="The actual data. Can be a float, a string, a list, or a nested JSON object.")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional dictionary containing context like tx_hashes, headlines, or block numbers."
    )
