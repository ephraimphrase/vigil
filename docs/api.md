# apps/api — scoring backend

A Python/FastAPI service that ingests on-chain and off-chain signals for a
fixed set of DeFi protocols and computes an LLM-generated 0–100 "health
score" for each, persisting the result to Postgres. Run via `uvicorn
main:app --host 0.0.0.0 --port 8000` (or `python main.py`, which does the
same with `reload=True`); deployed to Railway (`railway.toml`).

**Read this section before trusting `apps/api/README.md`**: that file
describes a more complete system than what's actually in _this codebase_ —
a `scheduler.py` background loop, a `simulation/` mock-scenario test
harness, a `routers/webhook/triggers.py` endpoint, and an on-chain
"Execution Layer" that dispatches KeeperHub triggers. **None of those exist
as Python code here.** What's below describes what's actually in this app.

That said, the scheduling and on-chain execution the README describes
**do exist — just not here.** They're configured as a KeeperHub platform
workflow (an external automation/web3 tool), not as code in this repo. See
[`keeperhub.md`](./keeperhub.md) for what that workflow actually does —
read it alongside this file, not instead of it.

## What it does end to end

```
POST /webhook/ingest
        │
        ▼
for each protocol × each registered fetcher (ingestion/):
    provider client (providers/) → raw API call
        │
        ▼
    Signal envelope, cached in Redis + signal_cache/signal_history (Postgres)
        │
        ▼
scoring/scorer.py: rebuild each protocol's signal tree from Redis,
prompt an LLM (via OpenRouter) for {score, reasoning, risk_flags, signals}
        │
        ▼
persisted to Postgres: health_scores, plus per-signal rows
```

There is **no automatic trigger** for this sweep in the current code — no
`scheduler.py`, no cron, no startup `lifespan` hook. It only runs when
something external calls `POST /webhook/ingest`. In this project that
external caller is KeeperHub, on a 15-minute schedule — see
[`keeperhub.md`](./keeperhub.md). Nothing in `apps/api` itself schedules
it; if KeeperHub's workflow is ever paused, this sweep simply stops
running.

## Structure

- **`db/` + `db/models/`** — SQLModel/SQLAlchemy against Postgres
  (`DATABASE_URL`, default `postgresql://vigil:vigil@localhost:5432/vigil`,
  matching root `docker-compose.yml`). `db/models/__init__.py` runs
  `init_db()` (idempotent `create_all`) on import. This app is **the DDL
  source of truth** — `apps/web/db/schema/*.ts` (Drizzle) hand-mirrors these
  tables rather than generating from them, per comments in both places.
  Tables: `protocols` (rich metadata, written by `apps/web`'s own seed
  script, not by this API), `health_scores` (the persisted score/reasoning
  time series — what the frontend ultimately displays), `signal_cache`
  (last-known-good value per protocol/signal, for resilient fallback),
  `signal_history` (raw time series, for moving averages), `strategies`
  (Beefy/Vigil vault strategy metadata), `triggers` (a log of executed
  actions — nothing currently writes to it, since the execution layer
  doesn't exist), and `user_triggers` (user-defined alert conditions —
  its own model comment states plainly: **"Not currently evaluated
  anywhere"**).
- **`ingestion/`** — one fetcher class per signal type (`tvl.py`,
  `liquidations.py`, `whales.py`, `fees.py`, `volume.py`, `yields.py`,
  `github.py`, `sentiment.py`, `security.py`, `news.py`, `social.py`,
  `dao.py`, `market.py`, `typed_signals.py`), each implementing
  `BaseFetcher.fetch()` — never raises, always returns a uniform `Signal`
  envelope (`typedefs/signal.py`). `resilient_fetch.safe_fetch()` wraps
  every fetcher call and falls back to `signal_cache`'s last-known-good
  value on error, so one flaky upstream API doesn't blank out a protocol's
  score inputs. `ingestion/registry.py` is the catalog wiring signal keys to
  fetcher instances (`ONCHAIN_FETCHERS`, `OFFCHAIN_FETCHERS`,
  `TYPED_FETCHERS`) — **`LiquidationsFetcher` is imported but never
  registered in `ONCHAIN_FETCHERS`**, so despite being fully implemented,
  liquidation signals aren't actually part of the live sweep.
- **`providers/`** — thin raw API clients the fetchers call: DeFiLlama
  (TVL/fees/volume/yields/hacks), Etherscan (liquidation logs, via its V2
  multichain endpoint), Ethplorer (token holder concentration, Ethereum
  only), Alchemy, Dune, CoinGecko, GitHub, Reddit (`praw`), LunarCrush,
  NewsAPI, Snapshot.org (DAO governance), and a search-grounded LLM call
  (`search_llm.py`) for signal types with no dedicated API.
- **`routers/webhook/ingest.py`** — the only router that exists.
  `POST /webhook/ingest` runs the full sweep as a `BackgroundTasks` job
  (loop every protocol × every registered fetcher, cache to Redis, then call
  `scoring.scorer.run_scoring_sweep()`), optionally gated by a shared secret
  (`INGEST_WEBHOOK_SECRET`), self-guarding against overlapping runs via a
  Redis status hash. `GET /webhook/ingest/status` reads that hash back.
- **`scoring/scorer.py`** — reconstructs each protocol's cached signals into
  a nested JSON tree, sends it as a prompt (`prompt.py`) to an LLM via
  OpenRouter (`integrations/llm.py`, `AsyncOpenAI` pointed at
  `openrouter.ai`, model configurable via `OPENROUTER_MODEL`), parses back
  `{score, reasoning, risk_flags, signals}`, persists via
  `db/queries.save_health_score`. **Without `OPENROUTER_API_KEY` set, every
  protocol gets a neutral fallback score of 50.0** rather than failing —
  worth knowing if scores look suspiciously uniform in a local setup.
- **`typedefs/signal.py`** — the `Signal` TypedDict envelope and the
  `Literal` unions for valid signal keys/channels, shared across
  `ingestion/`/`scoring/`.

## What's real vs. broken/stubbed (as of this doc)

| Claimed in README                                                                                          | Actual state                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scheduled 15-min auto-ingest                                                                               | **Doesn't exist.** No `scheduler.py`, no `lifespan` hook in `main.py`. Sweep only runs on an external `POST /webhook/ingest`.                                                                                                                                                                                                                                                                                                                             |
| `simulation/` mock-scenario test harness, `run_simulation.py`                                              | **Doesn't exist** in the tree.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `routers/webhook/triggers.py`                                                                              | **Doesn't exist.** Only `ingest.py` is mounted.                                                                                                                                                                                                                                                                                                                                                                                                           |
| "Execution Layer" — score drops dispatch a KeeperHub trigger that calls `HealthOracle.setScore()` on-chain | **Real, but external.** `scoring/delta.py` (Python code that would decide whether to trigger anything from _inside_ this app) imports a nonexistent `execution` package and cannot be imported — that specific module is dead. But the actual on-chain write happens anyway: KeeperHub queries `health_scores` directly via SQL and calls `HealthOracle.setScore()` itself, bypassing `apps/api`'s Python entirely. See [`keeperhub.md`](./keeperhub.md). |

**Practical upshot**: this service computes scores and writes them to
Postgres — full stop, as far as this codebase goes. **No Python code in
`apps/api` writes to `HealthOracle` on-chain**, and that's fine: KeeperHub
does it, reading straight from the same Postgres table. Don't go looking
for a "call setScore" code path inside this app; it was never meant to be
here.

## Relationship to `apps/web`

**Not connected over HTTP at all.** `apps/web` has its own Next.js API
routes (e.g. `apps/web/app/api/protocols/route.ts`) that query the **same
Postgres database directly** via Drizzle (`apps/web/db/client.ts`), reading
tables this API writes (`protocols`, `health_scores`). Both apps'
`.env.example` point at the identical `DATABASE_URL`. The two apps are
decoupled at the network layer and coupled only through the shared Postgres
schema, which `apps/web/db/schema/*.ts` hand-mirrors from
`apps/api/db/models/*.py` — a schema change in one needs a matching manual
edit in the other; nothing keeps them in sync automatically.

## Environment

`apps/api/.env.example` lists only `DATABASE_URL`. The actual `config.py`
reads a fuller set (all optional, all degrade gracefully if unset — see
"fallback to 50.0" above for what that means for scoring specifically):
`GITHUB_TOKEN`, `REDDIT_CLIENT_ID`/`REDDIT_SECRET`, `NEWS_API_KEY`,
`LUNARCRUSH_KEY`, `OPENROUTER_API_KEY` + `OPENROUTER_MODEL`,
`ETHERSCAN_API_KEY`, `ALCHEMY_API_KEY`, `DUNE_API_KEY`, `THEGRAPH_API_KEY`,
`COINGECKO_API_KEY`, `KEEPERHUB_API_KEY`, `INGEST_WEBHOOK_SECRET` (guards
`POST /webhook/ingest`), and `USER_WALLET` (present in config, default zero
address, but — per the "no web3 code" finding above — not actually used to
sign anything). `REDIS_URL` is read separately in
`integrations/redis_client.py` (default `redis://localhost:6380`, matching
`docker-compose.yml`'s non-standard Redis port).
