import logging
from typing import Any, Dict, List

from fastapi import BackgroundTasks

from db.queries import get_user_triggers
from execution.keeperhub import execute_rebalance, TriggerEvent

logger = logging.getLogger(__name__)


def _condition_met(condition: str, score: float) -> bool:
    """Parses simple threshold conditions like 'score < 40' or 'score > 40'."""
    try:
        if "<" in condition:
            threshold = float(condition.split("<")[1].strip())
            return score < threshold
        elif ">" in condition:
            threshold = float(condition.split(">")[1].strip())
            return score > threshold
    except Exception:
        logger.error("Failed to parse trigger condition: %s", condition)
    return False


def dispatch_triggers(
    protocol: str, score: float, reason: str, background_tasks: BackgroundTasks
) -> List[Dict[str, Any]]:
    """
    Checks every user-configured trigger for `protocol` against the freshly
    computed score and schedules a KeeperHub execution for each one that
    fires. Returns the executions that were scheduled.
    """
    triggers = get_user_triggers(protocol)
    executions = []

    for trigger in triggers:
        if not _condition_met(trigger["condition"], score):
            continue

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

    return executions
