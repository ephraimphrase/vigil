import httpx
import json
from openai import AsyncOpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL
from ingestion.schemas import GovernanceSignal

# Use AsyncOpenAI so governance analysis is non-blocking
llm_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
) if OPENROUTER_API_KEY else None

SNAPSHOT_GRAPHQL_URL = "https://hub.snapshot.org/graphql"

# Space IDs verified live against hub.snapshot.org on 2026-07-22
# aave.eth is stale — active space is aavedao.eth
# uniswap is stale — active space is uniswapgovernance.eth
# makerdao.eth has no proposals — MakerDAO/Sky moved to on-chain governance (excluded)
PROTOCOL_SPACES = {
    "aave":      "aavedao.eth",
    "compound":  "comp-vote.eth",
    "uniswap":   "uniswapgovernance.eth",
    "lido":      "lido-snapshot.eth",
    "balancer":  "balancer.eth",
}

_SAFE_DEFAULT: GovernanceSignal = {"governance_risk_score": 1.0}  # 1.0 = fully healthy


async def fetch_governance_risk(protocol: str) -> GovernanceSignal:
    """
    Innovative Signal: Queries Snapshot's GraphQL API for recent proposals.
    Uses LLM to determine if a recent proposal is an emergency measure 
    (e.g., pausing contracts, emergency upgrades, treasury freezing) which heavily indicates risk.
    """
    space = PROTOCOL_SPACES.get(protocol)
    if not space:
        return _SAFE_DEFAULT.copy()

    query = """
    query Proposals($space: String!) {
      proposals(
        first: 5,
        skip: 0,
        where: { space: $space },
        orderBy: "created",
        orderDirection: desc
      ) {
        id
        title
        body
        state
      }
    }
    """

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.post(
                SNAPSHOT_GRAPHQL_URL,
                json={"query": query, "variables": {"space": space}}
            )
            if r.status_code != 200:
                return _SAFE_DEFAULT.copy()
            proposals_raw = r.json().get("data", {}).get("proposals", [])
        except Exception as e:
            print(f"[WARN] Snapshot fetch failed for {protocol}: {e}")
            return _SAFE_DEFAULT.copy()

    if not proposals_raw:
        return _SAFE_DEFAULT.copy()

    # Build text summaries — this is the missing variable that caused the NameError
    proposals_text = []
    for p in proposals_raw:
        title = p.get("title", "Untitled")
        body_snippet = (p.get("body") or "")[:200].replace("\n", " ")
        proposals_text.append(f"Title: {title}\nBody: {body_snippet}")

    risk_score = await _analyze_proposals_with_llm(proposals_text, protocol)
    return {"governance_risk_score": risk_score}


async def _analyze_proposals_with_llm(proposals: list[str], protocol: str) -> float:
    """Uses OpenRouter LLM to classify Snapshot governance proposals for emergency risk."""
    if not llm_client:
        return 1.0

    joined = "\n\n".join(proposals)
    prompt = f"""You are a risk analyst for {protocol}. Analyze these recent governance proposals from Snapshot.

{joined}

Return ONLY valid JSON:
{{"health_score": <float 0.0-1.0>}}

Scoring Guide:
1.0 = Normal governance (grants, parameter tweaks, standard upgrades)
0.5 = Elevated risk (arguments over treasury, controversial forks)
0.0 = Emergency governance (emergency pause, freezing assets, compensating exploit victims)
"""
    try:
        response = await llm_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        result = json.loads(response.choices[0].message.content)
        score = float(result.get("health_score", 1.0))
        # Clamp to valid range
        return max(0.0, min(1.0, score))
    except Exception:
        return 1.0
