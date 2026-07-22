import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API Keys
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_SECRET = os.getenv("REDDIT_SECRET", "")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
LUNARCRUSH_KEY = os.getenv("LUNARCRUSH_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY", "")
KEEPERHUB_API_KEY = os.getenv("KEEPERHUB_API_KEY", "kh_test_key_for_hackathon")

# App Config
USER_WALLET = os.getenv("USER_WALLET", "0x0000000000000000000000000000000000000000")
