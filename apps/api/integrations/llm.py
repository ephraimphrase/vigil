from openai import AsyncOpenAI
from config import OPENROUTER_API_KEY

# Single shared OpenRouter client - every LLM call site (scoring, github/
# sentiment/news/snapshot ingestion, keeperhub execution) imports this
# instead of constructing its own. None when no key is configured; callers
# already guard on that before calling .chat.completions.create.
llm_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
) if OPENROUTER_API_KEY else None
