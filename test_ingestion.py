import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from ingestion.github import fetch_github_activity
from ingestion.snapshot import fetch_governance_risk
from ingestion.sentiment import fetch_reddit_sentiment
from ingestion.security import fetch_security_signals
from ingestion.news import fetch_news_signals
from ingestion.social import fetch_social_signals
from ingestion.normalizer import normalize_offchain
from ingestion.resilient_fetch import safe_fetch

async def test_offchain_ingestion(protocol: str):
    print(f"Testing offchain ingestion for: {protocol}\n")
    
    print("1. Fetching GitHub activity...")
    github = await safe_fetch(fetch_github_activity, protocol, "github")
    print(github)
    
    print("\n2. Fetching Snapshot Governance risk...")
    snapshot = await safe_fetch(fetch_governance_risk, protocol, "snapshot")
    print(snapshot)
    
    print("\n3. Fetching Reddit sentiment...")
    sentiment = await safe_fetch(fetch_reddit_sentiment, protocol, "sentiment")
    print(sentiment)
    
    print("\n4. Fetching Security events (DeFiLlama Hacks)...")
    security = await safe_fetch(fetch_security_signals, protocol, "security")
    print(security)
    
    print("\n5. Fetching News sentiment...")
    news = await safe_fetch(fetch_news_signals, protocol, "news")
    print(news)
    
    print("\n6. Fetching Social signals (LunarCrush)...")
    social = await safe_fetch(fetch_social_signals, protocol, "social")
    print(social)
    
    raw_offchain = {
        "github": github,
        "snapshot": snapshot,
        "sentiment": sentiment,
        "security": security,
        "news": news,
        "social": social
    }
    
    print("\n--- Normalizing ---")
    normalized = normalize_offchain(raw_offchain, protocol, [])
    print(normalized)

if __name__ == "__main__":
    asyncio.run(test_offchain_ingestion("aave"))
