# KeeperHub MCP Integration - UX Teardown

As part of building **Vigil** (an autonomous AI protocol health monitor and portfolio rebalancer), I integrated the KeeperHub MCP server for on-chain execution. This document details the friction points, developer experience (DX) wins, and UX improvements identified during the hackathon.

## 1. The Good (DX Wins)
- **Standardized MCP Interface**: Using the MCP server pattern is a massive win. Being able to use a standard `.call_tool()` format completely abstracts away the gnarly web3 complexities of gas estimation and ABI encoding.
- **Retry & State Management**: Delegating MEV protection, private routing, and tx retries to KeeperHub rather than handling it inside our FastAPI loop saved at least 15 hours of engineering time.
- **The Audit Trail**: The built-in execution log returning a clean timestamp and tx_hash makes building a transparent frontend extremely easy.

## 2. Friction Points & UX Flaws

### 2.1 Lack of Local Testing / Dry-Run Tools
**The Problem:** The MCP server expects to fire real transactions. During development, testing our AI scoring logic against the execution engine was terrifying. I had to build a complete mock of the KeeperHub execute function just to safely test the TriggerEvents.
**The Solution:** KeeperHub desperately needs a `--dry-run` or `simulate: true` flag in the tool payload that returns a simulated tx_hash and gas estimate without actually broadcasting to Sepolia or Mainnet.

### 2.2 Unclear Error Surfacing
**The Problem:** When an MCP execution fails (e.g., due to an RPC node timeout or insufficient funds in the agentic wallet), the error object returned is highly generic (e.g., `ExecutionFailed`).
**The Solution:** The server should return strongly typed error codes (e.g., `ERR_INSUFFICIENT_GAS`, `ERR_MEV_BLOCK_TIMEOUT`) so the calling AI agent can attempt self-healing (like lowering the rebalance amount and retrying).

### 2.3 Obscure Parameter Naming
**The Problem:** In the docs, the execution payload requires mapping complex strings for actions. It was unclear if `action: "reduce_50"` was a valid KeeperHub primitive or if we had to construct raw calldata.
**The Solution:** The MCP schema needs stronger enum types explicitly documented for common DeFi actions (e.g., `ExitPosition`, `ReducePosition`).

## 3. Summary
The KeeperHub MCP architecture represents a paradigm shift for AI-driven onchain agents. With minor improvements to simulation tooling and error transparency, it will become the undisputed standard for autonomous DeFi infrastructure. 
