import json

from db.queries import get_previous_signal_value, save_signal_history, save_signals, save_typed_signals
from integrations.redis_client import redis_client

# Static per-category display metadata - label/source/status don't need
# the LLM to invent them each sweep, they're fixed facts about which
# fetcher produced the category (see ingestion/registry.py). Redis
# category keys match each fetcher's own `.key`, not the registry dict
# key it's registered under (e.g. dao.py's DaoFetcher.key is "snapshot",
# kept stable on purpose - see ingestion/dao.py).
_SIGNAL_META: dict[str, dict[str, dict[str, str]]] = {
    "onchain": {
        "tvl":          {"label": "Total value locked", "source": "DeFiLlama", "status": "live"},
        "liquidations": {"label": "Liquidations",        "source": "onchain",  "status": "live"},
        "whales":       {"label": "Holder concentration", "source": "Ethplorer", "status": "live"},
        "fees":         {"label": "Protocol fees",       "source": "DeFiLlama", "status": "live"},
        "volume":       {"label": "DEX volume",          "source": "DeFiLlama", "status": "live"},
        "yields":       {"label": "Pool yields",         "source": "DeFiLlama", "status": "live"},
    },
    "offchain": {
        "github":    {"label": "Commit velocity",   "source": "GitHub REST", "status": "live"},
        "sentiment": {"label": "Social sentiment",  "source": "LunarCrush",  "status": "live"},
        "security":  {"label": "Security events",   "source": "DeFiLlama Hacks", "status": "live"},
        "news":      {"label": "News coverage",     "source": "NewsAPI",     "status": "live"},
        "social":    {"label": "Social activity",   "source": "LunarCrush",  "status": "live"},
        "market":    {"label": "Market data",       "source": "CoinGecko",   "status": "live"},
        "snapshot":  {"label": "Governance activity", "source": "Snapshot",  "status": "live"},
    },
}

# Below this normalized-value delta, treat the change as noise rather
# than a real up/down move.
_TREND_EPSILON = 0.02


def _trend(previous: float | None, current: float) -> str:
    if previous is None:
        return "flat"
    diff = current - previous
    if diff > _TREND_EPSILON:
        return "up"
    if diff < -_TREND_EPSILON:
        return "down"
    return "flat"


def build_and_persist_signals(protocol_id: str, dynamic_tree: dict, breakdown: dict) -> None:
    """Converts this sweep's LLM-scored per-category breakdown (see
    scoring/prompt.py's "signals" field, populated by calculate_global_score)
    into the {label, raw, normalized, trend, weight, source, status} shape
    apps/web's SignalBreakdown.tsx renders, and writes it to
    protocols.signals via db.queries.save_signals. Weight is an equal
    split across whatever categories actually have data this sweep - real
    scoring doesn't consume it, it's purely the frontend's relative-size
    display. Trend compares against the previous sweep's normalized value
    for the same (protocol, domain.category), stored in signal_history."""
    history_values: dict[str, float] = {}
    groups: dict[str, dict] = {"onchain": {}, "offchain": {}}

    for domain in ("onchain", "offchain"):
        categories = dynamic_tree.get(domain, {})
        present = [key for key in categories if categories[key]]
        if not present:
            continue
        weight = round(1 / len(present), 4)
        meta_for_domain = _SIGNAL_META.get(domain, {})

        for key in present:
            answer = breakdown.get(domain, {}).get(key)
            if not isinstance(answer, dict):
                continue
            try:
                normalized = max(0.0, min(1.0, float(answer.get("normalized", 0.5))))
            except (TypeError, ValueError):
                continue

            history_key = f"{domain}.{key}"
            previous = get_previous_signal_value(protocol_id, history_key)
            meta = meta_for_domain.get(key, {"label": key, "source": domain, "status": "live"})

            groups[domain][key] = {
                "label": meta["label"],
                "raw": answer.get("raw", ""),
                "normalized": normalized,
                "trend": _trend(previous, normalized),
                "weight": weight,
                "source": meta["source"],
                "status": meta["status"],
            }
            history_values[history_key] = normalized

    if not groups["onchain"] and not groups["offchain"]:
        return

    save_signals(protocol_id, groups["onchain"], groups["offchain"])
    if history_values:
        save_signal_history(protocol_id, history_values)


async def build_and_persist_typed_signals(protocol_id: str) -> None:
    """Typed signals (ingestion/typed_signals.py) already carry their own
    normalized/raw/confidence from a search-grounded LLM call - unlike
    onchain/offchain, they don't go through calculate_global_score's
    breakdown (see scoring/scorer.py's _build_dynamic_tree, which
    excludes this category from the tree it sends to the scorer). Read
    straight from Redis instead and converted into the same Signal shape,
    written to protocols.signals["typed"] via save_typed_signals. A
    protocol with no typed_signal_catalog, or whose typed_signals fetch
    hasn't produced anything yet, is left with whatever "typed" already
    has (seed data) rather than being overwritten with nothing.

    Each individual typed signal is its own Redis hash field (see
    ingestion/typed_signals.py's _fetch_payload) rather than one combined
    blob, so this reads the whole hash and skips the non-signal "source"
    field ingest_all_signals also wrote alongside them."""
    redis_key = f"vigil:data:{protocol_id}:typed:typed_signals"
    hash_data = await redis_client.hgetall(redis_key)
    if not hash_data:
        return

    entries: dict[str, dict] = {}
    for key, raw in hash_data.items():
        if key == "source":
            continue
        try:
            entry = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(entry, dict):
            entries[key] = entry
    if not entries:
        return

    weight = round(1 / len(entries), 4)
    typed: dict[str, dict] = {}
    history_values: dict[str, float] = {}

    for key, entry in entries.items():
        if not isinstance(entry, dict):
            continue
        try:
            normalized = max(0.0, min(1.0, float(entry.get("normalized", 0.5))))
        except (TypeError, ValueError):
            continue

        history_key = f"typed.{key}"
        previous = get_previous_signal_value(protocol_id, history_key)
        typed[key] = {
            "label": entry.get("label", key),
            "raw": entry.get("raw", ""),
            "normalized": normalized,
            "trend": _trend(previous, normalized),
            "weight": weight,
            "source": "Perplexity Sonar",
            "status": "live",
        }
        history_values[history_key] = normalized

    if not typed:
        return

    save_typed_signals(protocol_id, typed)
    if history_values:
        save_signal_history(protocol_id, history_values)
