import json
from openai import OpenAI
from .prompt import SYSTEM_PROMPT, build_user_prompt
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL
from db.models import HealthScore
from datetime import datetime

llm_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
) if OPENROUTER_API_KEY else None

async def score_protocol(snapshot: dict, avg_24h: float) -> HealthScore:
    """
    Calls OpenRouter to score the protocol based on the signal snapshot.
    Returns a HealthScore model.
    """
    if not llm_client:
        print("[WARN] No OpenRouter API key, returning mock health score")
        return HealthScore(
            protocol=snapshot.get('protocol', 'unknown'),
            timestamp=datetime.utcnow(),
            score=100.0,
            reasoning="Mock score (No API key)",
            risk_flags=[],
            delta_from_24h_avg=0.0
        )

    try:
        response = llm_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(snapshot)}
            ]
        )
        raw = response.choices[0].message.content
        data = json.loads(raw)
        
        score = float(data.get("score", 100))
        delta = score - avg_24h

        return HealthScore(
            protocol=snapshot.get("protocol", "unknown"),
            timestamp=datetime.utcnow(),
            score=score,
            reasoning=data.get("reasoning", "No reasoning provided"),
            risk_flags=data.get("risk_flags", []),
            delta_from_24h_avg=delta
        )
    except Exception as e:
        print(f"[ERROR] Scoring failed: {e}")
        return HealthScore(
            protocol=snapshot.get("protocol", "unknown"),
            timestamp=datetime.utcnow(),
            score=50.0, # Neutral/failure score
            reasoning=f"Scoring failed: {e}",
            risk_flags=["SCORING_FAILURE"],
            delta_from_24h_avg=0.0
        )
