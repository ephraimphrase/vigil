from typing import Literal

def get_action_for_score(score: float) -> Literal["reduce_25", "reduce_50", "exit"]:
    """
    Maps an absolute health score to a portfolio action.
    """
    if score < 40:
        return "exit"
    elif score < 60:
        return "reduce_50"
    else:
        # 60-79 range
        return "reduce_25"
