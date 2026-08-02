from typedefs import RawOffchainSignals, RawOnchainSignals


def normalize_github(raw: dict, protocol: str, history: list[dict]) -> float:
    # We simplified history for the hackathon
    # So we'll do a basic normalization here
    
    velocity_ratio = min(raw.get("commits_30d", 0) / 10.0, 1.0)
    
    push_score = max(0.0, 1.0 - (raw.get("days_since_last_push", 365) / 180))

    # Base score without penalty
    base_score = (velocity_ratio * 0.7) + (push_score * 0.3)
    
    # Apply emergency penalty from Claude analysis (if any)
    penalty = raw.get("emergency_risk_penalty", 0.0)
    final_score = max(0.0, base_score - penalty)
    
    return round(final_score, 4)

def normalize_security(raw: dict) -> float:
    if raw.get("hack_count_90d", 0) >= 2:
        return 0.0
    if raw.get("hack_count_90d", 0) == 1:
        if raw.get("total_lost_90d", 0) > 10_000_000:
            return 0.1
        elif raw.get("total_lost_90d", 0) > 1_000_000:
            return 0.3
        else:
            return 0.5
    if raw.get("hack_count_180d", 0) == 1:
        return 0.7
    return 1.0

def normalize_social(raw: dict, history: list[dict]) -> float:
    # A simple baseline normalization without complex DB rolling avg
    current_volume = raw.get("social_volume_24h", 0)
    
    volume_ratio = min(current_volume / 1000.0, 1.0) # Assume 1000 mentions is healthy
    
    sentiment_component = raw.get("sentiment_score", 0.5)
    galaxy_component    = raw.get("influence_score", 50) / 100.0
    
    raw_score = (
        sentiment_component * 0.4
        + galaxy_component    * 0.3
        + volume_ratio        * 0.3
    )
    
    return round(max(0.0, min(1.0, raw_score)), 4)

def normalize_offchain(raw_offchain: RawOffchainSignals, protocol: str, history: list[dict]) -> dict:
    """
    Takes raw fetched values from all offchain sources.
    Returns a dict of clean 0-1 floats ready for the health scorer.
    """
    github_data = raw_offchain.get("github", {}).get("payload", {})
    sentiment_data = raw_offchain.get("sentiment", {}).get("payload", {})
    snapshot_data = raw_offchain.get("snapshot", {}).get("payload", {})
    security_data = raw_offchain.get("security", {}).get("payload", {})
    news_data = raw_offchain.get("news", {}).get("payload", {})
    social_data = raw_offchain.get("social", {}).get("payload", {})

    return {
        "github_velocity":  normalize_github(github_data, protocol, history),
        "sentiment_score":  sentiment_data.get("sentiment_score", 0.5),
        "governance_risk":  snapshot_data.get("governance_risk_score", 1.0),
        "security_score":   normalize_security(security_data),
        "news_sentiment":   news_data.get("news_sentiment", 0.5),
        "social_score":     normalize_social(social_data, history),
    }

def normalize_onchain(raw_onchain: RawOnchainSignals) -> dict:
    """
    Takes raw fetched values from onchain sources (tvl, liquidations, whales).
    Returns a dict of clean 0-1 floats ready for the health scorer.
    1.0 = highly healthy, 0.0 = critical danger
    """
    # 1. TVL
    tvl_data = raw_onchain.get("tvl", {}).get("payload", {})
    tvl_delta_24h = tvl_data.get("tvl_delta_24h", 0.0)
    # If TVL drops by >20% (-0.20), it's 0.0 health. If it's 0 or positive, 1.0 health.
    tvl_score = max(0.0, min(1.0, 1.0 + (tvl_delta_24h * 5)))

    # 2. Liquidations
    liq_data = raw_onchain.get("liquidations", {}).get("payload", {})
    liq_vol = liq_data.get("liquidation_volume_24h", 0)
    # > $100M liquidations is 0.0. $0 is 1.0.
    liq_score = max(0.0, 1.0 - (liq_vol / 100_000_000.0))

    # 3. Whales
    whale_data = raw_onchain.get("whales", {}).get("payload", {})
    whale_outflow = whale_data.get("net_outflow_24h", 0)
    team_transfers = whale_data.get("suspicious_team_transfers", 0)
    # > $20M outflow is 0.0 health. 
    base_whale = max(0.0, 1.0 - (whale_outflow / 20_000_000.0))
    if team_transfers > 0:
        base_whale = min(base_whale, 0.2) # Hard penalty for team exits

    return {
        "tvl_trend": round(tvl_score, 4),
        "liquidation_health": round(liq_score, 4),
        "whale_activity": round(base_whale, 4)
    }
