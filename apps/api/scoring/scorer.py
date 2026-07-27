import json
from openai import AsyncOpenAI
from .prompt import SYSTEM_PROMPT, build_user_prompt
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL
from db.models import HealthScore
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

llm_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
) if OPENROUTER_API_KEY else None

async def calculate_global_score(protocol: str, dynamic_tree: dict) -> dict:
    """
    Calls OpenRouter (via AsyncOpenAI) to score the protocol based on the dynamic data tree.
    Returns a dict with score and reasoning.
    """
    if not llm_client:
        logger.warning("[WARN] No OpenRouter API key, returning neutral fallback score.")
        return {
            "score": 50.0,
            "reasoning": "Neutral fallback score (No API key configured for AI scoring)",
            "risk_flags": ["NO_AI_AVAILABLE"]
        }

    try:
        response = await llm_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": build_user_prompt(protocol, dynamic_tree)},
            ],
        )
        raw = response.choices[0].message.content.strip()

        # Strip any accidental markdown code fences the LLM may add
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        data = json.loads(raw)
        score = max(0.0, min(100.0, float(data.get("score", 100))))

        return {
            "score": score,
            "reasoning": data.get("reasoning", "No reasoning provided"),
            "risk_flags": data.get("risk_flags", [])
        }

    except json.JSONDecodeError as e:
        logger.error(f"[ERROR] Scorer JSON parse failed for {protocol}: {e}")
        return _failure_score(protocol, f"JSON parse error: {e}")
    except Exception as e:
        logger.error(f"[ERROR] Scoring failed for {protocol}: {e}")
        return _failure_score(protocol, str(e))


def _failure_score(protocol: str, reason: str) -> dict:
    """Returns a neutral fallback score with a SCORING_FAILURE flag."""
    return {
        "score": 50.0,
        "reasoning": f"Scoring failed: {reason}",
        "risk_flags": ["SCORING_FAILURE"]
    }
