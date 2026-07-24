from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
import redis.asyncio as redis
import json
import logging
from db.queries import get_user_triggers
from execution.keeperhub import execute_rebalance, TriggerEvent
from scoring.scorer import calculate_global_score

logger = logging.getLogger(__name__)

router = APIRouter()

# Redis connection
redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)

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

@router.post("/webhook/ingest", tags=["Webhooks"])
async def ingest_dynamic_signal(signal: DynamicSignal):
    """
    Universal ingestion funnel for all external data sources.
    Data is saved into a dynamic Redis tree.
    """
    redis_key = f"vigil:data:{signal.protocol}:{signal.domain}:{signal.category}"
    
    # Store the value. If it's a complex type, serialize it.
    if isinstance(signal.value, (dict, list)):
        value_str = json.dumps(signal.value)
    else:
        value_str = str(signal.value)
        
    await redis_client.hset(redis_key, signal.metric_name, value_str)
    
    # Optionally store metadata
    if signal.metadata:
        await redis_client.hset(f"{redis_key}:meta", signal.metric_name, json.dumps(signal.metadata))
        
    return {"status": "success", "saved_to": redis_key}


@router.post("/webhook/score/{protocol}", tags=["Webhooks"])
async def score_protocol(protocol: str, background_tasks: BackgroundTasks):
    """
    Reconstructs the dynamic data tree from Redis and calls the LLM Oracle.
    If the score breaches any user thresholds, it triggers KeeperHub workflows.
    """
    # 1. Fetch all keys for this protocol
    cursor = 0
    pattern = f"vigil:data:{protocol}:*"
    all_keys = []
    
    while True:
        cursor, keys = await redis_client.scan(cursor, match=pattern, count=100)
        all_keys.extend(keys)
        if cursor == 0:
            break
            
    if not all_keys:
        raise HTTPException(status_code=404, detail=f"No data found for protocol {protocol}")
        
    # 2. Reconstruct dynamic tree
    dynamic_tree = {"onchain": {}, "offchain": {}}
    
    for key in all_keys:
        if ":meta" in key:
            continue # skip meta keys for the main tree
            
        parts = key.split(":")
        domain = parts[3]
        category = parts[4]
        
        if domain not in dynamic_tree:
            dynamic_tree[domain] = {}
        if category not in dynamic_tree[domain]:
            dynamic_tree[domain][category] = {}
            
        hash_data = await redis_client.hgetall(key)
        for metric, val in hash_data.items():
            try:
                # Attempt to parse json (lists/dicts/floats)
                dynamic_tree[domain][category][metric] = json.loads(val)
            except json.JSONDecodeError:
                # Fallback to float or string
                try:
                    dynamic_tree[domain][category][metric] = float(val)
                except ValueError:
                    dynamic_tree[domain][category][metric] = val

    # 3. Call the LLM (Global Oracle)
    # Using existing logic in scorer.py, but we'll need to pass the dynamic_tree
    # We will update scorer.py to handle the dynamic tree format next.
    result = await calculate_global_score(protocol, dynamic_tree)
    score = result["score"]
    reason = result["reasoning"]
    
    # 4. Check user triggers and execute if needed
    triggers = get_user_triggers(protocol)
    executions = []
    
    for trigger in triggers:
        # Example condition parsing: "score < 40"
        condition_met = False
        try:
            if "<" in trigger["condition"]:
                threshold = float(trigger["condition"].split("<")[1].strip())
                if score < threshold:
                    condition_met = True
            elif ">" in trigger["condition"]:
                threshold = float(trigger["condition"].split(">")[1].strip())
                if score > threshold:
                    condition_met = True
        except Exception:
            logger.error("Failed to parse trigger condition: %s", trigger["condition"])
            
        if condition_met:
            event = TriggerEvent(
                protocol=protocol,
                score=score,
                reason=reason,
                action=trigger["action_slug"]
            )
            wallet = trigger["wallet_address"]
            
            # Execute workflow via KeeperHub asynchronously
            background_tasks.add_task(execute_rebalance, event, wallet)
            executions.append({"wallet": wallet, "action": trigger["action_slug"]})
            
    return {
        "protocol": protocol,
        "score": score,
        "reasoning": reason,
        "tree_size": len(all_keys),
        "executions_triggered": len(executions),
        "executions": executions
    }
