import redis.asyncio as redis

# Single shared Redis client - not webhook-specific, so it lives at the app
# root (same pattern as llm.py) rather than under routers/webhook.
redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)
