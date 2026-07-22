import asyncio
from scoring.scorer import score_protocol
from scoring.delta import check_delta

async def test_scoring():
    print("Testing Scoring Engine...")
    
    # Create a mock perfectly healthy snapshot
    healthy_snapshot = {
        "protocol": "aave",
        "tvl_delta_24h": 1.0,
        "liquidation_rate": 1.0,
        "whale_outflow": 1.0,
        "github_velocity": 1.0,
        "sentiment_score": 1.0,
        "governance_risk": 1.0,
        "security_score": 1.0,
        "news_sentiment": 1.0,
        "social_score": 1.0
    }
    
    print("\n--- Testing Healthy Protocol ---")
    healthy_score = await score_protocol(healthy_snapshot, avg_24h=95.0)
    print(f"Score: {healthy_score.score}")
    print(f"Reasoning: {healthy_score.reasoning}")
    print(f"Trigger check: {check_delta(healthy_score)}")

    # Create a mock critical snapshot (simulating an emergency pause)
    critical_snapshot = {
        "protocol": "compound",
        "tvl_delta_24h": 0.3,
        "liquidation_rate": 0.5,
        "whale_outflow": 0.1,
        "github_velocity": 0.2, # Panic commits
        "sentiment_score": 0.1,
        "governance_risk": 0.0, # Emergency pause detected!
        "security_score": 0.5,
        "news_sentiment": 0.0,
        "social_score": 0.2
    }
    
    print("\n--- Testing Critical Protocol ---")
    critical_score = await score_protocol(critical_snapshot, avg_24h=90.0)
    print(f"Score: {critical_score.score}")
    print(f"Reasoning: {critical_score.reasoning}")
    trigger = check_delta(critical_score)
    print(f"Trigger action: {trigger.action if trigger else 'None'}")

if __name__ == "__main__":
    asyncio.run(test_scoring())
