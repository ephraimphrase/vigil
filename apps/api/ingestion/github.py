import logging
from datetime import datetime, timedelta
from db.models import Protocol, engine
from providers import coingecko, github as github_api
from ingestion.base_fetcher import BaseFetcher
from sqlmodel import Session

logger = logging.getLogger(__name__)


def _get_protocol_github_config(protocol_id: str) -> tuple[str | None, str | None]:
    """Returns (github_org, coingecko_id) for `protocol_id` - github_org
    is the org half of Protocol.github_repo's "org/repo" slug, or None if
    untracked. coingecko_id falls back to the protocol id itself, same as
    ingestion/market.py's fallback (Protocol.coingecko_id's None
    default) - both None only if the protocol row doesn't exist."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol:
            return None, None
        org = protocol.github_repo.split("/")[0] if protocol.github_repo else None
        return org, (protocol.coingecko_id or protocol_id)


class GithubFetcher(BaseFetcher):
    """
    Ingestion only - raw counters and raw commit messages, aggregated
    across every public, non-fork, non-archived repo in a protocol's org
    rather than a single "core contracts" repo, since a protocol's real
    engineering activity is often spread across SDKs, UI, subgraphs, and
    multiple product repos. Interpreting whether a commit message signals
    an emergency is scoring's job, not this fetcher's; see scoring/ for
    that.

    Falls back to CoinGecko's developer_data (see providers/coingecko.py's
    extract_developer_metadata) when a protocol has no github_repo
    tracked, or the GitHub API call fails - coarser than the primary
    result (CoinGecko tracks whatever single repo is linked to the coin,
    not the whole org), but raw counts rather than nothing.
    """

    key = "github"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        org, coingecko_id = _get_protocol_github_config(protocol_id)

        if org:
            try:
                return await self._fetch_from_github(org)
            except Exception as e:
                logger.warning(f"[WARN] GitHub fetch failed for {protocol_id}, falling back to CoinGecko: {e}")

        if not coingecko_id:
            return {}

        data = await coingecko.get_coin(coingecko_id, developer_data=True)
        return {**coingecko.extract_developer_metadata(data), "source": "coingecko"}

    async def _fetch_from_github(self, org: str) -> dict:
        since_30d = (datetime.utcnow() - timedelta(days=30)).isoformat() + "Z"
        since_7d = (datetime.utcnow() - timedelta(days=7)).isoformat() + "Z"

        repo_activity = await github_api.get_org_activity(org, since_30d, since_7d)
        if not repo_activity:
            return {}

        all_recent_commits: list[dict] = [
            {
                "repo": entry["repo_data"]["full_name"],
                "message": c.get("commit", {}).get("message", ""),
                "date": c.get("commit", {}).get("author", {}).get("date", ""),
            }
            for entry in repo_activity
            for c in entry["commits_30d"]
        ]
        all_recent_commits.sort(key=lambda c: c["date"], reverse=True)

        metadata = [github_api.extract_metadata(entry["repo_data"]) for entry in repo_activity]
        pushed_ats = [_parse_pushed_at(entry["repo_data"].get("pushed_at", "")) for entry in repo_activity]

        return {
            "repo_count":             len(repo_activity),
            "commits_30d":            sum(len(e["commits_30d"]) for e in repo_activity),
            "commits_7d":             sum(len(e["commits_7d"]) for e in repo_activity),
            "days_since_last_push":   _days_since(max((p for p in pushed_ats if p), default=None)),
            "contributor_count":      len({c.get("login") for e in repo_activity for c in e["contributors"] if c.get("login")}),
            "recent_commit_messages": [f"[{c['repo']}] {c['message']}" for c in all_recent_commits[:10]],
            "stars":                 sum(m["stars"] or 0 for m in metadata),
            "forks":                 sum(m["forks"] or 0 for m in metadata),
            "open_issues":           sum(m["open_issues"] or 0 for m in metadata),
            "watchers":              sum(m["watchers"] or 0 for m in metadata),
            "source":                "github",
        }


def _parse_pushed_at(pushed_at: str) -> datetime | None:
    try:
        return datetime.strptime(pushed_at, "%Y-%m-%dT%H:%M:%SZ") if pushed_at else None
    except ValueError:
        return None


def _days_since(pushed_at: datetime | None) -> float:
    """Days since the most recently pushed commit across the org's
    aggregated repos - unlike GitHub Releases, `pushed_at` doesn't depend
    on the maintainers tagging formal releases, so it doesn't misread an
    actively-developed contract repo (which may never cut a release) as
    stale."""
    if not pushed_at:
        return 365.0
    return float((datetime.utcnow() - pushed_at).days)
