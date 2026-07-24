import httpx
import json
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from config import GITHUB_TOKEN, OPENROUTER_API_KEY, OPENROUTER_MODEL
from ingestion.schemas import GithubSignal

PROTOCOL_REPOS = {
    "aave":      "aave/aave-v3-core",
    "compound":  "compound-finance/compound-protocol",
    "uniswap":   "Uniswap/v3-core",
    "curve":     "curvefi/curve-contract",
    "makerdao":  "makerdao/dss",
    "balancer":  "balancer-labs/balancer-v2-monorepo",
    "yearn":     "yearn/yearn-vaults",
    "lido":      "lidofinance/lido-dao",
}

HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}

# Use AsyncOpenAI so we can properly await in async functions
llm_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
) if OPENROUTER_API_KEY else None


async def fetch_github_activity(protocol: str) -> GithubSignal:
    repo = PROTOCOL_REPOS.get(protocol)
    if not repo:
        return _empty_github_signal()

    since_30d = (datetime.utcnow() - timedelta(days=30)).isoformat() + "Z"
    since_7d  = (datetime.utcnow() - timedelta(days=7)).isoformat() + "Z"

    async with httpx.AsyncClient(timeout=10) as client:
        # Commits in last 30 days
        commits_r = await client.get(
            f"https://api.github.com/repos/{repo}/commits",
            params={"since": since_30d, "per_page": 100},
            headers=HEADERS
        )
        commits_data = commits_r.json() if commits_r.status_code == 200 else []
        if not isinstance(commits_data, list):
            commits_data = []
        commits_30d = len(commits_data)

        # Emergency commit check using OpenRouter LLM
        commit_messages = [c.get("commit", {}).get("message", "") for c in commits_data[:10]]
        emergency_risk = await _check_emergency_commits(commit_messages, protocol) if commit_messages else 0.0

        # Commits in last 7 days (velocity signal)
        commits_7d_r = await client.get(
            f"https://api.github.com/repos/{repo}/commits",
            params={"since": since_7d, "per_page": 100},
            headers=HEADERS
        )
        commits_7d_data = commits_7d_r.json() if commits_7d_r.status_code == 200 else []
        commits_7d = len(commits_7d_data) if isinstance(commits_7d_data, list) else 0

        # Open issues count
        repo_r = await client.get(
            f"https://api.github.com/repos/{repo}",
            headers=HEADERS
        )
        repo_data = repo_r.json() if repo_r.status_code == 200 else {}
        if not isinstance(repo_data, dict):
            repo_data = {}
        open_issues = repo_data.get("open_issues_count", 0)

        # Recent releases
        releases_r = await client.get(
            f"https://api.github.com/repos/{repo}/releases",
            params={"per_page": 5},
            headers=HEADERS
        )
        releases = releases_r.json() if releases_r.status_code == 200 else []
        if not isinstance(releases, list):
            releases = []
        days_since_last_release = _days_since_last_release(releases)

    return {
        "commits_30d":              commits_30d,
        "commits_7d":               commits_7d,
        "open_issues":              open_issues,
        "days_since_last_release":  days_since_last_release,
        "emergency_risk_penalty":   emergency_risk,  # 0.0 = no emergency, 1.0 = high emergency
    }


async def _check_emergency_commits(messages: list[str], protocol: str) -> float:
    """Uses OpenRouter LLM to detect panic commits (emergency pauses, exploit patches, etc.)."""
    if not llm_client:
        return 0.0

    joined = "\n".join(f"- {m}" for m in messages)
    prompt = f"""Analyze these recent commit messages from the {protocol} protocol repository.
    
{joined}

Return ONLY valid JSON with no other text:
{{"emergency_risk": <float 0.0-1.0>}}

0.0 = Normal development (features, minor bug fixes, chores)
0.5 = Moderate concern (hotfixes, security patches, deprecations)
1.0 = Extreme panic (emergency pause, drain prevention, hotfix for active exploit, rescue funds)
"""
    try:
        response = await llm_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        result = json.loads(response.choices[0].message.content)
        return float(result.get("emergency_risk", 0.0))
    except Exception:
        return 0.0


def _days_since_last_release(releases: list) -> float:
    if not releases or not isinstance(releases, list):
        return 365.0
    latest = releases[0].get("published_at", "")
    if not latest:
        return 365.0
    try:
        published = datetime.strptime(latest, "%Y-%m-%dT%H:%M:%SZ")
        return float((datetime.utcnow() - published).days)
    except ValueError:
        return 365.0


def _empty_github_signal() -> GithubSignal:
    return {
        "commits_30d": 0,
        "commits_7d": 0,
        "open_issues": 0,
        "days_since_last_release": 365.0,
        "emergency_risk_penalty": 0.0,
    }
