from fastapi import APIRouter, BackgroundTasks

from scoring.scorer import calculate_global_score
from .tree import build_dynamic_tree
from .triggers import dispatch_triggers

router = APIRouter()


@router.post("/webhook/score/{protocol}", tags=["Webhooks"])
async def score_protocol(protocol: str, background_tasks: BackgroundTasks):
    """
    Reconstructs the dynamic data tree from Redis and calls the LLM Oracle.
    If the score breaches any user thresholds, it triggers KeeperHub workflows.
    """
    dynamic_tree, all_keys = await build_dynamic_tree(protocol)

    # Call the LLM (Global Oracle)
    result = await calculate_global_score(protocol, dynamic_tree)
    score = result["score"]
    reason = result["reasoning"]

    executions = dispatch_triggers(protocol, score, reason, background_tasks)

    return {
        "protocol": protocol,
        "score": score,
        "reasoning": reason,
        "tree_size": len(all_keys),
        "executions_triggered": len(executions),
        "executions": executions
    }
