from datetime import datetime, timedelta
from db.models import Protocol, engine
from providers import github as github_api
from ingestion.base_fetcher import BaseFetcher
from sqlmodel import Session


def _get_protocol_github_repo(protocol_id: str) -> str | None:
    """Returns the 'org/repo' slug this module polls for `protocol_id`, or None if untracked."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        return protocol.github_repo if protocol else None


class GithubFetcher(BaseFetcher):
    """Ingestion only - raw counters and raw commit messages. Interpreting
    whether a commit message signals an emergency is scoring's job, not
    this fetcher's; see scoring/ for that."""

    key = "github"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        repo = _get_protocol_github_repo(protocol_id)
        if not repo:
            return {}

        since_30d = (datetime.utcnow() - timedelta(days=30)).isoformat() + "Z"
        since_7d = (datetime.utcnow() - timedelta(days=7)).isoformat() + "Z"

        commits_30d = await github_api.get_commits(repo, since_30d)
        commits_7d = await github_api.get_commits(repo, since_7d)
        repo_data = await github_api.get_repo(repo)
        contributors = await github_api.get_contributors(repo)

        recent_commit_messages = [c.get("commit", {}).get("message", "") for c in commits_30d[:10]]

        return {
            **github_api.extract_metadata(repo_data),
            "commits_30d":            len(commits_30d),
            "commits_7d":             len(commits_7d),
            "days_since_last_push":   _days_since_last_push(repo_data),
            "contributor_count":      len(contributors),
            "recent_commit_messages": recent_commit_messages,
        }


def _days_since_last_push(repo_data: dict) -> float:
    """Days since the last commit landed on the repo's default branch -
    unlike GitHub Releases, `pushed_at` doesn't depend on the maintainers
    tagging formal releases, so it doesn't misread an actively-developed
    contract repo (which may never cut a release) as stale."""
    pushed_at = repo_data.get("pushed_at", "")
    if not pushed_at:
        return 365.0
    try:
        pushed = datetime.strptime(pushed_at, "%Y-%m-%dT%H:%M:%SZ")
        return float((datetime.utcnow() - pushed).days)
    except ValueError:
        return 365.0
