# Vigil 🛡️

**An autonomous protocol risk monitoring and consequence execution system.**

Vigil is an intelligent background system designed to monitor decentralized finance (DeFi) protocols across both on-chain and off-chain data sources. It uses Large Language Models (LLMs) as autonomous reasoning agents to score protocol health in real-time. If a catastrophic risk event is detected (e.g., a massive liquidation cascade, a team rug pull, or a smart contract exploit), Vigil autonomously executes defensive actions (like emergency withdrawals) by interfacing with the **KeeperHub MCP Server**.

Built for production, Vigil runs as a FastAPI backend with a custom `asyncio` scheduler (`scheduler.py`) polling every 15 minutes, a PostgreSQL database (via SQLModel) plus Redis as the live signal cache the scorer reads from, and a `unittest.mock` simulation suite for safe testing.

---

## 🏗️ Architecture

1. **Ingestion Engine** (`ingestion/`, `providers/`): Asynchronously polls every registered fetcher for every protocol every 15 minutes (`POST /webhook/ingest`, auto-triggered by `scheduler.py`).
   - **On-Chain**: DeFiLlama (TVL + funding/hallmark history, fees, DEX volume, yield pools, hacks), Ethplorer (holder concentration - free, Ethereum mainnet only), Etherscan (liquidation event logs - optional, needs `ETHERSCAN_API_KEY`).
   - **Off-Chain**: GitHub commit/repo activity (falls back to CoinGecko developer data if no `github_repo` tracked or the GitHub call fails), Reddit sentiment (falls back to CoinGecko community data), LunarCrush social metrics (same CoinGecko fallback), NewsAPI + Google News RSS fallback, CoinGecko market data, Snapshot.org DAO governance proposals.
2. **Scoring** (`scoring/scorer.py`): Each fetcher's raw payload lands in Redis under `vigil:data:{protocol}:{channel}:{key}`; `routers/webhook/ingest.py`'s `run_scoring_sweep` reconstructs that into one nested JSON tree per protocol and sends it directly to an LLM (via OpenRouter) as the prompt - there's no separate 0.0-1.0 normalization step in the live path (that only exists in `simulation/normalizer.py`, used by the mock scenario harness below, not the real pipeline). The LLM returns a Health Score (0-100) and a reasoning string.
3. **Execution Layer**: `scoring/delta.py`'s `check_delta` decides whether a score drop (>15 points below the 24h moving average, or an absolute score under 60) warrants a KeeperHub trigger, and `routers/webhook/triggers.py` dispatches it via the **KeeperHub MCP Server** (e.g. `emergency-withdraw`), intercepting and handling any x402 payment challenges seamlessly. **Not yet wired into the live scoring path** - `check_delta` is currently only called from `run_simulation.py`'s mock harness below; a real ingest/score cycle computes and stores a score but doesn't yet decide to trigger anything from it.

---

## 🚀 Quickstart

### 1. Installation

Requires Python 3.10+

```bash
# Clone the repository
git clone https://github.com/ephraimphrase/vigil.git
cd vigil

# Create and activate a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

Also needs Postgres and Redis running (`docker-compose.yml` has both). Create a `.env` file with `DATABASE_URL` and, optionally, `REDIS_URL` (defaults to `redis://localhost:6380`, matching `docker-compose.yml`'s non-standard host port). Every fetcher degrades gracefully to an empty payload when its key is missing, so you can run Vigil with none of these set - each key below just unlocks one signal:

```env
DATABASE_URL=postgresql://vigil:vigil@localhost:5432/vigil

# AI Health Scoring - without this, scoring falls back to a neutral 50.0
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-sonnet-5   # check openrouter.ai/api/v1/models - model slugs get retired

# On-chain: liquidations (ingestion/liquidations.py). Not needed for whales
# (ingestion/whales.py runs on Ethplorer's public "freekey", no key needed)
# or TVL/fees/volume/yields (all DeFiLlama, no key needed).
ETHERSCAN_API_KEY=your_etherscan_api_key

# Off-chain: GitHub repo activity, sentiment/social (LunarCrush), news
# (NewsAPI - falls back to Google News RSS if unset), market data
# (CoinGecko - works keyless too, just at a lower rate limit)
GITHUB_TOKEN=your_github_token
LUNARCRUSH_KEY=your_lunarcrush_key
NEWS_API_KEY=your_newsapi_key
COINGECKO_API_KEY=your_coingecko_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_SECRET=your_reddit_secret

# Governance proposal data (providers/dao.py, Snapshot.org's GraphQL gateway)
THEGRAPH_API_KEY=your_thegraph_studio_key

# Required for Autonomous Execution via KeeperHub MCP (see Execution Layer
# above - not yet wired into the live scoring path)
KEEPERHUB_API_KEY=your_keeperhub_api_key
USER_WALLET=0xYourWalletAddress
```

### 3. Run the Production Server

Start the FastAPI application. `main.py`'s `lifespan` hook starts `scheduler.py`'s ingest+score loop in the background on startup, running immediately and then every 15 minutes.

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The REST API will be available at `http://localhost:8000`.
- **GET `/api/protocols`**: Returns current health scores for all monitored protocols.
- **GET `/api/triggers`**: Returns recent KeeperHub execution hashes.

---

## 🔬 Simulation Suite

To safely test the autonomous execution engine without risking funds or waiting for a real crypto market crash, Vigil includes a production-grade Simulation Suite. 

The suite uses `unittest.mock` to seamlessly intercept network calls from the production pipeline and inject predefined market data dynamically.

Run a simulation from the terminal:

```bash
python run_simulation.py --scenario cascade --protocol aave
```

### Available Scenarios:
- `nominal`: Healthy TVL, no hacks, positive sentiment, no whale exits.
- `cascade`: TVL drops 30%, massive on-chain liquidations, negative social sentiment.
- `exploit`: DeFiLlama hacks API reports a $55M exploit, Reddit sentiment crashes.
- `rugpull`: Massive whale outflows from team wallets, GitHub repo goes silent, TVL drains.

---

## 🛠️ Tech Stack

- **Framework**: FastAPI (Python)
- **Concurrency**: `asyncio` - a custom scheduler loop (`scheduler.py`), not APScheduler
- **Database**: PostgreSQL via SQLModel/SQLAlchemy, with Redis as the live signal cache `routers/webhook/ingest.py` reads back into a tree for scoring
- **AI / LLMs**: OpenRouter (`openai` async client)
- **Execution**: KeeperHub MCP Server integration (with `tenacity` for resilience) - see the Execution Layer note above on what's actually wired in
- **Testing**: Native `unittest.mock` framework

---

*Built for the KeeperHub Agentic Hackathon.*
