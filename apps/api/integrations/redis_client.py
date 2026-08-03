import os

import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()

# Single shared Redis client - not webhook-specific, so it lives at the app
# root (same pattern as llm.py) rather than under routers/webhook.
# Default matches docker-compose.yml's host port (6380, not Redis's usual
# 6379 - see that file for why).
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
