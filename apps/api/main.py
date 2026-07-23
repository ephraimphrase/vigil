from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from scheduler import scheduler
from db.queries import get_latest_scores, get_score_history, get_recent_triggers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the APScheduler lifecycle — replaces deprecated on_event handlers."""
    print("[VIGIL] Starting APScheduler...")
    scheduler.start()
    yield
    print("[VIGIL] Shutting down APScheduler...")
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="Vigil - Autonomous Protocol Risk Monitor",
    description=(
        "An autonomous protocol risk monitoring and consequence execution system. "
        "Ingests on-chain and off-chain signals, scores DeFi protocols via LLM, "
        "and triggers KeeperHub MCP workflows when critical risk thresholds are breached."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the frontend / other services to consume the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def read_root():
    """Liveness check — also reports whether the background scheduler is running."""
    return {
        "status":           "Vigil is running",
        "scheduler_active": scheduler.running,
        "version":          "1.0.0",
    }


@app.get("/api/protocols", tags=["Protocols"])
def api_get_protocols():
    """Returns the latest health score for every monitored protocol."""
    return {"protocols": get_latest_scores()}


@app.get("/api/protocols/{protocol}/history", tags=["Protocols"])
def api_get_protocol_history(protocol: str, limit: int = 24):
    """Returns chronological health score history for a specific protocol.
    
    - **protocol**: one of aave, compound, makerdao, uniswap, curve, lido
    - **limit**: number of most recent data points (default 24)
    """
    history = get_score_history(protocol, limit)
    if not history:
        raise HTTPException(
            status_code=404,
            detail=f"No history found for protocol '{protocol}'. Either it is not monitored or no scores have been recorded yet.",
        )
    return {"protocol": protocol, "history": history}


@app.get("/api/triggers", tags=["Execution"])
def api_get_triggers(limit: int = 10):
    """Returns the most recent execution triggers and their on-chain tx hashes.
    
    - **limit**: number of triggers to return (default 10, max recommended 100)
    """
    if limit > 500:
        raise HTTPException(status_code=400, detail="limit must be <= 500")
    return {"triggers": get_recent_triggers(limit)}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
