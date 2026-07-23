# Vigil 🛡️

**An autonomous protocol risk monitoring and consequence execution system.**

Vigil is an intelligent background system designed to monitor decentralized finance (DeFi) protocols across both on-chain and off-chain data sources. It uses Large Language Models (LLMs) as autonomous reasoning agents to score protocol health in real-time. If a catastrophic risk event is detected (e.g., a massive liquidation cascade, a team rug pull, or a smart contract exploit), Vigil autonomously executes defensive actions (like emergency withdrawals) by interfacing with the **KeeperHub MCP Server**.

Built for production, Vigil runs as a robust FastAPI backend with asynchronous `APScheduler` polling, a resilient SQLite WAL database, and a professional `unittest.mock` simulation suite for safe testing.

---

## 🏗️ Architecture

1. **Ingestion Engine**: Asynchronously polls multiple data sources every 15 minutes.
   - **On-Chain**: Alchemy (Whale transfers, Liquidation logs), DeFiLlama (TVL metrics).
   - **Off-Chain**: GitHub activity, Reddit Sentiment, Snapshot Governance Risk, Security Hacks.
2. **Normalization**: All raw telemetry is parsed and normalized into standardized `0.0 - 1.0` float boundaries.
3. **AI Health Scorer**: The normalized snapshot is fed to an LLM (via OpenRouter) which acts as the autonomous reasoning agent. It generates a Health Score (0-100) and risk justification.
4. **Execution Layer**: If the health score drops precipitously below the 24-hour moving average, a trigger is fired. Vigil connects to the **KeeperHub MCP Server** to autonomously execute mitigation workflows (e.g., `emergency-withdraw`), intercepting and handling any x402 payment challenges seamlessly.

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

Create a `.env` file in the root directory. You can run Vigil without keys (it will gracefully fall back to neutral zeroes), but to unlock the full AI and on-chain capabilities, add:

```env
# Required for AI Health Scoring
OPENROUTER_API_KEY=your_openrouter_api_key

# Required for On-Chain Telemetry (Whales & Liquidations)
ALCHEMY_API_KEY=your_alchemy_api_key

# Required for Autonomous Execution via KeeperHub MCP
KEEPERHUB_API_KEY=your_keeperhub_api_key
USER_WALLET=0xYourWalletAddress
```

### 3. Run the Production Server

Start the FastAPI application. The `APScheduler` will automatically begin polling protocols in the background.

```bash
python main.py
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
- **Concurrency**: `asyncio`, `APScheduler`
- **Database**: SQLite (Write-Ahead Logging / WAL mode enabled for concurrent I/O)
- **AI / LLMs**: OpenRouter (`openai` async client)
- **Execution**: KeeperHub MCP Server integration (with `tenacity` for resilience)
- **Testing**: Native `unittest.mock` framework

---

*Built for the KeeperHub Agentic Hackathon.*
