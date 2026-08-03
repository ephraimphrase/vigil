import asyncio
import argparse
import time
from unittest.mock import patch
from datetime import datetime

from simulation.normalizer import normalize_offchain, normalize_onchain
# score_protocol never existed in scoring.scorer (the real function is
# calculate_global_score, with an unrelated signature) - pre-existing bug,
# not introduced by this migration. Aliased so the name is importable and
# patchable; run_scenario always mocks it before it would actually be
# called, so the signature mismatch with the real function never matters
# here, but calling the unmocked scorer this way would break.
from scoring.scorer import calculate_global_score as score_protocol
from scoring.delta import check_delta
from execution.keeperhub import execute_rebalance
from db.models import HealthScore
from typedefs import Signal
from config import USER_WALLET

# --- SCENARIO DATA MOCKS ---
# Payloads only - _mock_signal() below wraps each in the same envelope
# BaseFetcher.fetch() would produce, so normalizer.py sees exactly what it
# sees in production. github/sentiment/news/snapshot carry raw text
# (recent_commit_messages/post_samples/headlines/recent_proposals) instead
# of a pre-scored float - ingestion never calls an LLM, so normalizer.py's
# sub-scores for those four fall back to their neutral defaults here same
# as they would for a real fetch. social's sentiment_score is real (from
# LunarCrush), not LLM-derived, so it stays.

SCENARIOS = {
    "nominal": {
        "tvl": {"tvl_current": 10_000_000_000, "tvl_delta_24h": 0.02, "tvl_delta_7d": 0.05},
        "liquidations": {"liquidation_volume_24h": 50_000, "large_liquidations_count": 0},
        "whales": {"net_outflow_24h": 100_000, "suspicious_team_transfers": 0, "largest_single_transfer": 50_000},
        "github": {"commits_30d": 120, "commits_7d": 30, "open_issues": 15, "days_since_last_push": 14, "recent_commit_messages": ["feat: add new pool", "chore: bump deps"]},
        "sentiment": {"post_count_7d": 150, "avg_upvotes": 45, "post_samples": ["Loving the new update", "TVL is up again this week"]},
        "security": {"hack_count_90d": 0, "hack_count_180d": 0, "total_lost_90d": 0},
        "news": {"article_count_7d": 12, "headlines": ["Protocol announces new partnership"]},
        "social": {"social_volume_24h": 2500, "sentiment_score": 0.8, "influence_score": 85},
        "snapshot": {"recent_proposals": ["Title: Increase grants budget"]},
        # Forced LLM Score (since we mock scorer in simulation)
        "llm_score": 95.0,
        "llm_reasoning": "Protocol is exceptionally healthy. TVL is growing, dev velocity is steady, and sentiment is highly positive."
    },
    "cascade": {
        "tvl": {"tvl_current": 7_000_000_000, "tvl_delta_24h": -0.30, "tvl_delta_7d": -0.35},
        "liquidations": {"liquidation_volume_24h": 250_000_000, "large_liquidations_count": 85},
        "whales": {"net_outflow_24h": 5_000_000, "suspicious_team_transfers": 0, "largest_single_transfer": 2_000_000},
        "github": {"commits_30d": 110, "commits_7d": 25, "open_issues": 25, "days_since_last_push": 15, "recent_commit_messages": ["fix: adjust liquidation params"]},
        "sentiment": {"post_count_7d": 500, "avg_upvotes": 120, "post_samples": ["Getting nervous about this TVL drop", "Is this a cascade starting?"]},
        "security": {"hack_count_90d": 0, "hack_count_180d": 0, "total_lost_90d": 0},
        "news": {"article_count_7d": 45, "headlines": ["Market-wide liquidation cascade hits DeFi"]},
        "social": {"social_volume_24h": 12000, "sentiment_score": 0.15, "influence_score": 30},
        "snapshot": {"recent_proposals": ["Title: Adjust risk parameters"]},
        "llm_score": 32.0,
        "llm_reasoning": "Severe liquidation cascade triggered a 30% drop in TVL. Social sentiment indicates panic. No hacks detected, but extreme market risk."
    },
    "exploit": {
        "tvl": {"tvl_current": 9_000_000_000, "tvl_delta_24h": -0.10, "tvl_delta_7d": -0.10},
        "liquidations": {"liquidation_volume_24h": 2_000_000, "large_liquidations_count": 5},
        "whales": {"net_outflow_24h": 1_000_000, "suspicious_team_transfers": 0, "largest_single_transfer": 500_000},
        "github": {"commits_30d": 120, "commits_7d": 5, "open_issues": 50, "days_since_last_push": 16, "recent_commit_messages": ["EMERGENCY: pause all markets", "hotfix: patch exploit vector"]},
        "sentiment": {"post_count_7d": 800, "avg_upvotes": 300, "post_samples": ["EXPLOIT CONFIRMED, funds at risk", "get your money out now"]},
        "security": {"hack_count_90d": 1, "hack_count_180d": 1, "total_lost_90d": 55_000_000},
        "news": {"article_count_7d": 85, "headlines": ["DeFi protocol suffers $55M exploit"]},
        "social": {"social_volume_24h": 25000, "sentiment_score": 0.0, "influence_score": 10},
        "snapshot": {"recent_proposals": ["Title: Emergency pause and post-mortem"]},
        "llm_score": 15.0,
        "llm_reasoning": "CRITICAL: A $55M exploit was just detected by DeFiLlama hacks API. Sentiment has crashed to absolute zero with massive panic volume."
    },
    "rugpull": {
        "tvl": {"tvl_current": 100_000_000, "tvl_delta_24h": -0.80, "tvl_delta_7d": -0.90},
        "liquidations": {"liquidation_volume_24h": 0, "large_liquidations_count": 0},
        "whales": {"net_outflow_24h": 45_000_000, "suspicious_team_transfers": 4, "largest_single_transfer": 20_000_000},
        "github": {"commits_30d": 0, "commits_7d": 0, "open_issues": 150, "days_since_last_push": 140, "recent_commit_messages": []},
        "sentiment": {"post_count_7d": 2500, "avg_upvotes": 800, "post_samples": ["team wallets are draining, this is a rug", "devs went silent, repo abandoned"]},
        "security": {"hack_count_90d": 0, "hack_count_180d": 0, "total_lost_90d": 0},
        "news": {"article_count_7d": 120, "headlines": ["Team wallets drain protocol treasury, community suspects rug pull"]},
        "social": {"social_volume_24h": 50000, "sentiment_score": 0.0, "influence_score": 5},
        "snapshot": {"recent_proposals": []},
        "llm_score": 0.0,
        "llm_reasoning": "FATAL: Massive team wallet outflows detected, GitHub repo is abandoned, TVL dropped 80%. High probability of a hard rug pull."
    }
}

_ONCHAIN_KEYS = {"tvl", "liquidations", "whales"}


def _mock_signal(key: str, protocol: str, payload: dict) -> Signal:
    """Wraps a scenario's payload in the same envelope BaseFetcher.fetch()
    produces, so normalizer.py runs identically whether the payload came
    from a real fetcher or a canned scenario."""
    return {
        "key": key,
        "channel": "onchain" if key in _ONCHAIN_KEYS else "offchain",
        "protocol_id": protocol,
        "status": "ok",
        "fetched_at": time.time(),
        "error": None,
        "payload": payload,
    }

async def run_scenario(protocol: str, scenario_name: str):
    data = SCENARIOS.get(scenario_name)
    if not data:
        print(f"Error: Unknown scenario '{scenario_name}'. Available: {list(SCENARIOS.keys())}")
        return

    print("=" * 60)
    print(f"🔬 VIGIL SIMULATION SUITE 🔬")
    print(f"Protocol: {protocol.upper()} | Scenario: {scenario_name.upper()}")
    print("=" * 60)

    # Mock the LLM scorer to ensure stable, predictable testing without burning API credits
    async def mock_score(snapshot, avg_24h):
        score = data["llm_score"]
        return HealthScore(
            protocol=protocol,
            timestamp=datetime.utcnow(),
            score=score,
            reasoning=data["llm_reasoning"],
            risk_flags=["SIMULATION"],
            delta_from_24h_avg=(score - avg_24h)
        )

    with patch('__main__.score_protocol', mock_score):

        print("\n[1] Building canned on-chain signals...")
        raw_onchain = {
            "tvl": _mock_signal("tvl", protocol, data["tvl"]),
            "liquidations": _mock_signal("liquidations", protocol, data["liquidations"]),
            "whales": _mock_signal("whales", protocol, data["whales"]),
        }
        print(f"    Raw On-chain: {raw_onchain}")
        onchain_normalized = normalize_onchain(raw_onchain)
        print(f"    Normalized On-chain (0-1): {onchain_normalized}")

        print("\n[2] Building canned off-chain signals...")
        raw_offchain = {
            "github": _mock_signal("github", protocol, data["github"]),
            "sentiment": _mock_signal("sentiment", protocol, data["sentiment"]),
            "security": _mock_signal("security", protocol, data["security"]),
            "news": _mock_signal("news", protocol, data["news"]),
            "social": _mock_signal("social", protocol, data["social"]),
            "snapshot": _mock_signal("snapshot", protocol, data["snapshot"]),
        }
        offchain_normalized = normalize_offchain(raw_offchain, protocol, [])
        print(f"    Normalized Off-chain (0-1): {offchain_normalized}")

        snapshot = {**onchain_normalized, **offchain_normalized, "protocol": protocol}

        print("\n[3] Triggering intercepted AI Health Scorer...")
        avg_24h = 85.0 # Baseline assumption
        health = await score_protocol(snapshot, avg_24h)

        print("-" * 60)
        print(f"🔥 FINAL SCORE: {health.score} / 100")
        print(f"📉 DELTA FROM 24H AVG: {health.delta_from_24h_avg}")
        print(f"🧠 AI REASONING: {health.reasoning}")
        print("-" * 60)

        print("\n[4] Evaluating trigger conditions...")
        trigger = check_delta(health)
        if trigger:
            print(f"    🚨 TRIGGER DETECTED! Action: {trigger.action}")
            print(f"\n[5] Executing autonomous action via KeeperHub MCP...")
            try:
                result = await execute_rebalance(trigger, wallet_address=USER_WALLET)
                print(f"\n✅ SUCCESS! KeeperHub Transaction Hash: {result.get('tx_hash')}")
            except Exception as e:
                print(f"\n❌ EXECUTION FAILED: {e}")
        else:
            print("    ✅ Protocol healthy, no action needed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Vigil Simulation Suite")
    parser.add_argument("--scenario", type=str, required=True, choices=list(SCENARIOS.keys()), help="The risk scenario to simulate")
    parser.add_argument("--protocol", type=str, default="aave", help="The protocol to test against")

    args = parser.parse_args()

    asyncio.run(run_scenario(args.protocol, args.scenario))
