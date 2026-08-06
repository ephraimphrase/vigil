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
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-sonnet-5")
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY", "")
DUNE_API_KEY = os.getenv("DUNE_API_KEY", "")
THEGRAPH_API_KEY = os.getenv("THEGRAPH_API_KEY", "")
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")
KEEPERHUB_API_KEY = os.getenv("KEEPERHUB_API_KEY", "")

# Shared secret POST /webhook/ingest checks against (?secret=...) - unset
# (the local-dev default) leaves the endpoint open, same as before this
# was added. Set in production so a triggerable, cost-incurring sweep
# isn't sitting on a guessable public URL with no auth.
INGEST_WEBHOOK_SECRET = os.getenv("INGEST_WEBHOOK_SECRET", "")

# App Config
USER_WALLET = os.getenv("USER_WALLET", "0x0000000000000000000000000000000000000000")
