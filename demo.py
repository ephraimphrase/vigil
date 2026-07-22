import asyncio
import os
import sys

from dotenv import load_dotenv
load_dotenv()

# Override flags
import ingestion.whales
import ingestion.liquidations
import scoring.scorer
ingestion.whales.DEMO_OVERRIDE_WHALES = True
ingestion.liquidations.DEMO_OVERRIDE_LIQUIDATIONS = True
scoring.scorer.DEMO_OVERRIDE_SCORER = True

from ingestion.tvl import fetch_tvl
from ingestion.liquidations import fetch_liquidations
from ingestion.whales import fetch_whale_moves
from ingestion.github import fetch_github_activity
from ingestion.sentiment import fetch_reddit_sentiment
from ingestion.security import fetch_security_signals
from ingestion.news import fetch_news_signals
from ingestion.social import fetch_social_signals
from ingestion.snapshot import fetch_governance_risk
from ingestion.normalizer import normalize_offchain, normalize_onchain
from ingestion.resilient_fetch import safe_fetch
from scoring.scorer import score_protocol
from scoring.delta import check_delta
from execution.keeperhub import execute_rebalance
from db.queries import get_24h_average, save_health_score, save_signal_history, save_trigger
from config import USER_WALLET

async def run_demo():
    protocol = "aave"
    print("=" * 60)
    print(f"🚨 VIGIL END-TO-END DEMO 🚨")
    print(f"Target Protocol: {protocol.upper()}")
    print("=" * 60)
    print("\n[1] Fetching simulated critical on-chain signals (Whale exits & Liquidations)...")
    
    # Onchain signals
    raw_onchain = {
        "tvl":          await safe_fetch(fetch_tvl, protocol, "tvl"),
        "liquidations": await safe_fetch(fetch_liquidations, protocol, "liquidations"),
        "whales":       await safe_fetch(fetch_whale_moves, protocol, "whales"),
    }
    
    print(f"    Raw Whales: {raw_onchain['whales']}")
    print(f"    Raw Liquidations: {raw_onchain['liquidations']}")
    
    onchain_normalized = normalize_onchain(raw_onchain)
    print(f"    Normalized On-chain (0-1): {onchain_normalized}")

    print("\n[2] Fetching off-chain signals...")
    raw_offchain = {
        "github":    await safe_fetch(fetch_github_activity, protocol, "github"),
        "sentiment": await safe_fetch(fetch_reddit_sentiment, protocol, "sentiment"),
        "security":  await safe_fetch(fetch_security_signals, protocol, "security"),
        "news":      await safe_fetch(fetch_news_signals, protocol, "news"),
        "social":    await safe_fetch(fetch_social_signals, protocol, "social"),
        "snapshot":  await safe_fetch(fetch_governance_risk, protocol, "snapshot"),
    }
    
    offchain_normalized = normalize_offchain(raw_offchain, protocol, [])
    # For demo output brevity
    print(f"    Normalized Off-chain (0-1): [Retrieved and normalized]")

    snapshot = {**onchain_normalized, **offchain_normalized, "protocol": protocol}
    
    print("\n[3] Triggering AI Health Scorer (Claude/OpenRouter)...")
    # For demo, we force the avg to be 85 so a drop triggers a massive delta
    avg_24h = 85.0 
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
    asyncio.run(run_demo())
