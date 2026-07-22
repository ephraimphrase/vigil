import sqlite3
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class SignalSnapshot(BaseModel):
    protocol: str
    timestamp: datetime
    tvl_delta_24h: float        # normalized 0-1
    liquidation_rate: float     # normalized 0-1
    whale_outflow: float        # normalized 0-1
    github_velocity: float      # normalized 0-1
    sentiment_score: float      # normalized 0-1
    governance_risk: float      # normalized 0-1 (NEW)
    security_score: float       # normalized 0-1
    news_sentiment: float       # normalized 0-1
    social_score: float         # normalized 0-1

class HealthScore(BaseModel):
    protocol: str
    timestamp: datetime
    score: float                # 0-100
    reasoning: str
    risk_flags: List[str]
    delta_from_24h_avg: float

DB_PATH = "db/vigil.sqlite"

def init_db():
    """Initializes the SQLite database schema."""
    con = sqlite3.connect(DB_PATH)
    
    # Cache for resilient API fetching
    con.execute('''
        CREATE TABLE IF NOT EXISTS signal_cache (
            protocol TEXT,
            key TEXT,
            value TEXT,
            updated_at DATETIME,
            PRIMARY KEY (protocol, key)
        )
    ''')
    
    # History for moving averages
    con.execute('''
        CREATE TABLE IF NOT EXISTS signal_history (
            protocol TEXT,
            timestamp DATETIME,
            key TEXT,
            value REAL
        )
    ''')
    
    # Track historical health scores
    con.execute('''
        CREATE TABLE IF NOT EXISTS health_scores (
            protocol TEXT,
            timestamp DATETIME,
            score REAL,
            reasoning TEXT
        )
    ''')
    
    # Track execution triggers
    con.execute('''
        CREATE TABLE IF NOT EXISTS triggers (
            protocol TEXT,
            timestamp DATETIME,
            action TEXT,
            reason TEXT,
            tx_hash TEXT
        )
    ''')
    
    con.commit()
    con.close()

# Initialize on import
init_db()
