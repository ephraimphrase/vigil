from execution.adapter import TriggerEvent
from db.models import HealthScore
from execution.decision import get_action_for_score

DELTA_THRESHOLD = -15.0

def check_delta(latest: HealthScore) -> TriggerEvent | None:
    """
    Checks if the protocol score drop warrants an execution trigger.
    A drop > 15 points from the 24h average is an immediate trigger, regardless of absolute score.
    Alternatively, if the absolute score is very low, it triggers.
    """
    trigger_action = None

    # Condition 1: Sudden massive drop
    if latest.delta_from_24h_avg <= DELTA_THRESHOLD:
        # Determine severity based on absolute score too
        trigger_action = get_action_for_score(latest.score)
    
    # Condition 2: Absolute score is just terrible (below 60)
    elif latest.score < 60:
        trigger_action = get_action_for_score(latest.score)

    if trigger_action:
        return TriggerEvent(
            protocol=latest.protocol,
            score=latest.score,
            delta=latest.delta_from_24h_avg,
            action=trigger_action,
            reason=latest.reasoning
        )
    
    return None
