from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from scheduler import scheduler
from db.queries import get_latest_scores, get_score_history, get_recent_triggers

app = FastAPI(title="Vigil - Protocol Health Monitor")

# Allow frontend to consume the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("Starting Vigil APScheduler...")
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down Vigil APScheduler...")
    scheduler.shutdown()

@app.get("/")
def read_root():
    return {"status": "Vigil is running", "scheduler_active": scheduler.running}

@app.get("/api/protocols")
def api_get_protocols():
    """Returns the latest health score for all monitored protocols."""
    return {"protocols": get_latest_scores()}

@app.get("/api/protocols/{protocol}/history")
def api_get_protocol_history(protocol: str, limit: int = 24):
    """Returns the historical health scores for a specific protocol."""
    history = get_score_history(protocol, limit)
    if not history:
        raise HTTPException(status_code=404, detail="Protocol not found or no history available")
    return {"protocol": protocol, "history": history}

@app.get("/api/triggers")
def api_get_triggers(limit: int = 10):
    """Returns the most recent execution triggers and their tx hashes."""
    return {"triggers": get_recent_triggers(limit)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
