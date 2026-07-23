import asyncio
import argparse
from unittest.mock import patch
from datetime import datetime

from ingestion.normalizer import normalize_offchain, normalize_onchain
from scoring.scorer import score_protocol
from scoring.delta import check_delta
from execution.keeperhub import execute_rebalance
from db.models import HealthScore
from config import USER_WALLET

# Import the actual fetch functions we will be mocking
from ingestion.tvl import fetch_tvl
from ingestion.liquidations import fetch_liquidations
from ingestion.whales import fetch_whale_moves
from ingestion.github import fetch_github_activity
from ingestion.sentiment import fetch_reddit_sentiment
from ingestion.security import fetch_security_signals
from ingestion.news import fetch_news_signals
from ingestion.social import fetch_social_signals
from ingestion.snapshot import fetch_governance_risk

# --- SCENARIO DATA MOCKS ---

SCENARIOS = {
    "nominal": {
        "tvl": {"tvl_current": 10_000_000_000, "tvl_delta_24h": 0.02, "tvl_delta_7d": 0.05},
        "liquidations": {"liquidation_volume_24h": 50_000, "large_liquidations_count": 0},
        "whales": {"net_outflow_24h": 100_000, "suspicious_team_transfers": 0, "largest_single_transfer": 50_000},
        "github": {"commits_30d": 120, "commits_7d": 30, "open_issues": 15, "days_since_last_release": 14},
        "sentiment": {"sentiment_score": 0.85, "post_count_7d": 150, "avg_upvotes": 45},
        "security": {"hack_count_90d": 0, "hack_count_180d": 0, "total_lost_90d": 0},
        "news": {"news_sentiment": 0.75, "article_count_7d": 12},
        "social": {"social_volume_24h": 2500, "lc_sentiment": 0.8, "galaxy_score": 85},
        "snapshot": {"governance_risk_score": 1.0, "active_proposals": 2},
        # Forced LLM Score (since we mock scorer in simulation)
        "llm_score": 95.0,
        "llm_reasoning": "Protocol is exceptionally healthy. TVL is growing, dev velocity is steady, and sentiment is highly positive."
    },
    "cascade": {
        "tvl": {"tvl_current": 7_000_000_000, "tvl_delta_24h": -0.30, "tvl_delta_7d": -0.35},
        "liquidations": {"liquidation_volume_24h": 250_000_000, "large_liquidations_count": 85},
        "whales": {"net_outflow_24h": 5_000_000, "suspicious_team_transfers": 0, "largest_single_transfer": 2_000_000},
        "github": {"commits_30d": 110, "commits_7d": 25, "open_issues": 25, "days_since_last_release": 15},
        "sentiment": {"sentiment_score": 0.2, "post_count_7d": 500, "avg_upvotes": 120},
        "security": {"hack_count_90d": 0, "hack_count_180d": 0, "total_lost_90d": 0},
        "news": {"news_sentiment": 0.3, "article_count_7d": 45},
        "social": {"social_volume_24h": 12000, "lc_sentiment": 0.15, "galaxy_score": 30},
        "snapshot": {"governance_risk_score": 1.0, "active_proposals": 2},
        "llm_score": 32.0,
        "llm_reasoning": "Severe liquidation cascade triggered a 30% drop in TVL. Social sentiment indicates panic. No hacks detected, but extreme market risk."
    },
    "exploit": {
        "tvl": {"tvl_current": 9_000_000_000, "tvl_delta_24h": -0.10, "tvl_delta_7d": -0.10},
        "liquidations": {"liquidation_volume_24h": 2_000_000, "large_liquidations_count": 5},
        "whales": {"net_outflow_24h": 1_000_000, "suspicious_team_transfers": 0, "largest_single_transfer": 500_000},
        "github": {"commits_30d": 120, "commits_7d": 5, "open_issues": 50, "days_since_last_release": 16},
        "sentiment": {"sentiment_score": 0.05, "post_count_7d": 800, "avg_upvotes": 300},
        "security": {"hack_count_90d": 1, "hack_count_180d": 1, "total_lost_90d": 55_000_000},
        "news": {"news_sentiment": 0.1, "article_count_7d": 85},
        "social": {"social_volume_24h": 25000, "lc_sentiment": 0.0, "galaxy_score": 10},
        "snapshot": {"governance_risk_score": 1.0, "active_proposals": 2},
        "llm_score": 15.0,
        "llm_reasoning": "CRITICAL: A $55M exploit was just detected by DeFiLlama hacks API. Sentiment has crashed to absolute zero with massive panic volume."
    },
    "rugpull": {
        "tvl": {"tvl_current": 100_000_000, "tvl_delta_24h": -0.80, "tvl_delta_7d": -0.90},
        "liquidations": {"liquidation_volume_24h": 0, "large_liquidations_count": 0},
        "whales": {"net_outflow_24h": 45_000_000, "suspicious_team_transfers": 4, "largest_single_transfer": 20_000_000},
        "github": {"commits_30d": 0, "commits_7d": 0, "open_issues": 150, "days_since_last_release": 140},
        "sentiment": {"sentiment_score": 0.0, "post_count_7d": 2500, "avg_upvotes": 800},
        "security": {"hack_count_90d": 0, "hack_count_180d": 0, "total_lost_90d": 0},
        "news": {"news_sentiment": 0.0, "article_count_7d": 120},
        "social": {"social_volume_24h": 50000, "lc_sentiment": 0.0, "galaxy_score": 5},
        "snapshot": {"governance_risk_score": 0.0, "active_proposals": 0},
        "llm_score": 0.0,
        "llm_reasoning": "FATAL: Massive team wallet outflows detected, GitHub repo is abandoned, TVL dropped 80%. High probability of a hard rug pull."
    }
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

    # We mock all external fetch calls to return our deterministic scenario data
    # We also mock the LLM scorer to ensure stable, predictable testing without burning API credits
    
    async def mock_tvl(*a, **kw): return data["tvl"]
    async def mock_liq(*a, **kw): return data["liquidations"]
    async def mock_whale(*a, **kw): return data["whales"]
    async def mock_gh(*a, **kw): return data["github"]
    async def mock_sent(*a, **kw): return data["sentiment"]
    async def mock_sec(*a, **kw): return data["security"]
    async def mock_news(*a, **kw): return data["news"]
    async def mock_soc(*a, **kw): return data["social"]
    async def mock_snap(*a, **kw): return data["snapshot"]
    
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

    with patch('__main__.fetch_tvl', mock_tvl), \
         patch('__main__.fetch_liquidations', mock_liq), \
         patch('__main__.fetch_whale_moves', mock_whale), \
         patch('__main__.fetch_github_activity', mock_gh), \
         patch('__main__.fetch_reddit_sentiment', mock_sent), \
         patch('__main__.fetch_security_signals', mock_sec), \
         patch('__main__.fetch_news_signals', mock_news), \
         patch('__main__.fetch_social_signals', mock_soc), \
         patch('__main__.fetch_governance_risk', mock_snap), \
         patch('__main__.score_protocol', mock_score):
             
        print("\n[1] Fetching intercepted on-chain signals...")
        raw_onchain = {
            "tvl": await fetch_tvl(protocol),
            "liquidations": await fetch_liquidations(protocol),
            "whales": await fetch_whale_moves(protocol),
        }
        print(f"    Raw On-chain: {raw_onchain}")
        onchain_normalized = normalize_onchain(raw_onchain)
        print(f"    Normalized On-chain (0-1): {onchain_normalized}")

        print("\n[2] Fetching intercepted off-chain signals...")
        raw_offchain = {
            "github": await fetch_github_activity(protocol),
            "sentiment": await fetch_reddit_sentiment(protocol),
            "security": await fetch_security_signals(protocol),
            "news": await fetch_news_signals(protocol),
            "social": await fetch_social_signals(protocol),
            "snapshot": await fetch_governance_risk(protocol),
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
