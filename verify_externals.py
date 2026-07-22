"""
Vigil External Resource Verification Script
============================================
Tests every external URL, API endpoint, and GitHub repo used in the project.
Run with: python verify_externals.py
"""
import asyncio
import httpx
import json
import sys

GITHUB_REPOS = {
    "aave":      "aave/aave-v3-core",
    "compound":  "compound-finance/compound-protocol",
    "uniswap":   "Uniswap/v3-core",
    "curve":     "curvefi/curve-contract",
    "makerdao":  "makerdao/dss",
    "balancer":  "balancer-labs/balancer-v2-monorepo",
    "yearn":     "yearn/yearn-vaults",
    "lido":      "lidofinance/lido-dao",
}

# Slugs verified live 2026-07-22 — 'compound' and 'uniswap' don't exist as bare slugs
DEFILLAMA_SLUGS = {
    "aave":     "aave",
    "compound": "compound-v3",
    "uniswap":  "uniswap-v3",
    "curve":    "curve-dex",
    "makerdao": "makerdao",
    "lido":     "lido",
}

# Space IDs verified live 2026-07-22
SNAPSHOT_SPACES = {
    "aave":     "aavedao.eth",
    "compound": "comp-vote.eth",
    "uniswap":  "uniswapgovernance.eth",
    "lido":     "lido-snapshot.eth",
    "balancer": "balancer.eth",
    # makerdao excluded — moved to on-chain governance, no Snapshot activity
}

LUNARCRUSH_SYMBOLS = {
    "aave":     "AAVE",
    "compound": "COMP",
    "uniswap":  "UNI",
    "curve":    "CRV",
    "makerdao": "MKR",
    "lido":     "LDO",
    "yearn":    "YFI",
    "balancer": "BAL",
}

RESULTS = []

def ok(label, detail=""):
    msg = f"  [PASS] {label}" + (f" — {detail}" if detail else "")
    print(msg)
    RESULTS.append(("PASS", label, detail))

def fail(label, detail=""):
    msg = f"  [FAIL] {label}" + (f" — {detail}" if detail else "")
    print(msg)
    RESULTS.append(("FAIL", label, detail))

def warn(label, detail=""):
    msg = f"  [WARN] {label}" + (f" — {detail}" if detail else "")
    print(msg)
    RESULTS.append(("WARN", label, detail))


async def check_github_repos(client: httpx.AsyncClient):
    print("\n--- GitHub Repos ---")
    for name, repo in GITHUB_REPOS.items():
        try:
            r = await client.get(f"https://api.github.com/repos/{repo}", timeout=10)
            if r.status_code == 200:
                data = r.json()
                stars = data.get("stargazers_count", "?")
                ok(f"{name}: github.com/{repo}", f"exists, {stars} stars")
            elif r.status_code == 301:
                location = r.headers.get("location", "?")
                warn(f"{name}: github.com/{repo}", f"301 Moved -> {location}")
            elif r.status_code == 404:
                fail(f"{name}: github.com/{repo}", "404 NOT FOUND — repo does not exist!")
            else:
                warn(f"{name}: github.com/{repo}", f"HTTP {r.status_code}")
        except Exception as e:
            fail(f"{name}: github.com/{repo}", str(e))


async def check_defillama(client: httpx.AsyncClient):
    print("\n--- DeFiLlama Protocol Slugs (api.llama.fi) ---")
    # Protocols whose /protocol/{slug} response is >500KB and will timeout at 10s.
    # For these use the /tvl/{slug} fast endpoint instead.
    large_slugs = {"uniswap-v3"}

    for name, slug in DEFILLAMA_SLUGS.items():
        try:
            if slug in large_slugs:
                # Fast single-number endpoint
                r = await client.get(f"https://api.llama.fi/tvl/{slug}", timeout=10)
                if r.status_code == 200:
                    tvl = float(r.text.strip())
                    ok(f"{name}: slug='{slug}' (via /tvl/)", f"TVL=${tvl:,.0f}")
                else:
                    fail(f"{name}: slug='{slug}'", f"HTTP {r.status_code}")
            else:
                r = await client.get(f"https://api.llama.fi/protocol/{slug}", timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    tvl_series = data.get("tvl", [])
                    current = tvl_series[-1].get("totalLiquidityUSD", 0) if tvl_series else 0
                    ok(f"{name}: slug='{slug}'", f"TVL=${current:,.0f}")
                elif r.status_code == 404:
                    fail(f"{name}: slug='{slug}'", "404 — slug not found in DeFiLlama!")
                else:
                    warn(f"{name}: slug='{slug}'", f"HTTP {r.status_code}")
        except Exception as e:
            fail(f"{name}: slug='{slug}'", str(e))

    print("\n--- DeFiLlama Hacks API ---")
    try:
        r = await client.get("https://api.llama.fi/hacks", timeout=15)
        if r.status_code == 200:
            data = r.json()
            count = len(data) if isinstance(data, list) else "?"
            ok("defillama.com/api/hacks", f"{count} hack records returned")
        else:
            fail("defillama.com/api/hacks", f"HTTP {r.status_code}")
    except Exception as e:
        fail("defillama.com/api/hacks", str(e))


async def check_snapshot(client: httpx.AsyncClient):
    print("\n--- Snapshot Governance Spaces (hub.snapshot.org) ---")
    query = """
    query Proposals($space: String!) {
      proposals(first: 1, where: { space: $space }, orderBy: "created", orderDirection: desc) {
        id
        title
        state
      }
    }
    """
    for name, space in SNAPSHOT_SPACES.items():
        try:
            r = await client.post(
                "https://hub.snapshot.org/graphql",
                json={"query": query, "variables": {"space": space}},
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json().get("data", {}).get("proposals", [])
                if data:
                    title = data[0].get("title", "?")[:60]
                    ok(f"{name}: space='{space}'", f"latest proposal: \"{title}\"")
                else:
                    warn(f"{name}: space='{space}'", "space exists but no proposals found")
            else:
                fail(f"{name}: space='{space}'", f"HTTP {r.status_code}")
        except Exception as e:
            fail(f"{name}: space='{space}'", str(e))


async def check_lunarcrush(client: httpx.AsyncClient):
    print("\n--- LunarCrush API (no key — checking endpoint shape) ---")
    # We can't auth without a key, but we can confirm the endpoint exists and returns 401 vs 404
    for name, symbol in list(LUNARCRUSH_SYMBOLS.items())[:3]:  # sample 3
        url = f"https://lunarcrush.com/api4/public/coins/{symbol.lower()}/v1"
        try:
            r = await client.get(url, timeout=10)
            if r.status_code in (200, 401, 403):
                ok(f"{name}: LunarCrush symbol='{symbol}'", f"endpoint reachable (HTTP {r.status_code})")
            elif r.status_code == 404:
                fail(f"{name}: LunarCrush symbol='{symbol}'", f"404 — endpoint/symbol not found!")
            else:
                warn(f"{name}: LunarCrush symbol='{symbol}'", f"HTTP {r.status_code}")
        except Exception as e:
            fail(f"{name}: LunarCrush symbol='{symbol}'", str(e))


async def check_misc(client: httpx.AsyncClient):
    print("\n--- Other API Endpoints ---")

    # OpenRouter
    try:
        r = await client.get("https://openrouter.ai/api/v1/models", timeout=10)
        if r.status_code in (200, 401):
            ok("OpenRouter API (openrouter.ai/api/v1)", f"reachable (HTTP {r.status_code})")
        else:
            warn("OpenRouter API", f"HTTP {r.status_code}")
    except Exception as e:
        fail("OpenRouter API", str(e))

    # KeeperHub MCP
    try:
        r = await client.get("https://app.keeperhub.com/mcp", timeout=10)
        if r.status_code in (200, 401, 403, 405, 422):
            ok("KeeperHub MCP (app.keeperhub.com/mcp)", f"endpoint exists (HTTP {r.status_code})")
        elif r.status_code == 404:
            fail("KeeperHub MCP", "404 — endpoint not found!")
        else:
            warn("KeeperHub MCP", f"HTTP {r.status_code}")
    except Exception as e:
        fail("KeeperHub MCP", str(e))

    # NewsAPI (no key — 401 is expected, 404 would mean wrong URL)
    try:
        r = await client.get("https://newsapi.org/v2/everything?apiKey=test&q=test", timeout=10)
        if r.status_code in (200, 401, 426):
            ok("NewsAPI (newsapi.org/v2/everything)", f"endpoint reachable (HTTP {r.status_code})")
        else:
            warn("NewsAPI", f"HTTP {r.status_code}")
    except Exception as e:
        fail("NewsAPI", str(e))

    # Google News RSS
    try:
        r = await client.get(
            "https://news.google.com/rss/search?q=aave+DeFi&hl=en-US&gl=US&ceid=US:en",
            timeout=10,
            follow_redirects=True,
        )
        if r.status_code == 200 and "xml" in r.headers.get("content-type", ""):
            ok("Google News RSS", "returned valid XML feed")
        elif r.status_code == 200:
            ok("Google News RSS", f"HTTP 200 (content-type: {r.headers.get('content-type', '?')})")
        else:
            warn("Google News RSS", f"HTTP {r.status_code}")
    except Exception as e:
        warn("Google News RSS", f"{e} (may require browser headers)")


async def main():
    print("=" * 60)
    print("  VIGIL — External Resource Verification")
    print("=" * 60)

    async with httpx.AsyncClient(follow_redirects=True, headers={
        "User-Agent": "vigil-health-monitor/1.0 (hackathon verification)"
    }) as client:
        await check_github_repos(client)
        await check_defillama(client)
        await check_snapshot(client)
        await check_lunarcrush(client)
        await check_misc(client)

    # Summary
    passed = [r for r in RESULTS if r[0] == "PASS"]
    failed = [r for r in RESULTS if r[0] == "FAIL"]
    warned = [r for r in RESULTS if r[0] == "WARN"]

    print("\n" + "=" * 60)
    print(f"  RESULTS: {len(passed)} PASS | {len(warned)} WARN | {len(failed)} FAIL")
    print("=" * 60)

    if failed:
        print("\nFailed checks (need fixing):")
        for _, label, detail in failed:
            print(f"  - {label}: {detail}")

    if warned:
        print("\nWarnings (may need attention):")
        for _, label, detail in warned:
            print(f"  - {label}: {detail}")

    if not failed:
        print("\nAll external resources verified successfully!")
    
    return 1 if failed else 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
