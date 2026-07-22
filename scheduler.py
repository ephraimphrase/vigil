from apscheduler.schedulers.asyncio import AsyncIOScheduler
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
from db.queries import get_24h_average, get_signal_history, save_health_score, save_signal_history, save_trigger
from execution.keeperhub import execute_rebalance
from config import USER_WALLET

scheduler = AsyncIOScheduler()

PROTOCOLS = ["aave", "compound", "makerdao", "uniswap", "curve", "lido"]

@scheduler.scheduled_job("interval", minutes=15)
async def polling_cycle():
    for protocol in PROTOCOLS:
        print(f"--- Polling {protocol} ---")
        
        # Onchain signals
        raw_onchain = {
            "tvl":          await safe_fetch(fetch_tvl, protocol, "tvl"),
            "liquidations": await safe_fetch(fetch_liquidations, protocol, "liquidations"),
            "whales":       await safe_fetch(fetch_whale_moves, protocol, "whales"),
        }
        onchain_normalized = normalize_onchain(raw_onchain)

        # Offchain signals
        raw_offchain = {
            "github":    await safe_fetch(fetch_github_activity, protocol, "github"),
            "sentiment": await safe_fetch(fetch_reddit_sentiment, protocol, "sentiment"),
            "security":  await safe_fetch(fetch_security_signals, protocol, "security"),
            "news":      await safe_fetch(fetch_news_signals, protocol, "news"),
            "social":    await safe_fetch(fetch_social_signals, protocol, "social"),
            "snapshot":  await safe_fetch(fetch_governance_risk, protocol, "snapshot"),
        }

        history = get_signal_history(protocol, days=90)
        offchain_normalized = normalize_offchain(raw_offchain, protocol, history)

        # Merge signals
        snapshot = {**onchain_normalized, **offchain_normalized, "protocol": protocol}
        
        # Save raw signals to DB for history
        save_signal_history(protocol, offchain_normalized)

        # Scoring
        avg_24h = get_24h_average(protocol)
        health = await score_protocol(snapshot, avg_24h)
        
        save_health_score(protocol, health.score, health.reasoning)
        print(f"Health Score for {protocol}: {health.score} (Delta: {health.delta_from_24h_avg})")

        # Execution check
        trigger = check_delta(health)
        if trigger:
            print(f"[TRIGGER DETECTED] Action: {trigger.action} | Reason: {trigger.reason}")
            try:
                result = await execute_rebalance(trigger, wallet_address=USER_WALLET)
                save_trigger(protocol, trigger.action, trigger.reason, result.get("tx_hash", ""))
            except Exception as e:
                print(f"[ERROR] Execution failed: {e}")
        else:
            print(f"[NOMINAL] No trigger action required.")
