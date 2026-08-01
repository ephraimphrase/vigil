import httpx
import json
from datetime import datetime, timedelta
from config import GITHUB_TOKEN, OPENROUTER_MODEL
from db.queries import get_protocol_github_repo
from typedefs import Signal
from integrations.llm import llm_client

HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}


async def fetch_github_activity(protocol: str) -> Signal:
    repo = get_protocol_github_repo(protocol)
    if not repo:
        return _empty_github_signal()

    async with httpx.AsyncClient(timeout=10) as client:
        commits_30d = await _fetch_commits(client, repo, days=30)
        commits_7d = await _fetch_commits(client, repo, days=7)
        repo_meta = await _fetch_repo_metadata(client, repo)
        releases = await _fetch_releases(client, repo)

        commit_messages = [c.get("commit", {}).get("message", "") for c in commits_30d[:10]]
        emergency_risk = await _check_emergency_commits(commit_messages, protocol) if commit_messages else 0.0

    return {
        "commits_30d":              len(commits_30d),
        "commits_7d":               len(commits_7d),
        "open_issues":              repo_meta.get("open_issues_count", 0),
        "forks":                    repo_meta.get("forks_count", 0),
        "stars":                    repo_meta.get("stargazers_count", 0),
        "watchers":                 repo_meta.get("subscribers_count", 0),
        "days_since_last_release":  _days_since_last_release(releases),
        "emergency_risk_penalty":   emergency_risk,  # 0.0 = no emergency, 1.0 = high emergency
    }


async def _fetch_commits(client: httpx.AsyncClient, repo: str, days: int) -> list:
    """Commits pushed to `repo` in the last `days` days."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"
    r = await client.get(
        f"https://api.github.com/repos/{repo}/commits",
        params={"since": since, "per_page": 100},
        headers=HEADERS
    )
    data = r.json() if r.status_code == 200 else []
    return data if isinstance(data, list) else []


async def _fetch_repo_metadata(client: httpx.AsyncClient, repo: str) -> dict:
    """Repo-level counters: open issues, forks, stars, watchers - one call, all free together."""
    r = await client.get(f"https://api.github.com/repos/{repo}", headers=HEADERS)
    data = r.json() if r.status_code == 200 else {}
    return data if isinstance(data, dict) else {}


async def _fetch_releases(client: httpx.AsyncClient, repo: str) -> list:
    """Most recent releases, newest first."""
    r = await client.get(
        f"https://api.github.com/repos/{repo}/releases",
        params={"per_page": 5},
        headers=HEADERS
    )
    data = r.json() if r.status_code == 200 else []
    return data if isinstance(data, list) else []


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


def _empty_github_signal() -> Signal:
    return {
        "commits_30d": 0,
        "commits_7d": 0,
        "open_issues": 0,
        "forks": 0,
        "stars": 0,
        "watchers": 0,
        "days_since_last_release": 365.0,
        "emergency_risk_penalty": 0.0,
    }
