import sqlite3
import json
from datetime import datetime
from db.models import DB_PATH

async def safe_fetch(fetch_fn, protocol: str, signal_key: str, fallback=None):
    """
    Wraps any fetch function with a fallback to the last known good value.
    This prevents transient API failures from crashing the scoring loop.
    """
    if fallback is None:
        # Default fallback is typically a neutral dict or float
        fallback = 0.5
        
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
    
    # Store complex types as JSON strings
    if isinstance(value, (dict, list)):
        val_str = json.dumps(value)
    else:
        val_str = str(value)
        
    con.execute(
        "INSERT OR REPLACE INTO signal_cache (protocol, key, value, updated_at) VALUES (?, ?, ?, ?)",
        (protocol, key, val_str, datetime.utcnow().isoformat())
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
    
    if row:
        val = row[0]
        try:
            # Try to parse back to dict if it was JSON
            return json.loads(val)
        except json.JSONDecodeError:
            try:
                return float(val)
            except ValueError:
                return val
    return None
