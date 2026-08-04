"""
Search-grounded LLM client for signals that don't have a clean numeric
API - "does this lending protocol currently have material bad debt" isn't
something any free provider checked this session exposes (Chaos Labs/
Gauntlet publish it on dashboards, not a public API - see conversation).
Perplexity's Sonar models are search-native (not just an LLM guessing
from training data), verified 2026-08-04 against a real question about
Aave's rsETH bad debt incident - it returned current, cited, numeric
figures. Costs a real OpenRouter call per question, unlike every other
provider in this codebase - use sparingly, for narrative/qualitative
signals only, not as a substitute for a real API when one exists.
"""

import json

from integrations.llm import llm_client

SEARCH_MODEL = "perplexity/sonar"

_SYSTEM_PROMPT = """
You answer factual questions using current web search results. Return
ONLY valid JSON in this exact shape, no markdown formatting or other text:
{
  "raw": "<1-2 sentence factual answer, with numbers/dates where available>",
  "normalized": <float 0.0-1.0, where 1.0 = no concern / healthy and 0.0 = severe / critical>,
  "confidence": "<high|medium|low, based on how consistent/recent your sources are>"
}
"""


async def ask_structured(question: str) -> dict:
    """
    Runs `question` through Sonar, returns {raw, normalized, confidence}.
    Raises if the model didn't return valid JSON (rare, but happens - see
    scoring/scorer.py's calculate_global_score for the same
    strip-markdown-fences defensive pattern used here) or if
    OPENROUTER_API_KEY isn't configured (llm_client is None).
    """
    if not llm_client:
        raise RuntimeError("OPENROUTER_API_KEY not configured")

    response = await llm_client.chat.completions.create(
        model=SEARCH_MODEL,
        max_tokens=300,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
    )
    raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    data = json.loads(raw)
    return {
        "raw":         data.get("raw", ""),
        "normalized":  max(0.0, min(1.0, float(data.get("normalized", 0.5)))),
        "confidence":  data.get("confidence", "low"),
    }
