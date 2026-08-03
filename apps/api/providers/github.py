"""
Raw GitHub API client - "how to talk to GitHub" lives here, separate from
what ingestion/github.py's GithubFetcher does with the response.
"""

import asyncio
import httpx
from config import GITHUB_TOKEN

BASE_URL = "https://api.github.com"
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}


async def get_org_repos(org: str) -> list[dict]:
    """
    Every repo under `org` (all pages, not just the first 100), sorted by
    most-recently-pushed first - same shape as get_repo()'s payload, one
    entry per repo. GitHub's org/user distinction isn't knowable up front
    from a name alone, so this tries /orgs/{org}/repos first and falls
    back to /users/{org}/repos (a repo "owner" that's a person rather
    than an org) on 404.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        repos = await _get_all_pages(client, f"{BASE_URL}/orgs/{org}/repos")
        if repos is None:  # 404 - not an org, try as a user-owned account
            repos = await _get_all_pages(client, f"{BASE_URL}/users/{org}/repos")
        return repos or []


async def _get_all_pages(client: httpx.AsyncClient, url: str) -> list[dict] | None:
    """Walks every page of a paginated GitHub list endpoint. Returns None
    on a 404 (distinct from an empty list, which is a real "no repos")."""
    results: list[dict] = []
    page = 1
    while True:
        r = await client.get(
            url, params={"sort": "pushed", "direction": "desc", "per_page": 100, "type": "public", "page": page},
            headers=HEADERS,
        )
        if r.status_code == 404:
            return None
        if r.status_code != 200:
            break
        batch = r.json()
        if not isinstance(batch, list) or not batch:
            break
        results.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return results


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


async def get_org_activity(org: str, since_30d: str, since_7d: str) -> list[dict]:
    """
    Raw per-repo activity for every active (non-fork, non-archived) repo
    in `org`: the repo's own metadata plus its 30d/7d commits and
    contributors, one dict per repo. Every repo's three calls run
    concurrently (asyncio.gather), and every repo runs concurrently with
    every other repo - so a large org (Aave's, e.g.) doesn't cost
    active_repo_count * ~0.3s serialized. No aggregation across repos -
    that's ingestion/github.py's job.
    """
    org_repos = await get_org_repos(org)
    active_repos = [r for r in org_repos if not r.get("fork") and not r.get("archived")]

    async def _repo_activity(repo_data: dict) -> dict:
        full_name = repo_data["full_name"]
        commits_30d, commits_7d, contributors = await asyncio.gather(
            get_commits(full_name, since_30d),
            get_commits(full_name, since_7d),
            get_contributors(full_name),
        )
        return {
            "repo_data": repo_data,
            "commits_30d": commits_30d,
            "commits_7d": commits_7d,
            "contributors": contributors,
        }

    return list(await asyncio.gather(*(_repo_activity(r) for r in active_repos)))


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
