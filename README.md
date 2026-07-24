# Vigil: Autonomous Risk Mitigation System

Vigil is an autonomous protocol risk monitoring and consequence execution system. It continuously tracks off-chain and on-chain data to calculate real-time AI-driven health scores for over 1,000 protocols. If a protocol enters critical risk territory (e.g., smart contract exploit, liquidity crisis, or SEC regulatory action), Vigil automatically connects to **KeeperHub** via an MCP Server to execute emergency withdrawal workflows and pull your funds to safety.

## 🧠 Architecture: The Global Oracle
Instead of relying on rigid, monolithic data scrapers and expensive localized LLM calls, Vigil operates as a **Global Oracle**:
1. **Dynamic Ingestion (The Funnel):** Vigil exposes a schema-less REST endpoint (`/webhook/ingest`). External scripts, KeeperHub workflows, and third-party APIs pump raw metrics (TVL, Twitter Panic, Flashloans) directly into this funnel.
2. **High-Speed Data Bus:** All ingested data is instantly categorized and mapped into a high-speed Redis database (`domain` -> `category` -> `metric`).
3. **The AI Score Engine:** Every 15 minutes, Vigil bundles the entire Redis JSON tree for a protocol and passes it to an LLM (Claude/OpenRouter) to produce a single, unified Health Score (0-100).
4. **Trigger Evaluation:** Users configure Custom Triggers against this Global Score (e.g., *"If Aave drops below 30"*).

## 🚀 The Data Pipelines

### The Fast Lane (Instant)
Critical on-chain metrics where seconds matter.
* **Data Sources:** Binance/Pyth Websockets (Price Ticks), Chainlink (Oracles), DeFiLlama.
* **Mechanism:** Data is streamed instantly into Redis, bypassing the 15-minute cron jobs to provide immediate liquidation and de-peg awareness.

### The Slow Lane (15-Minute Polling)
Fundamental, social, and governance metrics.
* **Data Sources:** Snapshot GraphQL (DAO Proposals), Google News RSS (Headlines), LunarCrush/Santiment (Social Sentiment).
* **Mechanism:** Lightweight Python scripts poll these free APIs and push the data into the Vigil Webhook.

## ⚡ Execution Engine: KeeperHub MCP
When Vigil detects severe negative sentiment (Score < 40), the execution engine (`apps/api/execution/keeperhub.py`) fires:
1. Opens an SSE connection to `https://app.keeperhub.com/mcp`.
2. Authenticates using the `KEEPERHUB_API_KEY`.
3. Discovers available user workflows (e.g., `emergency-withdraw`, `reduce-exposure-50`).
4. Uses an autonomous Agentic Wallet pattern to handle x402 (Payment Challenges) securely and execute the withdrawal on-chain.
5. Employs positive sentiment detection to trigger `re-enter-position` workflows when the protocol fully recovers.

## 🛠 Tech Stack
* **Backend:** FastAPI (Python), `asyncio`
* **State & Caching:** Redis (Real-time data bus), SQLite (Long-term user configurations)
* **LLM Engine:** OpenRouter API (Claude 3.5 Sonnet)
* **Execution:** KeeperHub MCP Server
* **Frontend:** React Dashboard (Work In Progress)

## 🔑 Getting Started (Free Tier Setup)
Vigil is designed to scale across 1,000 protocols with **$0 in API data costs**:
1. Clone the repository.
2. Create `apps/api/.env` and add your required keys:
   * `KEEPERHUB_API_KEY=your_key`
   * `OPENROUTER_API_KEY=your_key`
3. The default ingestion scrapers use 100% free endpoints (DeFiLlama TVL, Snapshot GraphQL, Google News RSS, CoinGecko Batch Pricing).
