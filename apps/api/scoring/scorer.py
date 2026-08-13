import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlmodel import Session, select

from .prompt import SYSTEM_PROMPT, build_user_prompt
from .signals import build_and_persist_signals, build_and_persist_typed_signals
from config import OPENROUTER_MODEL
from db.models import Protocol, engine
from db.queries import save_health_score, save_market_data
from integrations.llm import llm_client
from integrations.redis_client import redis_client

logger = logging.getLogger(__name__)

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
            "risk_flags": ["NO_AI_AVAILABLE"],
            "signals": {},
        }

    try:
        response = await llm_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=100000,
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
            "risk_flags": data.get("risk_flags", []),
            "signals": data.get("signals", {}),
        }

    except json.JSONDecodeError as e:
        logger.error(f"Scorer JSON parse failed for {protocol}: {e}")
        return _failure_score(f"JSON parse error: {e}")
    except Exception as e:
        logger.error(f"Scoring failed for {protocol}: {e}")
        return _failure_score(str(e))


def _failure_score(reason: str) -> dict:
    """Returns a neutral fallback score with a SCORING_FAILURE flag."""
    return {
        "score": 50.0,
        "reasoning": f"Scoring failed: {reason}",
        "risk_flags": ["SCORING_FAILURE"],
        "signals": {},
    }


async def _build_dynamic_tree(protocol: str) -> Tuple[Dict[str, Any], List[str]]:
    """Reconstructs the dynamic onchain/offchain data tree for `protocol`
    from Redis - same vigil:data:{protocol}:{domain}:{category} convention
    routers/webhook/ingest.py's ingest_all_signals writes."""
    cursor = 0
    pattern = f"vigil:data:{protocol}:*"
    all_keys: List[str] = []

    while True:
        cursor, keys = await redis_client.scan(cursor, match=pattern, count=100)
        all_keys.extend(keys)
        if cursor == 0:
            break

    dynamic_tree: Dict[str, Any] = {"onchain": {}, "offchain": {}}
    for key in all_keys:
        if ":meta" in key:
            continue  # skip meta keys for the main tree

        parts = key.split(":")
        domain, category = parts[3], parts[4]
        if category == "typed_signals":
            # Already carries its own normalized/raw/confidence from a
            # search-grounded call (ingestion/typed_signals.py) - handled
            # separately by scoring/signals.py's build_and_persist_typed_signals,
            # not re-scored by the general LLM breakdown here.
            continue
        dynamic_tree.setdefault(domain, {}).setdefault(category, {})

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

    return dynamic_tree, all_keys


def _format_ath_multiple(ath: Any, ath_change_pct: Any, ath_date: Any) -> Optional[str]:
    if not isinstance(ath, (int, float)) or not isinstance(ath_change_pct, (int, float)):
        return None
    date_str = ""
    if isinstance(ath_date, str):
        try:
            date_str = f", {datetime.fromisoformat(ath_date.replace('Z', '+00:00')).strftime('%b %Y')}"
        except ValueError:
            pass
    return f"{ath_change_pct:.0f}% from ATH (${ath:,.2f}{date_str})"


def _map_market_data(raw: dict) -> Optional[dict]:
    """Maps ingestion/market.py's raw CoinGecko pass-through (see
    providers/coingecko.py's _MARKET_DATA_KEYS) onto the camelCase Market
    shape apps/web/types/protocols.ts declares and MarketStrip.tsx
    renders. price/marketCap/fdv/priceChange24h/priceChange7d default to
    0 rather than staying null - MarketStrip formats them unconditionally
    (fmtUsdFull(market.price) etc.), so a null here would crash the
    detail page rather than just showing a placeholder."""
    if raw.get("current_price") is None:
        return None
    return {
        "price": raw.get("current_price") or 0,
        "marketCap": raw.get("market_cap") or 0,
        "fdv": raw.get("fully_diluted_valuation") or 0,
        "priceChange24h": raw.get("price_change_percentage_24h") or 0,
        "priceChange7d": raw.get("price_change_percentage_7d") or 0,
        "priceChange30d": raw.get("price_change_percentage_30d"),
        "circulating": raw.get("circulating_supply"),
        "maxSupply": raw.get("max_supply"),
        "rank": raw.get("market_cap_rank"),
        "athMultiple": _format_ath_multiple(raw.get("ath"), raw.get("ath_change_percentage"), raw.get("ath_date")),
    }


async def run_scoring_sweep() -> None:
    """Scores every protocol in the `protocols` table against whatever
    ingest_all_signals last wrote to Redis, persisting each result via
    save_health_score. Called from inside ingest_all_signals right after
    an ingest run finishes - not exposed as its own route, since scoring
    off data an ingest run hasn't produced yet isn't meaningful. Protocols
    with nothing ingested yet are skipped rather than failing the sweep."""
    with Session(engine) as session:
        protocol_ids = session.exec(select(Protocol.id)).all()

    for protocol_id in protocol_ids:
        dynamic_tree, all_keys = await _build_dynamic_tree(protocol_id)
        if not all_keys:
            continue

        result = await calculate_global_score(protocol_id, dynamic_tree)
        save_health_score(protocol_id, result["score"], result["reasoning"])
        build_and_persist_signals(protocol_id, dynamic_tree, result["signals"])
        await build_and_persist_typed_signals(protocol_id)

        market_raw = dynamic_tree.get("offchain", {}).get("market")
        if market_raw:
            market = _map_market_data(market_raw)
            if market:
                save_market_data(protocol_id, market)
