import json
from openai import AsyncOpenAI
from .prompt import SYSTEM_PROMPT, build_user_prompt
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL
from db.models import HealthScore
from datetime import datetime

# AsyncOpenAI is required here because score_protocol is an async function
llm_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
) if OPENROUTER_API_KEY else None

async def score_protocol(snapshot: dict, avg_24h: float) -> HealthScore:
    """
    Calls OpenRouter (via AsyncOpenAI) to score the protocol based on the signal snapshot.
    Returns a HealthScore model.
    """
    protocol = snapshot.get("protocol", "unknown")

    if not llm_client:
        print("[WARN] No OpenRouter API key, returning neutral fallback score.")
        return HealthScore(
            protocol=protocol,
            timestamp=datetime.utcnow(),
            score=50.0,
            reasoning="Neutral fallback score (No API key configured for AI scoring)",
            risk_flags=["NO_AI_AVAILABLE"],
            delta_from_24h_avg=0.0,
        )

    try:
        # Properly awaited now — was synchronous OpenAI client before
        response = await llm_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": build_user_prompt(snapshot)},
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
        delta = score - avg_24h

        return HealthScore(
            protocol=protocol,
            timestamp=datetime.utcnow(),
            score=score,
            reasoning=data.get("reasoning", "No reasoning provided"),
            risk_flags=data.get("risk_flags", []),
            delta_from_24h_avg=delta,
        )

    except json.JSONDecodeError as e:
        print(f"[ERROR] Scorer JSON parse failed for {protocol}: {e}")
        return _failure_score(protocol, f"JSON parse error: {e}")
    except Exception as e:
        print(f"[ERROR] Scoring failed for {protocol}: {e}")
        return _failure_score(protocol, str(e))


def _failure_score(protocol: str, reason: str) -> HealthScore:
    """Returns a neutral fallback score with a SCORING_FAILURE flag."""
    return HealthScore(
        protocol=protocol,
        timestamp=datetime.utcnow(),
        score=50.0,
        reasoning=f"Scoring failed: {reason}",
        risk_flags=["SCORING_FAILURE"],
        delta_from_24h_avg=0.0,
    )
