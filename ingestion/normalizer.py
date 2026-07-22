def normalize_github(raw: dict, protocol: str, history: list[dict]) -> float:
    # We simplified history for the hackathon
    # So we'll do a basic normalization here
    
    velocity_ratio = min(raw.get("commits_30d", 0) / 10.0, 1.0)
    
    release_score = max(0.0, 1.0 - (raw.get("days_since_last_release", 365) / 180))
    
    # Base score without penalty
    base_score = (velocity_ratio * 0.7) + (release_score * 0.3)
    
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
    
    sentiment_component = raw.get("lc_sentiment", 0.5)
    galaxy_component    = raw.get("galaxy_score", 50) / 100.0
    
    raw_score = (
        sentiment_component * 0.4
        + galaxy_component    * 0.3
        + volume_ratio        * 0.3
    )
    
    return round(max(0.0, min(1.0, raw_score)), 4)

def normalize_offchain(raw_offchain: dict, protocol: str, history: list[dict]) -> dict:
    """
    Takes raw fetched values from all offchain sources.
    Returns a dict of clean 0-1 floats ready for the health scorer.
    """
    return {
        "github_velocity":  normalize_github(raw_offchain.get("github", {}), protocol, history),
        "sentiment_score":  raw_offchain.get("sentiment", {}).get("sentiment_score", 0.5),
        "governance_risk":  raw_offchain.get("snapshot", {}).get("governance_risk_score", 1.0),
        "security_score":   normalize_security(raw_offchain.get("security", {})),
        "news_sentiment":   raw_offchain.get("news", {}).get("news_sentiment", 0.5),
        "social_score":     normalize_social(raw_offchain.get("social", {}), history),
    }
