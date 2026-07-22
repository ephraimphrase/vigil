# Vigil — Protocol Health Monitor & Autonomous Portfolio Rebalancer
> KeeperHub Hackathon Build Brief | July 27 – August 13, 2026

---

## 1. What It Is

Vigil is an autonomous AI agent that monitors the real-time health of DeFi protocols across thousands of onchain and offchain signals, scores each protocol 0–100 using an LLM, and automatically rebalances your portfolio when a protocol's health deteriorates — executing every transaction through KeeperHub's onchain execution layer.

**The problem it solves:** Retail holders get wrecked because protocol risk is invisible in real time. TVL can collapse, smart contracts can be paused, team wallets can exit, and GitHub activity can go silent — all before a single alert reaches you. By the time you act, it is too late.

**The framing for judges:** This is not a trading bot. It is protocol risk infrastructure with autonomous consequence execution.

---

## 2. Why This Wins

- **Execution depth:** Every health score drop triggers a real KeeperHub transaction — gas estimation, MEV protection, private routing, audit trail, all live
- **AI layer is genuinely novel:** LLM synthesizing qualitative + quantitative protocol signals into a health score, then acting on it with no human in the loop
- **KeeperHub surfaces used:** MCP server, x402, smart gas estimation, MEV protection, audit trail — judges see all of them
- **Real world usefulness is obvious:** Every DeFi holder has this problem right now
- **Demo moment is visceral:** Health score drops, Claude evaluates it, KeeperHub fires the exit transaction, tx hash appears on Etherscan — all in under 60 seconds

---

## 3. Architecture

### Macro Pipeline

```
Onchain signals          Offchain signals
(TVL, liquidations,      (GitHub, sentiment,
whale moves, contracts)  security news, team)
        |                       |
        └──────────┬────────────┘
                   ▼
          Signal aggregator
       (normalize 0–1 per protocol)
                   |
                   ▼
       AI health scoring engine
    (Claude → score 0–100 + reasoning)
                   |
                   ▼
      Portfolio decision engine
    (score delta → rebalance instruction)
                   |
                   ▼
       KeeperHub execution layer
  (gas · MEV protection · retries · audit)
                   |
                   ▼
      Rebalance tx confirmed onchain
```

### Signal Layer (what you monitor per protocol)

**Onchain signals**
- TVL trend (24h and 7d delta via DeFiLlama)
- Liquidation rate (spike detection via Alchemy WebSockets)
- Whale wallet outflows (large exits from treasury + team wallets)
- Smart contract activity (tx volume, error rate, pause events)
- Governance signals (proposal risk, voting participation drops)

**Offchain signals**
- GitHub commit frequency and PR velocity
- Social sentiment (Twitter/Reddit tone analysis)
- Security events (exploit news, audit report changes)
- Team signals (founder wallet activity, team exits)
- Regulatory news (sanctions risk, legal filings)

### Decision Logic

| Health score | Action |
|---|---|
| 80–100 | Hold — no action |
| 60–79 | Reduce position by 25% |
| 40–59 | Reduce position by 50% |
| Below 40 | Full exit |

Score delta threshold: if a protocol drops more than 15 points from its 24h rolling average, a TriggerEvent is emitted regardless of absolute score.

### KeeperHub surfaces used

| Surface | How Vigil uses it |
|---|---|
| MCP server | Agent calls execution natively from FastAPI |
| x402 / MPP | Payment routing per rebalance execution |
| Smart gas estimation | Adapts to congestion automatically |
| Private routing | MEV protection on all rebalance transactions |
| Audit trail | Full execution log — trigger reason, score, tx hash, timestamp |
| Gas sponsorship | Mainnet demo without burning ETH |

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.11) |
| Scheduler | APScheduler |
| Onchain data | Alchemy (RPC + WebSockets + Transfers API) |
| Protocol TVL | DeFiLlama API (free, no key needed) |
| Dev activity | GitHub REST API |
| AI scoring | Claude API (claude-sonnet-4-6) |
| Execution | KeeperHub MCP server |
| Storage | SQLite (dev) → Postgres (prod) |
| Frontend | React + recharts |
| Testnet | Sepolia (dev) → Ethereum mainnet (demo) |

---

## 5. Folder Structure

```
vigil/
├── ingestion/
│   ├── tvl.py              # DeFiLlama TVL poller
│   ├── liquidations.py     # Alchemy WebSocket liquidation listener
│   ├── whales.py           # Large wallet outflow tracker
│   ├── github.py           # Dev commit velocity fetcher
│   └── normalizer.py       # 0–1 signal normalization per protocol
├── scoring/
│   ├── prompt.py           # Health scoring system prompt
│   ├── scorer.py           # Claude API call + JSON parse
│   └── delta.py            # Score delta tracker + TriggerEvent emitter
├── execution/
│   ├── decision.py         # Score → rebalance instruction mapper
│   ├── keeperhub.py        # KeeperHub MCP server integration
│   └── adapter.py          # TriggerAdapter base class (modular)
├── dashboard/
│   └── main.jsx            # React frontend
├── db/
│   └── models.py           # SQLite schema + query helpers
├── scheduler.py            # APScheduler wiring (15 min polling)
└── main.py                 # FastAPI app entry point
```

---

## 6. Core Code Scaffolds

### TriggerAdapter base class (`execution/adapter.py`)
Build this first. It is the pattern that makes the escrow startup reuse the same execution engine.

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal

@dataclass
class TriggerEvent:
    protocol: str
    score: float
    delta: float
    action: Literal["reduce_25", "reduce_50", "exit"]
    reason: str

class TriggerAdapter(ABC):
    @abstractmethod
    async def detect(self) -> TriggerEvent | None:
        ...
```

### Signal snapshot model (`db/models.py`)

```python
from pydantic import BaseModel
from datetime import datetime

class SignalSnapshot(BaseModel):
    protocol: str
    timestamp: datetime
    tvl_delta_24h: float        # normalized 0–1
    liquidation_rate: float     # normalized 0–1
    whale_outflow: float        # normalized 0–1
    github_velocity: float      # normalized 0–1
    sentiment_score: float      # normalized 0–1

class HealthScore(BaseModel):
    protocol: str
    timestamp: datetime
    score: float                # 0–100
    reasoning: str
    risk_flags: list[str]
    delta_from_24h_avg: float
```

### Health scoring prompt (`scoring/prompt.py`)

```python
SYSTEM_PROMPT = """
You are a DeFi protocol health analyst. You will receive a normalized signal 
snapshot for a protocol (all values 0–1, where 1 = healthy and 0 = critical).

Return ONLY valid JSON in this exact format:
{
  "score": <integer 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "risk_flags": ["<flag1>", "<flag2>"]
}

Scoring guide:
- 80-100: Healthy. All signals nominal.
- 60-79: Caution. One or more signals degrading.
- 40-59: Elevated risk. Multiple signals in danger zone.
- 0-39: Critical. Immediate exit consideration warranted.

Weight signals in this order: whale_outflow > liquidation_rate > tvl_delta_24h 
> github_velocity > sentiment_score.
"""

def build_user_prompt(snapshot: dict) -> str:
    return f"Protocol: {snapshot['protocol']}\nSignals: {snapshot}"
```

### Claude scorer (`scoring/scorer.py`)

```python
import anthropic
import json
from .prompt import SYSTEM_PROMPT, build_user_prompt

client = anthropic.Anthropic()

async def score_protocol(snapshot: dict) -> dict:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": build_user_prompt(snapshot)
        }]
    )
    raw = response.content[0].text
    return json.loads(raw)
```

### Score delta tracker (`scoring/delta.py`)

```python
from .adapter import TriggerEvent
from db.models import HealthScore

DELTA_THRESHOLD = -15.0

def check_delta(latest: HealthScore, avg_24h: float) -> TriggerEvent | None:
    delta = latest.score - avg_24h
    if delta > DELTA_THRESHOLD:
        return None

    if latest.score < 40:
        action = "exit"
    elif latest.score < 60:
        action = "reduce_50"
    else:
        action = "reduce_25"

    return TriggerEvent(
        protocol=latest.protocol,
        score=latest.score,
        delta=delta,
        action=action,
        reason=latest.reasoning
    )
```

### KeeperHub integration (`execution/keeperhub.py`)

```python
# Wire this to KeeperHub MCP server
# Exact method names depend on KeeperHub MCP server docs
# Read: https://docs.keeperhub.com/ai-tools/mcp-server

async def execute_rebalance(event: TriggerEvent, wallet_address: str) -> dict:
    # 1. Build the rebalance workflow via KeeperHub MCP
    # 2. KeeperHub handles gas estimation, MEV protection, retries
    # 3. Returns tx hash + audit trail reference
    pass
```

### APScheduler wiring (`scheduler.py`)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from ingestion.tvl import fetch_tvl
from ingestion.liquidations import fetch_liquidations
from ingestion.whales import fetch_whale_moves
from ingestion.github import fetch_github_activity
from ingestion.normalizer import normalize
from scoring.scorer import score_protocol
from scoring.delta import check_delta
from execution.keeperhub import execute_rebalance

scheduler = AsyncIOScheduler()

PROTOCOLS = [
    "aave", "compound", "makerdao", "uniswap", "curve"
    # expand to top 100+ after MVP is stable
]

@scheduler.scheduled_job("interval", minutes=15)
async def polling_cycle():
    for protocol in PROTOCOLS:
        raw_signals = {
            "tvl": await fetch_tvl(protocol),
            "liquidations": await fetch_liquidations(protocol),
            "whales": await fetch_whale_moves(protocol),
            "github": await fetch_github_activity(protocol),
        }
        snapshot = normalize(raw_signals, protocol)
        health = await score_protocol(snapshot)
        avg_24h = get_24h_average(protocol)  # from SQLite
        trigger = check_delta(health, avg_24h)
        if trigger:
            await execute_rebalance(trigger, wallet_address=USER_WALLET)
```

---

## 7. Offchain Signal Implementation — Full Guide

Offchain signals are the hardest part of the ingestion layer because there is no single API that gives you everything. Each signal category needs its own data source, its own normalization logic, and its own failure fallback. This section covers every offchain signal in detail — what to fetch, where to get it, how to normalize it to 0–1, and how to handle failures.

### How offchain signals fit the pipeline

```
offchain signal source          raw value         normalized (0–1)
─────────────────────────────────────────────────────────────────
GitHub REST API           →  commit count/week  →  github_velocity
Reddit PRAW + Claude      →  sentiment text     →  sentiment_score
DeFiLlama Hacks API       →  hack count/90d     →  security_score
NewsAPI + Claude          →  headline tone      →  news_sentiment
LunarCrush API            →  social volume      →  social_volume
                                    │
                                    ▼
                          normalizer.py (all signals)
                                    │
                                    ▼
                          SignalSnapshot per protocol
                                    │
                                    ▼
                          Claude health scorer
```

All five offchain signals collapse into normalized floats before they reach the scorer. Claude never sees raw API responses — only clean 0–1 values alongside the onchain signals.

---

### Signal 1 — GitHub dev activity (`ingestion/github.py`)

**What it measures:** How actively developers are working on the protocol. A sudden drop in commit frequency, a spike in unresolved critical issues, or a collapse in contributor count are all early warning signs that a team is abandoning a project before the market knows it.

**API:** GitHub REST API. Free with a personal access token (5,000 requests/hour authenticated vs 60 unauthenticated — always authenticate).

**Protocol → repo mapping:** You need to maintain a registry manually. There is no API that maps "aave" to its GitHub org. Start with 10–15 protocols and expand.

```python
# ingestion/github.py

import httpx
from datetime import datetime, timedelta
from config import GITHUB_TOKEN

PROTOCOL_REPOS = {
    "aave":      "aave/aave-v3-core",
    "compound":  "compound-finance/compound-protocol",
    "uniswap":   "Uniswap/v3-core",
    "curve":     "curvefi/curve-contract",
    "makerdao":  "makerdao/dss",
    "balancer":  "balancer-labs/balancer-v2-monorepo",
    "yearn":     "yearn/yearn-vaults",
    "lido":      "lidofinance/lido-dao",
    "frax":      "FraxFinance/frax-solidity",
    "convex":    "convex-finance/convex-platform",
}

HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"}

async def fetch_github_activity(protocol: str) -> dict:
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
        commits_30d = len(commits_r.json()) if commits_r.status_code == 200 else 0

        # Commits in last 7 days (velocity signal)
        commits_7d_r = await client.get(
            f"https://api.github.com/repos/{repo}/commits",
            params={"since": since_7d, "per_page": 100},
            headers=HEADERS
        )
        commits_7d = len(commits_7d_r.json()) if commits_7d_r.status_code == 200 else 0

        # Open issues count
        repo_r = await client.get(
            f"https://api.github.com/repos/{repo}",
            headers=HEADERS
        )
        repo_data = repo_r.json() if repo_r.status_code == 200 else {}
        open_issues = repo_data.get("open_issues_count", 0)

        # Recent releases (check if protocol is actively shipping)
        releases_r = await client.get(
            f"https://api.github.com/repos/{repo}/releases",
            params={"per_page": 5},
            headers=HEADERS
        )
        releases = releases_r.json() if releases_r.status_code == 200 else []
        days_since_last_release = _days_since_last_release(releases)

    return {
        "commits_30d":              commits_30d,
        "commits_7d":               commits_7d,
        "open_issues":              open_issues,
        "days_since_last_release":  days_since_last_release,
    }

def _days_since_last_release(releases: list) -> float:
    if not releases:
        return 365.0  # no releases = maximum staleness
    latest = releases[0].get("published_at", "")
    if not latest:
        return 365.0
    published = datetime.strptime(latest, "%Y-%m-%dT%H:%M:%SZ")
    return (datetime.utcnow() - published).days

def _empty_github_signal() -> dict:
    return {
        "commits_30d": 0,
        "commits_7d": 0,
        "open_issues": 0,
        "days_since_last_release": 365.0
    }
```

**Normalization logic for GitHub signals:**

```python
def normalize_github(raw: dict, protocol: str, history: list[dict]) -> float:
    """
    Returns a single 0–1 score for developer health.
    1.0 = highly active, 0.0 = completely dead.
    Compare against protocol's own 90-day rolling average, not an absolute scale.
    A protocol with 2 commits/month dropping to 0 is as alarming as
    one with 200 commits/month dropping to 10.
    """
    avg_commits_30d = _get_rolling_avg(history, "commits_30d", window_days=90)

    # Commit velocity ratio: current vs historical average
    if avg_commits_30d == 0:
        velocity_ratio = 0.0 if raw["commits_30d"] == 0 else 1.0
    else:
        velocity_ratio = min(raw["commits_30d"] / avg_commits_30d, 1.5) / 1.5

    # Release recency: penalize stale releases
    release_score = max(0.0, 1.0 - (raw["days_since_last_release"] / 180))

    # 7d momentum: is activity accelerating or decelerating?
    expected_7d = raw["commits_30d"] / 4  # expected weekly if evenly distributed
    momentum = min(raw["commits_7d"] / expected_7d, 2.0) / 2.0 if expected_7d > 0 else 0.5

    return round((velocity_ratio * 0.5) + (release_score * 0.3) + (momentum * 0.2), 4)
```

---

### Signal 2 — Social sentiment (`ingestion/sentiment.py`)

**What it measures:** Community mood around the protocol — panic, FUD, celebration, or apathy. A sudden spike in negative sentiment often precedes price action and protocol stress by hours.

**Strategy:** Pull Reddit posts from relevant subreddits using PRAW (free, no approval needed for read access). Then use Claude to score the sentiment rather than a dedicated NLP library. This is better than VADER or TextBlob because Claude understands crypto-specific context — "rug", "drain", "exploit", "exit liquidity" all carry specific meaning that generic sentiment models miss.

**API:** Reddit via PRAW (free). Claude API for classification (already in your stack).

```python
# ingestion/sentiment.py

import praw
import anthropic
import json
from config import REDDIT_CLIENT_ID, REDDIT_SECRET, ANTHROPIC_API_KEY

reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_SECRET,
    user_agent="vigil-health-monitor/1.0"
)
claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

PROTOCOL_SUBREDDITS = {
    "aave":     ["Aave", "defi"],
    "compound": ["compound_finance", "defi"],
    "uniswap":  ["Uniswap", "defi"],
    "curve":    ["defi"],
    "makerdao": ["MakerDAO", "defi"],
    "lido":     ["defi"],
    "yearn":    ["defi"],
}

async def fetch_reddit_sentiment(protocol: str) -> dict:
    subreddits = PROTOCOL_SUBREDDITS.get(protocol, ["defi"])
    posts = []

    for sub_name in subreddits:
        try:
            sub = reddit.subreddit(sub_name)
            results = list(sub.search(protocol, time_filter="week", limit=15, sort="new"))
            posts.extend(results)
        except Exception:
            continue

    if not posts:
        return {"sentiment_score": 0.5, "post_count": 0}  # neutral fallback

    # Take top 10 most relevant posts, combine title + snippet
    samples = []
    for p in posts[:10]:
        snippet = p.title
        if p.selftext:
            snippet += ". " + p.selftext[:150]
        samples.append(snippet)

    sentiment_score = await _score_sentiment_with_claude(samples, protocol)

    return {
        "sentiment_score": sentiment_score,
        "post_count_7d":   len(posts),
        "avg_upvotes":     sum(p.score for p in posts) / len(posts)
    }

async def _score_sentiment_with_claude(texts: list[str], protocol: str) -> float:
    joined = "\n".join(f"- {t}" for t in texts)
    prompt = f"""You are analyzing community sentiment about the {protocol} DeFi protocol.

Here are recent posts and discussions from the past 7 days:
{joined}

Return ONLY valid JSON with no other text:
{{"sentiment": <float 0.0-1.0>, "summary": "<max 10 words>"}}

Where:
0.0 = extreme panic, FUD, exploit fears, or mass exodus
0.5 = neutral, mixed, or low activity
1.0 = extremely positive, strong community confidence

Pay special attention to crypto-specific risk language: rug, drain, exploit, 
exit liquidity, team gone, contract paused, funds at risk."""

    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    result = json.loads(response.content[0].text)
    return float(result["sentiment"])
```

**Rate limit note:** PRAW is limited to 60 requests/minute. For 15-minute polling cycles across 10 protocols, you are well within limits. Cache the result per protocol per cycle — do not re-fetch mid-cycle.

---

### Signal 3 — Security events (`ingestion/security.py`)

**What it measures:** Whether the protocol has been hacked, exploited, or flagged for vulnerabilities in the last 90 days. A recent hack is the single strongest negative signal — weight it heavily in normalization.

**Primary API:** DeFiLlama Hacks endpoint — completely free, no key, returns all historical DeFi hacks with protocol name, amount lost, and date. This is the cleanest source.

**Secondary:** Rekt.news RSS feed for narrative context (optional, used for Claude classification).

```python
# ingestion/security.py

import httpx
from datetime import datetime, timedelta
import anthropic
import json
from config import ANTHROPIC_API_KEY

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
DEFILLAMA_HACKS_URL = "https://defillama.com/api/hacks"

# Cache the hacks list globally — it does not change frequently
_hacks_cache: list = []
_hacks_cache_timestamp: datetime | None = None
CACHE_TTL_HOURS = 6

async def fetch_security_signals(protocol: str) -> dict:
    hacks = await _get_hacks_list()
    cutoff_90d = datetime.utcnow() - timedelta(days=90)
    cutoff_180d = datetime.utcnow() - timedelta(days=180)

    def matches(hack: dict) -> bool:
        name = hack.get("name", "").lower()
        return protocol.lower() in name or name in protocol.lower()

    def parse_date(hack: dict) -> datetime:
        ts = hack.get("date", 0)
        return datetime.utcfromtimestamp(ts) if ts else datetime.min

    recent_hacks_90d  = [h for h in hacks if matches(h) and parse_date(h) > cutoff_90d]
    recent_hacks_180d = [h for h in hacks if matches(h) and parse_date(h) > cutoff_180d]
    total_lost_90d    = sum(h.get("amountCryptocurrencies", 0) for h in recent_hacks_90d)

    return {
        "hack_count_90d":  len(recent_hacks_90d),
        "hack_count_180d": len(recent_hacks_180d),
        "total_lost_90d":  total_lost_90d,  # in USD
    }

async def _get_hacks_list() -> list:
    global _hacks_cache, _hacks_cache_timestamp
    now = datetime.utcnow()
    if (
        _hacks_cache_timestamp
        and (now - _hacks_cache_timestamp).total_seconds() < CACHE_TTL_HOURS * 3600
    ):
        return _hacks_cache

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(DEFILLAMA_HACKS_URL)
        if r.status_code == 200:
            _hacks_cache = r.json()
            _hacks_cache_timestamp = now

    return _hacks_cache
```

**Normalization for security signals:**

```python
def normalize_security(raw: dict) -> float:
    """
    Returns 0–1 where 1.0 = no recent security events, 0.0 = recent major exploit.
    This is an inverted signal — more hacks = lower score.
    """
    if raw["hack_count_90d"] >= 2:
        return 0.0  # multiple recent exploits = critical
    if raw["hack_count_90d"] == 1:
        if raw["total_lost_90d"] > 10_000_000:  # > $10M lost
            return 0.1
        elif raw["total_lost_90d"] > 1_000_000:  # > $1M lost
            return 0.3
        else:
            return 0.5  # small exploit, some concern
    if raw["hack_count_180d"] == 1:
        return 0.7  # exploit over 90 days ago, fading risk
    return 1.0  # no recent security events
```

---

### Signal 4 — News sentiment (`ingestion/news.py`)

**What it measures:** How the protocol is being covered in crypto and financial media. Negative news coverage — regulatory actions, team scandals, technical failures — precedes community panic and TVL outflows.

**API:** NewsAPI.org (free tier: 100 requests/day, 1 month history). Sufficient for 10–15 protocols at 15-minute polling if you cache aggressively.

```python
# ingestion/news.py

import httpx
import anthropic
import json
from datetime import datetime, timedelta
from config import NEWS_API_KEY, ANTHROPIC_API_KEY

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
NEWS_BASE = "https://newsapi.org/v2/everything"

# Cache per protocol — refresh every 2 hours to conserve API quota
_news_cache: dict[str, dict] = {}

async def fetch_news_signals(protocol: str) -> dict:
    cached = _news_cache.get(protocol)
    if cached and (datetime.utcnow() - cached["timestamp"]).seconds < 7200:
        return cached["data"]

    from_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(NEWS_BASE, params={
            "q":        f'"{protocol}" DeFi OR "decentralized finance"',
            "from":     from_date,
            "sortBy":   "relevancy",
            "pageSize": 20,
            "apiKey":   NEWS_API_KEY,
            "language": "en",
        })
        articles = r.json().get("articles", []) if r.status_code == 200 else []

    if not articles:
        result = {"news_sentiment": 0.5, "article_count_7d": 0}
        _news_cache[protocol] = {"data": result, "timestamp": datetime.utcnow()}
        return result

    headlines = [
        f"{a['title']}. {a.get('description', '')[:100]}"
        for a in articles[:12]
        if a.get("title")
    ]

    sentiment = await _classify_news_with_claude(headlines, protocol)

    result = {
        "news_sentiment":   sentiment,
        "article_count_7d": len(articles),
    }
    _news_cache[protocol] = {"data": result, "timestamp": datetime.utcnow()}
    return result

async def _classify_news_with_claude(headlines: list[str], protocol: str) -> float:
    joined = "\n".join(f"- {h}" for h in headlines)
    prompt = f"""Analyze these news headlines about the {protocol} DeFi protocol.

{joined}

Return ONLY valid JSON with no other text:
{{"sentiment": <float 0.0-1.0>, "key_risk": "<max 8 words or null>"}}

Where:
0.0 = major negative coverage (exploit, SEC action, team exit, insolvency risk)
0.5 = neutral or mixed coverage
1.0 = strongly positive coverage (partnerships, growth, audits passed)"""

    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    result = json.loads(response.content[0].text)
    return float(result["sentiment"])
```

**API quota management:** NewsAPI free tier gives 100 requests/day. With 15 protocols refreshed every 2 hours, that is 15 × 12 = 180 requests/day — over the limit. Solutions: reduce polling to every 4 hours for news (it changes slowly), or upgrade to the $449/month Developer plan, or use Google News RSS (completely free) as a fallback.

**Google News RSS fallback (no API key needed):**

```python
import feedparser

async def fetch_google_news_rss(protocol: str) -> list[str]:
    query = f"{protocol} DeFi".replace(" ", "+")
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    feed = feedparser.parse(url)  # pip install feedparser
    return [entry.title for entry in feed.entries[:10]]
```

---

### Signal 5 — Social volume (`ingestion/social.py`)

**What it measures:** Raw volume of social mentions and engagement. A sudden spike can mean either positive attention or FUD spreading — combine with sentiment to distinguish. A sudden silence (volume drops to near zero) is its own warning signal.

**API:** LunarCrush API. They have a free community tier that gives social volume, galaxy score, and sentiment for crypto assets. Sign up at lunarcrush.com.

```python
# ingestion/social.py

import httpx
from config import LUNARCRUSH_KEY

LUNARCRUSH_BASE = "https://lunarcrush.com/api4/public/coins"

PROTOCOL_SYMBOLS = {
    "aave":     "AAVE",
    "compound": "COMP",
    "uniswap":  "UNI",
    "curve":    "CRV",
    "makerdao": "MKR",
    "lido":     "LDO",
    "yearn":    "YFI",
    "balancer": "BAL",
    "frax":     "FXS",
    "convex":   "CVX",
}

async def fetch_social_signals(protocol: str) -> dict:
    symbol = PROTOCOL_SYMBOLS.get(protocol)
    if not symbol:
        return _empty_social()

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{LUNARCRUSH_BASE}/{symbol.lower()}/v1",
            headers={"Authorization": f"Bearer {LUNARCRUSH_KEY}"}
        )
        if r.status_code != 200:
            return _empty_social()
        data = r.json().get("data", {})

    return {
        "social_volume_24h": data.get("social_volume_24h", 0),
        "galaxy_score":      data.get("galaxy_score", 50),       # LunarCrush 0–100
        "lc_sentiment":      data.get("sentiment", 3) / 5,       # normalize 1–5 → 0–1
        "social_dominance":  data.get("social_dominance", 0),    # % of total crypto social
    }

def _empty_social() -> dict:
    return {
        "social_volume_24h": 0,
        "galaxy_score":      50,
        "lc_sentiment":      0.5,
        "social_dominance":  0,
    }
```

**Normalization for social signals:**

```python
def normalize_social(raw: dict, history: list[dict]) -> float:
    """
    High volume + positive sentiment = high score.
    High volume + negative sentiment = low score.
    Near-zero volume = moderate negative (suspicious silence).
    """
    avg_volume = _get_rolling_avg(history, "social_volume_24h", window_days=30)
    current_volume = raw["social_volume_24h"]

    # Volume deviation from baseline
    if avg_volume == 0:
        volume_ratio = 0.5
    else:
        volume_ratio = min(current_volume / avg_volume, 3.0) / 3.0

    # Suspicious silence: if volume drops to < 10% of average, flag it
    silence_penalty = 0.3 if (avg_volume > 0 and current_volume < avg_volume * 0.1) else 0.0

    sentiment_component = raw["lc_sentiment"]
    galaxy_component    = raw["galaxy_score"] / 100

    raw_score = (
        sentiment_component * 0.4
        + galaxy_component    * 0.3
        + volume_ratio        * 0.3
    ) - silence_penalty

    return round(max(0.0, min(1.0, raw_score)), 4)
```

---

### Offchain normalizer — combining all five signals (`ingestion/normalizer.py`)

```python
# ingestion/normalizer.py

from .github    import normalize_github
from .sentiment import normalize_sentiment
from .security  import normalize_security
from .news      import normalize_news
from .social    import normalize_social

def normalize_offchain(raw_offchain: dict, protocol: str, history: list[dict]) -> dict:
    """
    Takes raw fetched values from all offchain sources.
    Returns a dict of clean 0–1 floats ready for the health scorer.
    """
    return {
        "github_velocity":  normalize_github(raw_offchain["github"], protocol, history),
        "sentiment_score":  raw_offchain["sentiment"]["sentiment_score"],
        "security_score":   normalize_security(raw_offchain["security"]),
        "news_sentiment":   raw_offchain["news"]["news_sentiment"],
        "social_score":     normalize_social(raw_offchain["social"], history),
    }
```

---

### Failure handling strategy

Every offchain API can and will fail — rate limits, downtime, network errors. The rule: **never let a failed API call stop the scoring cycle.** Fall back to the last known good value. If there is no last known good value, fall back to 0.5 (neutral) so the scorer does not penalize a protocol simply because an API was unavailable.

```python
# ingestion/resilient_fetch.py

import sqlite3
from datetime import datetime

DB_PATH = "db/vigil.sqlite"

async def safe_fetch(fetch_fn, protocol: str, signal_key: str, fallback: float = 0.5):
    """
    Wraps any fetch function with a fallback to last known good value.
    """
    try:
        result = await fetch_fn(protocol)
        _store_last_good(protocol, signal_key, result)
        return result
    except Exception as e:
        print(f"[WARN] {signal_key} fetch failed for {protocol}: {e}")
        last_good = _get_last_good(protocol, signal_key)
        return last_good if last_good is not None else fallback

def _store_last_good(protocol: str, key: str, value):
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "INSERT OR REPLACE INTO signal_cache (protocol, key, value, updated_at) VALUES (?, ?, ?, ?)",
        (protocol, key, str(value), datetime.utcnow().isoformat())
    )
    con.commit()
    con.close()

def _get_last_good(protocol: str, key: str):
    con = sqlite3.connect(DB_PATH)
    row = con.execute(
        "SELECT value FROM signal_cache WHERE protocol = ? AND key = ? ORDER BY updated_at DESC LIMIT 1",
        (protocol, key)
    ).fetchone()
    con.close()
    return float(row[0]) if row else None
```

---

### Updated scheduler showing full offchain integration (`scheduler.py`)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from ingestion.tvl          import fetch_tvl
from ingestion.liquidations import fetch_liquidations
from ingestion.whales       import fetch_whale_moves
from ingestion.github       import fetch_github_activity
from ingestion.sentiment    import fetch_reddit_sentiment
from ingestion.security     import fetch_security_signals
from ingestion.news         import fetch_news_signals
from ingestion.social       import fetch_social_signals
from ingestion.normalizer   import normalize_offchain
from ingestion.resilient_fetch import safe_fetch
from scoring.scorer         import score_protocol
from scoring.delta          import check_delta
from execution.keeperhub    import execute_rebalance
from db.queries             import get_24h_average, get_signal_history

scheduler = AsyncIOScheduler()

PROTOCOLS = ["aave", "compound", "makerdao", "uniswap", "curve", "lido"]

@scheduler.scheduled_job("interval", minutes=15)
async def polling_cycle():
    for protocol in PROTOCOLS:

        # Onchain signals (every cycle)
        onchain = {
            "tvl":          await safe_fetch(fetch_tvl, protocol, "tvl"),
            "liquidations": await safe_fetch(fetch_liquidations, protocol, "liquidations"),
            "whales":       await safe_fetch(fetch_whale_moves, protocol, "whales"),
        }

        # Offchain signals (some are cached internally and refresh less often)
        raw_offchain = {
            "github":    await safe_fetch(fetch_github_activity, protocol, "github"),
            "sentiment": await safe_fetch(fetch_reddit_sentiment, protocol, "sentiment"),
            "security":  await safe_fetch(fetch_security_signals, protocol, "security"),
            "news":      await safe_fetch(fetch_news_signals, protocol, "news"),
            "social":    await safe_fetch(fetch_social_signals, protocol, "social"),
        }

        history = get_signal_history(protocol, days=90)
        offchain_normalized = normalize_offchain(raw_offchain, protocol, history)

        snapshot = {**onchain, **offchain_normalized, "protocol": protocol}

        health  = await score_protocol(snapshot)
        avg_24h = get_24h_average(protocol)
        trigger = check_delta(health, avg_24h)

        if trigger:
            await execute_rebalance(trigger, wallet_address=USER_WALLET)
```

---

### Offchain polling frequency guide

Not all offchain signals need to update every 15 minutes. This matters for API quotas and cost.

| Signal | Recommended refresh | Rationale |
|---|---|---|
| Reddit sentiment | Every 30 min | Community mood shifts over hours, not minutes |
| GitHub activity | Every 2 hours | Commit frequency is a slow-moving signal |
| Security events | Every 6 hours | DeFiLlama hacks list updates infrequently |
| News sentiment | Every 2 hours | NewsAPI quota constraint |
| Social volume | Every 30 min | Can spike fast during events |

Implement this with APScheduler by registering separate jobs at different intervals rather than bundling everything into one 15-minute cycle.

---

### Additional pip dependencies for offchain signals

```bash
pip install praw feedparser lunarcrush
```

Add to your `requirements.txt`:
```
praw>=7.7.0
feedparser>=6.0.10
httpx>=0.27.0
anthropic>=0.30.0
tenacity>=8.3.0
```

---

### Offchain API keys summary

| Signal | API | Key needed | Cost | Quota |
|---|---|---|---|---|
| GitHub dev activity | api.github.com | Yes (PAT) | Free | 5,000 req/hr |
| Reddit sentiment | reddit.com/api | Yes (app creds) | Free | 60 req/min |
| Security events | defillama.com/api/hacks | No | Free | Unlimited |
| News sentiment | newsapi.org | Yes | Free tier | 100 req/day |
| News fallback | Google News RSS | No | Free | Unlimited |
| Social volume | lunarcrush.com/api4 | Yes | Free tier | 10 req/min |

Reddit app credentials: go to reddit.com/prefs/apps → create app → script type. You get a client_id and client_secret instantly.

---

## 8. API Keys and Resources You Need

| Resource | Where to get it | Cost |
|---|---|---|
| KeeperHub account | keeperhub.com | Free (beta) |
| KeeperHub MCP docs | docs.keeperhub.com/ai-tools/mcp-server | — |
| Alchemy API key | alchemy.com | Free tier sufficient |
| Etherscan API key | etherscan.io/apis | Free tier sufficient |
| DeFiLlama API | defillama.com/docs/api | Free, no key needed |
| GitHub API token | github.com/settings/tokens | Free |
| Anthropic API key | console.anthropic.com | Pay per token |
| Sepolia ETH | sepoliafaucet.com | Free |
| Sepolia USDC | faucet.circle.com | Free |

---

## 8. Build Timeline

### Before July 27 (do this now)
- [ ] Scaffold FastAPI project with folder structure above
- [ ] Create KeeperHub account, read MCP server docs end to end
- [ ] Get Alchemy API key (Sepolia + Mainnet apps)
- [ ] Fire first test transaction on Sepolia through KeeperHub — this is mandatory before the clock starts

### Week 1: July 27 – Aug 1 (data ingestion layer)
- [ ] `ingestion/tvl.py` — DeFiLlama TVL poller
- [ ] `ingestion/liquidations.py` — Alchemy WebSocket listener
- [ ] `ingestion/whales.py` — large outflow tracker
- [ ] `ingestion/github.py` — commit velocity fetcher
- [ ] `ingestion/normalizer.py` — 0–1 normalization + SQLite storage
- [ ] Verify all five signal streams are producing data before moving on

### Week 2: Aug 2 – Aug 6 (AI scoring engine)
- [ ] `scoring/prompt.py` — iterate on the health scoring prompt until outputs are sensible
- [ ] `scoring/scorer.py` — Claude API integration with JSON parsing
- [ ] `scoring/delta.py` — score delta tracker + TriggerEvent emission
- [ ] `execution/decision.py` — score → rebalance instruction mapper
- [ ] Unit test the scorer on 5 real protocol snapshots manually

### Week 3: Aug 7 – Aug 10 (KeeperHub execution layer)
- [ ] `execution/keeperhub.py` — MCP server connection and workflow creation
- [ ] Define rebalance workflow in KeeperHub workflow builder
- [ ] Test full trigger → execution loop on Sepolia end to end
- [ ] Pull audit trail data and store locally
- [ ] Add retry logic with tenacity

### Buffer: Aug 11 – Aug 12 (dashboard + demo)
- [ ] `dashboard/main.jsx` — health score table, sparklines, tx history
- [ ] End-to-end stress test with 3+ protocols simultaneously
- [ ] Record 2-min Sepolia demo video
- [ ] Write UX teardown document for the $500 bounty (document friction points during build)

### Submission day: Aug 13 (hard deadline 12:00 UTC+2)
- [ ] Fire mainnet transaction using KeeperHub gas sponsorship
- [ ] Copy Etherscan tx hash
- [ ] Submit on DoraHacks — frame as protocol risk infrastructure, not trading bot
- [ ] Submit UX bounty document separately (stackable with grand prize)

---

## 9. Submission Framing (important)

**Do not call it a trading bot.** Call it:
> An autonomous protocol risk monitoring and consequence execution system

**Lead with the problem in your submission:**
> Retail DeFi holders get wrecked because protocol health deteriorates invisibly. TVL collapses, smart contracts get paused, team wallets exit, GitHub activity dies — all before a single alert reaches anyone. By the time a human acts, the damage is done.

**Then the solution:**
> Vigil monitors 5+ real-time signal categories per protocol, synthesizes them into a continuous health score using an LLM, and autonomously executes protective rebalancing through KeeperHub the moment risk crosses a threshold. No human in the loop. No delayed alerts. Irreversible, auditable, onchain.

**The proof:**
> Link the mainnet tx hash. Show the KeeperHub audit trail. Let the judges see the score that triggered it and the reasoning Claude produced.

---

## 10. The Shared Architecture with Escrow Startup

This is important: the execution engine you build for Vigil is reusable for the AI Bounty Escrow startup. The TriggerAdapter pattern makes this explicit.

```
Vigil (hackathon)                  AI Bounty Escrow (startup)
HealthScoreDetector                ClaimMonitor
    extends TriggerAdapter             extends TriggerAdapter
        |                                  |
        └──────────── KeeperHub ───────────┘
                   (same execution layer)
```

When you pivot to the startup after the hackathon, you keep:
- KeeperHub integration (identical)
- Audit trail reader (identical)
- TriggerEvent schema (identical)
- Retry logic (identical)

You swap only:
- Signal fetchers → GitHub PR monitor + proof ingester
- Scorer → LLM claim evaluator
- Decision engine → approve/reject + escrow release instruction

One engine. Two products.

---

## 11. First Three Commands to Run Right Now

```bash
mkdir vigil && cd vigil
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn apscheduler web3 httpx anthropic pydantic aiohttp tenacity
```

---

## 12. Key Links

- KeeperHub MCP docs: https://docs.keeperhub.com/ai-tools/mcp-server
- KeeperHub agentic wallet: https://docs.keeperhub.com/ai-tools/agentic-wallet
- DeFiLlama API: https://defillama.com/docs/api
- Alchemy: https://alchemy.com
- Circle Sepolia USDC faucet: https://faucet.circle.com
- Anthropic SDK: https://docs.anthropic.com
- Hackathon submission: https://dorahacks.io
- Sepolia faucet: https://sepoliafaucet.com

---

*Built for the KeeperHub hackathon, July–August 2026. Stack: FastAPI · Claude API · KeeperHub MCP · Alchemy · DeFiLlama · React.*
