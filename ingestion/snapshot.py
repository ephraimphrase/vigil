import httpx
import json
from openai import OpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

llm_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
) if OPENROUTER_API_KEY else None

SNAPSHOT_GRAPHQL_URL = "https://hub.snapshot.org/graphql"

PROTOCOL_SPACES = {
    "aave":      "aave.eth",
    "compound":  "comp-vote.eth",
    "uniswap":   "uniswap",
    "makerdao":  "makerdao.eth",
    "lido":      "lido-snapshot.eth",
    "balancer":  "balancer.eth",
}

def evaluate_emergency_governance(proposals: list) -> float:
    """Uses LLM via OpenRouter to detect emergency pauses or exploit compensation proposals."""
    if not llm_client or not proposals:
        return 1.0 # Safe default
        
    prompt = "Review the following DeFi governance proposals. Are any of them emergency pauses, exploit responses, or freezing of funds? Reply only with a float between 0.0 (CRITICAL EMERGENCY) to 1.0 (NORMAL).\n\n"
    for p in proposals:
        prompt += f"Title: {p.get('title', 'Untitled')}\n"
        
    try:
        response = llm_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=10,
            messages=[{"role": "user", "content": prompt}]
        )
        return float(response.choices[0].message.content.strip())
    except:
        return 1.0

async def fetch_governance_risk(protocol: str) -> dict:
    """
    Innovative Signal: Queries Snapshot's GraphQL API for recent proposals.
    Uses LLM to determine if a recent proposal is an emergency measure 
    (e.g., pausing contracts, emergency upgrades, treasury freezing) which heavily indicates risk.
    """
    space = PROTOCOL_SPACES.get(protocol)
    if not space:
        return {"governance_risk_score": 1.0} # 1.0 means fully healthy

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
        r = await client.post(
            SNAPSHOT_GRAPHQL_URL,
            json={"query": query, "variables": {"space": space}}
        )
        if r.status_code != 200:
            return {"governance_risk_score": 1.0}
            
        data = r.json().get("data", {}).get("proposals", [])
    
    if not data:
        return {"governance_risk_score": 1.0}

    for p in data:
        title = p.get("title", "")
        body_snippet = p.get("body", "")[:200].replace("\n", " ")
        proposals_text.append(f"Title: {title}\nBody: {body_snippet}")

    risk_score = await _analyze_proposals_with_claude(proposals_text, protocol)
    return {"governance_risk_score": risk_score}

async def _analyze_proposals_with_claude(proposals: list[str], protocol: str) -> float:
    if not ANTHROPIC_API_KEY:
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
        response = claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        result = json.loads(response.content[0].text)
        return float(result.get("health_score", 1.0))
    except Exception:
        return 1.0
