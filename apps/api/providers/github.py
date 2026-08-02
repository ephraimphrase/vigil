"""
Raw GitHub API client - "how to talk to GitHub" lives here, separate from
what ingestion/github.py's GithubFetcher does with the response.
"""

import httpx
from config import GITHUB_TOKEN

BASE_URL = "https://api.github.com"
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}


async def get_repo(repo: str) -> dict:
    """
    Full /repos/{repo} payload - counters (stars, forks, watchers, open
    issues), activity timestamps (created_at, updated_at, pushed_at),
    language, license, topics, description, homepage, default branch,
    archived/disabled flags, and more.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE_URL}/repos/{repo}", headers=HEADERS)
        data = r.json() if r.status_code == 200 else {}
        return data if isinstance(data, dict) else {}


async def get_commits(repo: str, since: str) -> list[dict]:
    """
    /repos/{repo}/commits since a given ISO8601 timestamp - each commit
    has sha, commit.message, commit.author, html_url, etc.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE_URL}/repos/{repo}/commits",
            params={"since": since, "per_page": 100},
            headers=HEADERS
        )
        data = r.json() if r.status_code == 200 else []
        return data if isinstance(data, list) else []


async def get_contributors(repo: str) -> list[dict]:
    """/repos/{repo}/contributors - each has login, contributions count.
    A rough bus-factor/team-size signal. GitHub returns 202 (still
    computing stats) for repos it hasn't cached contributor stats for yet
    - treated the same as empty rather than retried."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE_URL}/repos/{repo}/contributors",
            params={"per_page": 100, "anon": "false"},
            headers=HEADERS
        )
        data = r.json() if r.status_code == 200 else []
        return data if isinstance(data, list) else []


# Every scalar/simple field worth surfacing from a get_repo() payload.
_METADATA_KEYS = (
    "full_name", "description", "homepage", "language", "topics",
    "default_branch", "created_at", "updated_at", "pushed_at", "size",
    "archived", "disabled", "visibility",
)


def extract_metadata(data: dict) -> dict:
    """Pulls every extractable field off a get_repo() payload - raw
    pass-through/counts only, no interpretation (that's scoring's job)."""
    metadata = {k: data.get(k) for k in _METADATA_KEYS}
    metadata["license_name"] = (data.get("license") or {}).get("name")
    metadata["open_issues"] = data.get("open_issues_count", 0)
    metadata["forks"] = data.get("forks_count", 0)
    metadata["stars"] = data.get("stargazers_count", 0)
    metadata["watchers"] = data.get("subscribers_count", 0)
    return metadata
