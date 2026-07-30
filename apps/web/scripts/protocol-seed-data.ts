// ─────────────────────────────────────────────────────────────
// Grounded protocol-detail data for every protocol in seed/protocols.json.
// Consumed by scripts/seed-db.ts to populate the `protocols` table (see
// apps/api/db/models.py) and health_scores history. Not served directly -
// app/api/protocols/[id]/route.ts queries Postgres, this is seed input.
// ─────────────────────────────────────────────────────────────

export interface ProtocolSeed {
  id: string;
  name: string;
  ticker: string;
  aliases: string[];
  category: string;
  chain: string;
  settlementLayer: string | null;
  kind: string;
  description: string;
  launchDate: string;
  links: Record<string, string | string[] | undefined>;
  market: {
    price: number; marketCap: number; fdv: number;
    priceChange24h: number; priceChange7d: number; priceChange30d?: number;
    circulating?: number; maxSupply?: number; rank?: number; athMultiple?: string;
  } | null;
  assessmentSummary: string;
  riskFlags: string[];
  confidence: "low" | "medium" | "high";
  signals: {
    onchain: Record<string, { label: string; raw: string | number; normalized: number; trend: "up" | "down" | "flat"; weight: number; source: string; status: string; unit?: string }>;
    offchain: Record<string, { label: string; raw: string | number; normalized: number; trend: "up" | "down" | "flat"; weight: number; source: string; status: string }>;
    typed: Record<string, { label: string; raw: string | number; normalized: number; trend: "up" | "down" | "flat"; weight: number; source: string; status: string }>;
  };
  risk: { category: string; severity: "info" | "low" | "medium" | "high" | "critical"; title: string; note: string; source: string }[];
  contracts: { label: string; address: string; kind: string }[];
  incidents: { ts: string; type: string; severity: "info" | "low" | "medium" | "high" | "critical"; title: string; note: string }[];
  dependencies: { type: string; target: string; note: string }[];
  askSuggestions: string[];
}

export const PROTOCOL_SEEDS: ProtocolSeed[] = [
  {
    id: "morpho", name: "Morpho", ticker: "MORPHO",
    aliases: ["Morpho Blue", "MetaMorpho"],
    category: "lending", chain: "ethereum", settlementLayer: null,
    kind: "Peer-to-peer optimized lending primitive",
    description: "Morpho Blue is a minimal, immutable isolated-market lending primitive. MetaMorpho vaults (ERC-4626) sit on top, letting curators (Steakhouse, Gauntlet, B.Protocol, etc.) allocate deposits across markets on a user's behalf - this repo's strategy deposits into one such curated vault.",
    launchDate: "2022-01-25",
    links: { website: "https://morpho.org", docs: "https://docs.morpho.org", github: "https://github.com/morpho-org", twitter: "https://x.com/MorphoLabs", defillama: "https://defillama.com/protocol/morpho", audits: ["ChainSecurity", "Spearbit", "Trail of Bits", "OpenZeppelin"] },
    market: { price: 2.15, marketCap: 715000000, fdv: 2150000000, priceChange24h: 1.1, priceChange7d: 4.2, priceChange30d: 12.5, circulating: 332800000, maxSupply: 1000000000, rank: 68, athMultiple: "-58% from ATH ($5.16, Jan 2025)" },
    assessmentSummary: "Blue's minimal, immutable core (no admin keys on deployed markets) is a strong security property, and TVL growth has been consistent as curated MetaMorpho vaults attract allocators. The real risk sits one layer up: which curator manages a given vault, and how conservative their market/oracle selection is - a bad curator decision on an isolated market doesn't touch Blue itself, but does touch depositors in that vault.",
    riskFlags: ["curator dependency", "isolated market risk"],
    confidence: "high",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$3.5B", normalized: 0.82, trend: "up", weight: 0.12, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+3.1%", normalized: 0.8, trend: "up", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.85, trend: "flat", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        liquidations: { label: "Liquidation rate 24h", raw: "$1.1M (normal)", normalized: 0.85, trend: "flat", weight: 0.08, source: "subgraph", status: "live" },
        activity: { label: "Contract tx volume", raw: "high", normalized: 0.82, trend: "up", weight: 0.04, source: "Alchemy", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "high", normalized: 0.88, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "positive", normalized: 0.78, trend: "up", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.95, trend: "flat", weight: 0.06, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "active", normalized: 0.75, trend: "flat", weight: 0.04, source: "Snapshot", status: "manual" },
      },
      typed: {
        curatorConcentration: { label: "Top-curator TVL share", raw: "~40% (Steakhouse)", normalized: 0.6, trend: "flat", weight: 0.09, source: "manual", status: "manual" },
        isolatedMarketCount: { label: "Active isolated markets", raw: "450+", normalized: 0.75, trend: "up", weight: 0.05, source: "subgraph", status: "live" },
        badDebt: { label: "Protocol-wide bad debt", raw: "negligible", normalized: 0.92, trend: "flat", weight: 0.08, source: "subgraph", status: "live" },
        immutability: { label: "Core contract upgradability", raw: "immutable (Blue core)", normalized: 0.95, trend: "flat", weight: 0.06, source: "manual", status: "manual" },
        oracleHealth: { label: "Oracle health (per-market)", raw: "nominal", normalized: 0.85, trend: "flat", weight: 0.04, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Curation", severity: "medium", title: "Curator dependency", note: "MetaMorpho vault safety depends entirely on the curator's market/oracle/LTV selections - Blue itself has no opinion.", source: "manual" },
      { category: "Isolation", severity: "low", title: "Isolated market risk", note: "Each Blue market is fully isolated by design; a bad market can't directly cause contagion elsewhere, but a mispriced oracle on one market can still lose that market's lenders funds.", source: "manual" },
      { category: "Concentration", severity: "low", title: "Curator TVL concentration", note: "A large share of deposits sit under a small number of curators.", source: "DeFiLlama" },
    ],
    contracts: [
      { label: "Morpho Blue", address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb", kind: "core" },
      { label: "MetaMorpho Factory", address: "0x1897A8997241C1cD4bD0698647e4EB7213535c24", kind: "factory" },
    ],
    incidents: [],
    dependencies: [
      { type: "curator", target: "third-party-risk-managers", note: "Vault-level allocation decisions are delegated to curators (Steakhouse, Gauntlet, etc.), not Morpho Labs." },
      { type: "oracle", target: "chainlink", note: "Most markets price collateral via Chainlink feeds, configured per-market by the market creator." },
    ],
    askSuggestions: ["How much of my deposit's risk actually comes from the curator, not Morpho Blue itself?", "What happens if one isolated market gets bad debt - does it spread?"],
  },
  {
    id: "venus", name: "Venus", ticker: "XVS",
    aliases: ["Venus Protocol"],
    category: "lending", chain: "bnb-chain", settlementLayer: null,
    kind: "Overcollateralized money market (Aave-derived)",
    description: "BNB Chain's largest lending market, forked from Compound/Aave design. Issues VAI, an overcollateralized stablecoin. Recovered from a major 2021 bad-debt event and has since added Isolated Pools to contain future oracle-driven losses to a single market.",
    launchDate: "2020-10-01",
    links: { website: "https://venus.io", docs: "https://docs.venus.io", github: "https://github.com/VenusProtocol", twitter: "https://x.com/VenusProtocol", defillama: "https://defillama.com/protocol/venus", audits: ["CertiK", "PeckShield"] },
    market: { price: 6.8, marketCap: 118000000, fdv: 204000000, priceChange24h: -0.6, priceChange7d: -2.1, priceChange30d: -8.4, circulating: 17370000, maxSupply: 30000000, rank: 210, athMultiple: "-97% from ATH ($227, May 2021)" },
    assessmentSummary: "Venus is deeply liquid on BNB Chain and has run without a repeat incident since Isolated Pools shipped, but the May 2021 event is a real precedent, not ancient history: a thinly-traded token (XVS itself) was oracle-manipulated to inflate borrowing power, leaving the protocol with roughly $200M in bad debt that took years to fully resolve. Isolated Pools now wall off exactly this failure mode from the Core Pool, which is where this repo's strategy sits.",
    riskFlags: ["oracle dependency", "past bad debt event"],
    confidence: "high",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$2.1B", normalized: 0.72, trend: "down", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "-1.8%", normalized: 0.55, trend: "down", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "moderate", normalized: 0.58, trend: "down", weight: 0.11, source: "Alchemy Transfers", status: "live" },
        liquidations: { label: "Liquidation rate 24h", raw: "$2.4M (elevated)", normalized: 0.62, trend: "down", weight: 0.09, source: "subgraph", status: "live" },
        activity: { label: "Contract tx volume", raw: "high", normalized: 0.78, trend: "flat", weight: 0.04, source: "Alchemy", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "moderate", normalized: 0.65, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral", normalized: 0.58, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 new incidents", normalized: 0.85, trend: "flat", weight: 0.07, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "moderate", normalized: 0.6, trend: "flat", weight: 0.04, source: "Snapshot", status: "manual" },
      },
      typed: {
        oracleManipHistory: { label: "Prior oracle-manipulation loss", raw: "~$200M (May 2021)", normalized: 0.4, trend: "flat", weight: 0.1, source: "manual", status: "manual" },
        isolatedPoolCoverage: { label: "TVL in Isolated Pools", raw: "growing", normalized: 0.65, trend: "up", weight: 0.06, source: "manual", status: "manual" },
        badDebt: { label: "Current bad debt", raw: "residual, declining", normalized: 0.6, trend: "up", weight: 0.09, source: "subgraph", status: "live" },
        vaiPegDeviation: { label: "VAI peg", raw: "~1.00", normalized: 0.88, trend: "flat", weight: 0.05, source: "oracle", status: "live" },
        bnbChainConcentration: { label: "Single-chain exposure", raw: "BNB Chain only (Core Pool)", normalized: 0.55, trend: "flat", weight: 0.05, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Oracle", severity: "high", title: "Prior oracle-manipulation event", note: "May 2021: a low-liquidity token's price was manipulated to over-borrow against, leaving ~$200M in bad debt. Isolated Pools now contain this failure mode, but Core Pool history is real.", source: "manual" },
      { category: "Chain", severity: "medium", title: "BNB Chain concentration", note: "Effectively single-chain exposure; validator set and chain-level risk are BNB Chain's, not Venus's own.", source: "manual" },
      { category: "Collateral", severity: "low", title: "Liquidation sensitivity", note: "Liquidation volume runs elevated relative to TVL during volatile periods.", source: "subgraph" },
    ],
    contracts: [
      { label: "Comptroller (Core Pool)", address: "0xfD36E2c2a6789Db23113685031d7F16329158384", kind: "core" },
      { label: "vUSDC", address: "0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8", kind: "market" },
    ],
    incidents: [
      { ts: "2021-05-19", type: "exploit", severity: "critical", title: "XVS oracle manipulation - ~$200M bad debt", note: "Thin liquidity let an attacker spike XVS price on a CEX the oracle read from, over-borrowing against inflated collateral value." },
      { ts: "2022-10-01", type: "upgrade", severity: "info", title: "Isolated Pools launched", note: "New markets can now be walled off from the Core Pool, containing future oracle or collateral failures to one pool." },
    ],
    dependencies: [
      { type: "chain", target: "bnb-chain", note: "Primary and dominant deployment." },
      { type: "oracle", target: "chainlink", note: "Core Pool price feeds; historically the attack surface in the 2021 incident predates the current oracle setup." },
    ],
    askSuggestions: ["Is the 2021 bad-debt event still relevant to Core Pool depositors today?", "How does Isolated Pools actually protect Core Pool users?"],
  },
  {
    id: "stargate", name: "Stargate", ticker: "STG",
    aliases: ["Stargate Finance", "Stargate V2"],
    category: "dex", chain: "multichain", settlementLayer: null,
    kind: "Omnichain liquidity / bridging protocol (LayerZero)",
    description: "Unified-liquidity cross-chain bridge built on LayerZero messaging. V2 introduced Hydra pools and a unified USDC/USDT liquidity model across chains, reducing the slippage and fragmentation of V1's per-chain pools.",
    launchDate: "2022-03-17",
    links: { website: "https://stargate.finance", docs: "https://stargateprotocol.gitbook.io", github: "https://github.com/stargate-protocol", twitter: "https://x.com/StargateFinance", defillama: "https://defillama.com/protocol/stargate", audits: ["Zellic", "Quantstamp", "Certik"] },
    market: { price: 0.42, marketCap: 210000000, fdv: 420000000, priceChange24h: 0.3, priceChange7d: 1.9, priceChange30d: -5.1, circulating: 500000000, maxSupply: 1000000000, rank: 195, athMultiple: "-92% from ATH ($5.06, Mar 2022)" },
    assessmentSummary: "Unified liquidity pools are a meaningful design improvement over V1's fragmented per-chain model, and STG's TVL is small enough relative to major lending protocols that it isn't a top systemic node - but bridges remain the single most exploited category in DeFi, and Stargate's security is only as strong as LayerZero's DVN (Decentralized Verifier Network) message verification underneath it.",
    riskFlags: ["cross-chain bridge risk", "layerzero dependency"],
    confidence: "medium",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$450M", normalized: 0.6, trend: "up", weight: 0.1, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+1.2%", normalized: 0.7, trend: "up", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.8, trend: "flat", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Cross-chain transfer volume 24h", raw: "moderate", normalized: 0.68, trend: "flat", weight: 0.06, source: "LayerZero Scan", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "moderate", normalized: 0.62, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral", normalized: 0.6, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.9, trend: "flat", weight: 0.08, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "low", normalized: 0.5, trend: "flat", weight: 0.03, source: "Snapshot", status: "manual" },
      },
      typed: {
        dvnDiversity: { label: "LayerZero DVN set diversity", raw: "multiple independent verifiers", normalized: 0.7, trend: "flat", weight: 0.12, source: "manual", status: "manual" },
        poolUnification: { label: "Unified pool coverage (V2)", raw: "USDC/USDT unified", normalized: 0.78, trend: "up", weight: 0.06, source: "manual", status: "manual" },
        bridgeExploitHistory: { label: "Direct exploit history", raw: "0 successful exploits", normalized: 0.9, trend: "flat", weight: 0.09, source: "manual", status: "manual" },
        chainCoverage: { label: "Supported chains", raw: "20+", normalized: 0.75, trend: "up", weight: 0.04, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Bridge", severity: "high", title: "Cross-chain message risk", note: "Funds released on the destination chain depend on LayerZero's DVNs correctly verifying the source-chain message - the entire bridge category's dominant historical loss vector.", source: "manual" },
      { category: "Dependency", severity: "medium", title: "LayerZero dependency", note: "Stargate has no independent verification layer; a critical LayerZero-level bug or DVN collusion would affect Stargate directly.", source: "manual" },
      { category: "Liquidity", severity: "low", title: "Unified pool drawdown", note: "A large one-directional flow can temporarily deplete a chain's side of a unified pool.", source: "manual" },
    ],
    contracts: [
      { label: "Stargate V2 Router (Ethereum)", address: "0x77b2043768d28E9C9aB44E1aBfC95944bcE57931", kind: "router" },
      { label: "LayerZero Endpoint V2", address: "0x1a44076050125825900e736c501f859c50fE728c", kind: "messaging" },
    ],
    incidents: [],
    dependencies: [
      { type: "messaging", target: "layerzero", note: "All cross-chain message verification and delivery runs through LayerZero's DVN set." },
      { type: "chain", target: "multichain", note: "Deployed across 20+ EVM and non-EVM chains; risk is per-chain-pair, not uniform." },
    ],
    askSuggestions: ["What actually verifies a Stargate transfer is legitimate before funds release on the other chain?", "How does V2's unified liquidity reduce risk vs V1's per-chain pools?"],
  },
  {
    id: "compound", name: "Compound", ticker: "COMP",
    aliases: ["Compound V3", "Comet"],
    category: "lending", chain: "ethereum", settlementLayer: null,
    kind: "Single-borrowable-asset money market",
    description: "One of DeFi's original lending protocols. V3 (\"Comet\") redesigned around one borrowable base asset per deployment (e.g. a USDC market) with multiple collateral types, simplifying risk accounting versus V2's pooled-everything model. This repo's strategy supplies directly to a Comet USDC market.",
    launchDate: "2018-09-01",
    links: { website: "https://compound.finance", docs: "https://docs.compound.finance", github: "https://github.com/compound-finance", twitter: "https://x.com/compoundfinance", defillama: "https://defillama.com/protocol/compound-finance", explorer: "https://etherscan.io/address/0xc3d688B66703497DAA19211EEdff47f25384cdc3", audits: ["OpenZeppelin", "Trail of Bits", "ChainSecurity"] },
    market: { price: 44.2, marketCap: 310000000, fdv: 442000000, priceChange24h: 0.4, priceChange7d: 2.8, priceChange30d: -3.2, circulating: 7010000, maxSupply: 10000000, rank: 155, athMultiple: "-94% from ATH ($910, May 2021)" },
    assessmentSummary: "Compound is one of the longest-running, most battle-tested lending protocols in DeFi with no direct protocol-level exploit in its history - its risk profile today is closer to 'mature and slow-moving' than 'actively concerning'. V3's single-base-asset design is easier to reason about than V2's pooled model, at some cost to capital efficiency across markets.",
    riskFlags: ["governance timelock risk"],
    confidence: "high",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$2.8B", normalized: 0.83, trend: "flat", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+0.6%", normalized: 0.75, trend: "flat", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.85, trend: "flat", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        liquidations: { label: "Liquidation rate 24h", raw: "$0.8M (normal)", normalized: 0.88, trend: "flat", weight: 0.08, source: "subgraph", status: "live" },
        activity: { label: "Contract tx volume", raw: "moderate", normalized: 0.7, trend: "flat", weight: 0.04, source: "Alchemy", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "moderate", normalized: 0.68, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral-positive", normalized: 0.7, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.97, trend: "flat", weight: 0.07, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "slow, deliberate", normalized: 0.72, trend: "flat", weight: 0.04, source: "Compound Governance", status: "manual" },
      },
      typed: {
        marketMaturity: { label: "Years live", raw: "~8 years", normalized: 0.95, trend: "flat", weight: 0.08, source: "manual", status: "manual" },
        badDebt: { label: "Bad debt", raw: "negligible", normalized: 0.93, trend: "flat", weight: 0.09, source: "subgraph", status: "live" },
        timelockDelay: { label: "Governance timelock", raw: "2 days", normalized: 0.65, trend: "flat", weight: 0.07, source: "manual", status: "manual" },
        collateralDiversity: { label: "Supported collateral types", raw: "8+ per Comet market", normalized: 0.75, trend: "flat", weight: 0.04, source: "subgraph", status: "live" },
      },
    },
    risk: [
      { category: "Governance", severity: "low", title: "Governance timelock risk", note: "A malicious or erroneous governance proposal that passes still executes after only a 2-day timelock.", source: "manual" },
      { category: "Market design", severity: "low", title: "Single-asset market fragmentation", note: "V3's per-base-asset markets mean liquidity is split across deployments rather than pooled, a deliberate tradeoff for simpler risk isolation.", source: "manual" },
    ],
    contracts: [
      { label: "Comet (USDC market)", address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3", kind: "core" },
      { label: "CometRewards", address: "0x1B0e765F6224C21223AeA2af16c1C46E38885a40", kind: "rewards" },
      { label: "Governor Bravo", address: "0xc0Da02939E1441F497fd74F78cE7Decb17B66529", kind: "admin" },
    ],
    incidents: [],
    dependencies: [
      { type: "oracle", target: "chainlink", note: "Collateral pricing across Comet markets." },
      { type: "chain", target: "ethereum", note: "Primary deployment; V3 also live on several L2s." },
    ],
    askSuggestions: ["Why does Compound V3 use separate markets instead of one pooled market like V2?", "How fast could a bad governance proposal actually execute?"],
  },
  {
    id: "curve", name: "Curve", ticker: "CRV",
    aliases: ["Curve Finance", "Curve DAO"],
    category: "dex", chain: "ethereum", settlementLayer: null,
    kind: "Stableswap automated market maker",
    description: "The dominant AMM for stable/pegged-asset swaps, using a low-slippage stableswap invariant. veCRV vote-locking directs CRV emissions to specific pools ('gauge wars'), and Convex has become the largest aggregator of vote-locked CRV, adding a real dependency layer on top of Curve itself.",
    launchDate: "2020-01-19",
    links: { website: "https://curve.fi", docs: "https://docs.curve.fi", github: "https://github.com/curvefi", twitter: "https://x.com/CurveFinance", defillama: "https://defillama.com/protocol/curve-finance", audits: ["Trail of Bits", "MixBytes", "ChainSecurity"] },
    market: { price: 0.58, marketCap: 640000000, fdv: 1334000000, priceChange24h: -0.5, priceChange7d: -3.4, priceChange30d: 6.1, circulating: 1104000000, maxSupply: 2300000000, rank: 82, athMultiple: "-95% from ATH ($12.50, Aug 2020)" },
    assessmentSummary: "Curve's stableswap design is deeply battle-tested and the dominant venue for stable-pair liquidity, but it carries real, documented history: a July 2023 Vyper compiler bug enabled a reentrancy exploit draining ~$70M from several stable pools, and founder-held CRV used as loan collateral has repeatedly raised systemic liquidation-cascade concerns across DeFi lending markets that hold CRV as collateral.",
    riskFlags: ["convex dependency", "pool depeg risk"],
    confidence: "high",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$2.3B", normalized: 0.78, trend: "down", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "-1.4%", normalized: 0.6, trend: "down", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "moderate", normalized: 0.6, trend: "down", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Swap tx volume 24h", raw: "high", normalized: 0.82, trend: "flat", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "high", normalized: 0.85, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "mixed (founder loan concerns)", normalized: 0.55, trend: "down", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 new incidents", normalized: 0.85, trend: "flat", weight: 0.07, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity (gauge votes)", raw: "very active", normalized: 0.8, trend: "flat", weight: 0.04, source: "Curve Governance", status: "manual" },
      },
      typed: {
        convexDependency: { label: "veCRV controlled via Convex", raw: "majority", normalized: 0.5, trend: "flat", weight: 0.1, source: "manual", status: "manual" },
        founderLoanExposure: { label: "Founder CRV-collateralized loans", raw: "material, monitored", normalized: 0.55, trend: "up", weight: 0.09, source: "manual", status: "manual" },
        vyperExploitHistory: { label: "Prior exploit loss", raw: "~$70M (Jul 2023, resolved)", normalized: 0.55, trend: "flat", weight: 0.07, source: "manual", status: "manual" },
        pegStability: { label: "Major pool peg stability", raw: "stable", normalized: 0.85, trend: "flat", weight: 0.06, source: "oracle", status: "live" },
      },
    },
    risk: [
      { category: "Smart contract", severity: "medium", title: "Prior Vyper compiler exploit", note: "July 2023: a Vyper compiler bug broke reentrancy locks on several stable pools, draining ~$70M before most funds were recovered or white-hat returned.", source: "manual" },
      { category: "Governance", severity: "medium", title: "Convex vote concentration", note: "A majority of vote-locked veCRV is controlled through Convex, giving one protocol outsized influence over gauge emissions.", source: "manual" },
      { category: "Market", severity: "medium", title: "Founder collateral overhang", note: "Large founder-held CRV positions used as loan collateral on lending markets have repeatedly raised liquidation-cascade concerns during CRV price drawdowns.", source: "news" },
    ],
    contracts: [
      { label: "3pool", address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", kind: "pool" },
      { label: "CRV Token", address: "0xD533a949740bb3306d119CC777fa900bA034cd52", kind: "token" },
      { label: "Voting Escrow (veCRV)", address: "0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2", kind: "governance" },
    ],
    incidents: [
      { ts: "2023-07-30", type: "exploit", severity: "high", title: "Vyper reentrancy exploit - ~$70M", note: "A compiler-level bug in specific Vyper versions broke the reentrancy guard on several stable pools; roughly two-thirds of funds were later recovered." },
    ],
    dependencies: [
      { type: "aggregator", target: "convex-finance", note: "Convex holds a majority of vote-locked veCRV, directing much of Curve's emission governance." },
      { type: "chain", target: "ethereum", note: "Primary deployment; also live on several L2s and sidechains." },
    ],
    askSuggestions: ["Is the 2023 Vyper exploit still a relevant risk today?", "How does Convex's control over veCRV actually affect a Curve LP?"],
  },
  {
    id: "balancer", name: "Balancer", ticker: "BAL",
    aliases: ["Balancer V3"], category: "dex", chain: "ethereum", settlementLayer: null,
    kind: "Weighted-pool automated market maker",
    description: "Generalized AMM supporting arbitrary weighted pools (not just 50/50), boosted pools that route idle liquidity into yield, and veBAL vote-locking for emission direction. V3 rebuilt the core around a singleton vault design.",
    launchDate: "2020-03-23",
    links: { website: "https://balancer.fi", docs: "https://docs.balancer.fi", github: "https://github.com/balancer", twitter: "https://x.com/Balancer", defillama: "https://defillama.com/protocol/balancer-v3", audits: ["Trail of Bits", "Certora", "OpenZeppelin"] },
    market: { price: 1.85, marketCap: 112000000, fdv: 138000000, priceChange24h: 0.2, priceChange7d: -1.5, priceChange30d: 4.8, circulating: 60500000, maxSupply: 74800000, rank: 260, athMultiple: "-97% from ATH ($74.45, May 2021)" },
    assessmentSummary: "Balancer's flexible pool math is powerful but has drawn real exploits: a 2023 boosted-pool vulnerability and a separate read-only reentrancy issue both resulted in losses across specific pool types, though the core vault and most pools were unaffected. V3's simplified singleton architecture is a direct response to that complexity surface.",
    riskFlags: ["smart contract complexity", "weighted-pool impermanent loss"],
    confidence: "medium",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$1.1B", normalized: 0.7, trend: "up", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+1.9%", normalized: 0.75, trend: "up", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.8, trend: "flat", weight: 0.09, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Swap tx volume 24h", raw: "moderate", normalized: 0.65, trend: "flat", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "high", normalized: 0.82, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral", normalized: 0.6, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 new incidents", normalized: 0.8, trend: "flat", weight: 0.08, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "active", normalized: 0.7, trend: "flat", weight: 0.04, source: "Snapshot", status: "manual" },
      },
      typed: {
        exploitHistory: { label: "Prior exploit losses", raw: "2 incidents (2023)", normalized: 0.5, trend: "flat", weight: 0.1, source: "manual", status: "manual" },
        poolComplexity: { label: "Pool-type surface", raw: "weighted/boosted/stable/custom", normalized: 0.55, trend: "flat", weight: 0.08, source: "manual", status: "manual" },
        v3Migration: { label: "TVL migrated to V3", raw: "partial, growing", normalized: 0.55, trend: "up", weight: 0.05, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Smart contract", severity: "high", title: "Prior boosted-pool exploit", note: "2023: a vulnerability in specific boosted pool implementations was exploited across several deployments before pools were paused.", source: "manual" },
      { category: "Smart contract", severity: "medium", title: "Read-only reentrancy", note: "A separate 2023 issue affected protocols reading Balancer pool balances mid-transaction, not direct fund loss but a real integration risk.", source: "manual" },
      { category: "Market", severity: "low", title: "Weighted-pool impermanent loss", note: "Non-50/50 weighted pools have different, sometimes higher, IL profiles than constant-product pools.", source: "manual" },
    ],
    contracts: [
      { label: "Vault (V3)", address: "0xbA1333333333a1BA1108E8412f11850A5C319bA9", kind: "core" },
    ],
    incidents: [
      { ts: "2023-08-27", type: "exploit", severity: "high", title: "Boosted pool vulnerability exploited", note: "Specific legacy boosted pools were drained before governance could pause them; V3's vault design narrows this surface." },
    ],
    dependencies: [
      { type: "chain", target: "ethereum", note: "Primary deployment; also live on several L2s." },
    ],
    askSuggestions: ["Does V3's new vault design actually fix the issues from the 2023 exploits?", "How is weighted-pool risk different from a standard 50/50 pool?"],
  },
  {
    id: "baseswap", name: "BaseSwap", ticker: "BSX",
    aliases: [], category: "dex", chain: "base", settlementLayer: "ethereum",
    kind: "Uniswap V2/V3-style AMM",
    description: "One of Base's earliest native DEXs, forked from Uniswap V2/V3 mechanics with its own BSX emissions and yield-farming layer. Small relative to Ethereum mainnet DEXs, but a meaningful piece of Base's early liquidity.",
    launchDate: "2023-08-01",
    links: { website: "https://baseswap.fi", docs: "https://docs.baseswap.fi", twitter: "https://x.com/BaseSwap_fi", defillama: "https://defillama.com/protocol/baseswap" },
    market: { price: 0.012, marketCap: 4200000, fdv: 4800000, priceChange24h: -1.2, priceChange7d: -4.5, priceChange30d: -12.0, circulating: 350000000, maxSupply: 400000000 },
    assessmentSummary: "A young, fork-based DEX with a small team and limited independent audit history relative to established venues. Liquidity is thin enough that larger swaps see real slippage, and the emission-driven TVL model common to fork DEXs tends to be less sticky than fee-driven demand.",
    riskFlags: ["low liquidity", "limited audit history"],
    confidence: "low",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$45M", normalized: 0.35, trend: "down", weight: 0.12, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "-3.2%", normalized: 0.4, trend: "down", weight: 0.06, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "moderate", normalized: 0.5, trend: "down", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Swap tx volume 24h", raw: "low", normalized: 0.4, trend: "flat", weight: 0.06, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "low", normalized: 0.4, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral", normalized: 0.5, trend: "flat", weight: 0.03, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.75, trend: "flat", weight: 0.06, source: "DeFiLlama Hacks", status: "live" },
        teamSignals: { label: "Team transparency", raw: "pseudonymous", normalized: 0.4, trend: "flat", weight: 0.05, source: "manual", status: "manual" },
      },
      typed: {
        auditCoverage: { label: "Independent audits", raw: "limited/self-reported", normalized: 0.3, trend: "flat", weight: 0.12, source: "manual", status: "manual" },
        emissionDependency: { label: "TVL sensitivity to BSX emissions", raw: "high", normalized: 0.35, trend: "flat", weight: 0.1, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Liquidity", severity: "medium", title: "Thin liquidity", note: "TVL is small enough that meaningful swap sizes move price noticeably.", source: "manual" },
      { category: "Audit", severity: "medium", title: "Limited independent audit history", note: "Fewer, less prominent audits than tier-1 DEXs.", source: "manual" },
      { category: "Tokenomics", severity: "low", title: "Emission-driven TVL", note: "A meaningful share of liquidity is incentive-farmed rather than fee-attracted, historically less sticky.", source: "manual" },
    ],
    contracts: [
      { label: "Router", address: "0x327Df1E6de05895d2ab08513aaDD9313Fe505d86", kind: "router" },
    ],
    incidents: [],
    dependencies: [
      { type: "chain", target: "base", note: "Single-chain deployment." },
    ],
    askSuggestions: ["How thin is liquidity here compared to a mainnet DEX for the same pair?", "How much of BaseSwap's TVL is emission-farmed vs organic?"],
  },
  {
    id: "beefy", name: "Beefy", ticker: "BIFI",
    aliases: ["Beefy Finance"], category: "lending", chain: "multichain", settlementLayer: null,
    kind: "Yield-optimizer / vault-of-vaults aggregator",
    description: "Auto-compounding yield aggregator running thousands of strategy contracts across 20+ chains - the same strategy pattern this repo's own beefy_strategies/ contracts are built from. Beefy itself doesn't originate yield; it harvests and compounds whatever the underlying protocol produces.",
    launchDate: "2020-09-01",
    links: { website: "https://beefy.com", docs: "https://docs.beefy.finance", github: "https://github.com/beefyfinance", twitter: "https://x.com/beefyfinance", defillama: "https://defillama.com/protocol/beefy", audits: ["PeckShield", "Trail of Bits", "Certik"] },
    market: { price: 205.0, marketCap: 8400000, fdv: 8400000, priceChange24h: 0.5, priceChange7d: 2.0, priceChange30d: -6.5, circulating: 41000, maxSupply: 80000, rank: 1400, athMultiple: "-98% from ATH ($16,660, Apr 2021)" },
    assessmentSummary: "Beefy's own contracts are heavily audited and battle-tested across a large TVL base, but its risk profile is inherently a dependency chain: a Beefy vault's safety is a function of both Beefy's own strategy code AND whatever underlying protocol it's compounding into. A failure in the underlying protocol passes straight through to the vault.",
    riskFlags: ["underlying strategy risk", "vault-of-vaults dependency chain"],
    confidence: "high",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$300M", normalized: 0.68, trend: "up", weight: 0.1, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+1.5%", normalized: 0.72, trend: "up", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.82, trend: "flat", weight: 0.08, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Harvest tx volume 24h", raw: "high (thousands of vaults)", normalized: 0.85, trend: "flat", weight: 0.04, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "very high", normalized: 0.9, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "positive", normalized: 0.78, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents at Beefy layer", normalized: 0.92, trend: "flat", weight: 0.07, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "moderate", normalized: 0.65, trend: "flat", weight: 0.03, source: "manual", status: "manual" },
      },
      typed: {
        vaultCount: { label: "Active vaults", raw: "5,000+", normalized: 0.85, trend: "up", weight: 0.06, source: "manual", status: "manual" },
        chainCoverage: { label: "Chains supported", raw: "20+", normalized: 0.8, trend: "up", weight: 0.04, source: "manual", status: "manual" },
        underlyingRiskPassthrough: { label: "Dependency-chain exposure", raw: "inherits underlying protocol risk", normalized: 0.55, trend: "flat", weight: 0.09, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Dependency", severity: "medium", title: "Underlying protocol pass-through", note: "A Beefy vault's real risk is whatever protocol it's compounding into - Beefy's own audit history doesn't cover that layer.", source: "manual" },
      { category: "Smart contract", severity: "low", title: "Large, complex strategy surface", note: "Thousands of distinct strategy contracts across chains means a long tail of less-scrutinized code, even if the core patterns are audited.", source: "manual" },
    ],
    contracts: [
      { label: "BeefyVaultV7 (implementation)", address: "0xE5b9639Cf5140Fa76c069A2f9C99e63020E7Eb75", kind: "vault-template" },
    ],
    incidents: [],
    dependencies: [
      { type: "protocol", target: "many", note: "Each vault depends on the specific underlying protocol it compounds - Aave, Curve, GMX, etc." },
    ],
    askSuggestions: ["If I'm using this repo's own adapter over a Beefy-pattern strategy, does Beefy's own audit history even apply?", "How does a Beefy vault's risk differ from depositing directly into the underlying protocol?"],
  },
  {
    id: "kodiak", name: "Kodiak", ticker: "KDK",
    aliases: ["Kodiak Islands"], category: "dex", chain: "berachain", settlementLayer: null,
    kind: "Concentrated liquidity AMM + auto-managed vaults",
    description: "Berachain's flagship native DEX. Kodiak Islands are auto-managed concentrated liquidity vaults (Uniswap V3-style ranges, automatically rebalanced). Deeply tied to Berachain's Proof-of-Liquidity consensus design, which is itself a new, unproven mechanism.",
    launchDate: "2025-02-01",
    links: { website: "https://kodiak.finance", docs: "https://docs.kodiak.finance", twitter: "https://x.com/KodiakFi", defillama: "https://defillama.com/protocol/kodiak" },
    market: { price: 0.045, marketCap: 9000000, fdv: 45000000, priceChange24h: -1.5, priceChange7d: -6.8, priceChange30d: -22.0, circulating: 200000000, maxSupply: 1000000000 },
    assessmentSummary: "Kodiak is the largest DEX on a chain that itself launched mainnet only months ago. Berachain's Proof-of-Liquidity consensus is a genuinely novel design with no multi-year track record, and Kodiak's own TVL and token price have been volatile since launch - this is early-stage-chain risk layered on top of ordinary DEX risk.",
    riskFlags: ["new chain risk (berachain)", "low liquidity"],
    confidence: "low",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$180M", normalized: 0.45, trend: "down", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "-5.5%", normalized: 0.35, trend: "down", weight: 0.06, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "elevated", normalized: 0.45, trend: "down", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Swap tx volume 24h", raw: "moderate", normalized: 0.55, trend: "down", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "high", normalized: 0.8, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "mixed", normalized: 0.5, trend: "down", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.8, trend: "flat", weight: 0.06, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "low (young protocol)", normalized: 0.45, trend: "flat", weight: 0.03, source: "manual", status: "manual" },
      },
      typed: {
        chainMaturity: { label: "Berachain mainnet age", raw: "~5 months", normalized: 0.25, trend: "up", weight: 0.14, source: "manual", status: "manual" },
        polConsensusRisk: { label: "Proof-of-Liquidity track record", raw: "novel, unproven", normalized: 0.3, trend: "flat", weight: 0.1, source: "manual", status: "manual" },
        rangeManagerRisk: { label: "Auto-range-manager complexity", raw: "moderate", normalized: 0.55, trend: "flat", weight: 0.05, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Chain", severity: "high", title: "New chain risk (Berachain)", note: "Berachain's Proof-of-Liquidity consensus mechanism has no multi-year track record; chain-level failure modes are still being discovered.", source: "manual" },
      { category: "Liquidity", severity: "medium", title: "Low liquidity / high volatility", note: "TVL and token price have both been volatile since the chain's launch.", source: "manual" },
      { category: "Smart contract", severity: "low", title: "Auto-range-manager risk", note: "Islands vaults algorithmically rebalance concentrated liquidity ranges - a manager bug affects every position in that vault.", source: "manual" },
    ],
    contracts: [
      { label: "Kodiak Islands Factory", address: "0x0Da8AA98e73dBa0f4B96a91B29E8dbA34fBB40FC", kind: "factory" },
    ],
    incidents: [],
    dependencies: [
      { type: "chain", target: "berachain", note: "Single-chain deployment on a mainnet that launched in Feb 2025." },
    ],
    askSuggestions: ["What specifically is unproven about Berachain's Proof-of-Liquidity consensus?", "How does an auto-managed Island vault differ from managing a Uniswap V3 range myself?"],
  },
  {
    id: "bunni", name: "Bunni", ticker: "BUNNI",
    aliases: [], category: "dex", chain: "ethereum", settlementLayer: null,
    kind: "Automated Uniswap V3/V4 liquidity manager",
    description: "Wraps Uniswap V3/V4 concentrated liquidity positions into fungible, auto-managed vault tokens. Suffered a real exploit in September 2024 caused by a rounding/precision bug in its liquidity-density math, not a simple reentrancy or access-control bug.",
    launchDate: "2022-11-01",
    links: { website: "https://bunni.xyz", docs: "https://docs.bunni.xyz", github: "https://github.com/timeless-fi", twitter: "https://x.com/bunni_xyz", defillama: "https://defillama.com/protocol/bunni" },
    market: { price: 0.008, marketCap: 3200000, fdv: 8000000, priceChange24h: -0.8, priceChange7d: -2.1, priceChange30d: 5.5, circulating: 400000000, maxSupply: 1000000000 },
    assessmentSummary: "Bunni's September 2024 exploit (~$8.4M) came from a subtle precision error in its custom liquidity-density function, not a well-known bug class - a reminder that automated LP managers carry math-correctness risk beyond standard reentrancy/access-control checklists. TVL and usage have been modest since.",
    riskFlags: ["v4 hook risk", "concentrated liquidity IL"],
    confidence: "medium",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$60M", normalized: 0.5, trend: "up", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+2.2%", normalized: 0.62, trend: "up", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.75, trend: "flat", weight: 0.09, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Rebalance tx volume 24h", raw: "low", normalized: 0.5, trend: "flat", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "moderate", normalized: 0.6, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "cautious", normalized: 0.5, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 new incidents", normalized: 0.8, trend: "flat", weight: 0.08, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "low", normalized: 0.5, trend: "flat", weight: 0.03, source: "manual", status: "manual" },
      },
      typed: {
        exploitHistory: { label: "Prior exploit loss", raw: "~$8.4M (Sep 2024)", normalized: 0.45, trend: "flat", weight: 0.12, source: "manual", status: "manual" },
        postIncidentAudit: { label: "Post-incident re-audit", raw: "completed", normalized: 0.7, trend: "flat", weight: 0.06, source: "manual", status: "manual" },
        hookSurface: { label: "V4 hook usage", raw: "moderate", normalized: 0.6, trend: "flat", weight: 0.05, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Smart contract", severity: "high", title: "Prior liquidity-math exploit", note: "September 2024: a rounding/precision bug in the liquidity-density function was exploited for ~$8.4M - a math-correctness bug, not a standard vulnerability class.", source: "manual" },
      { category: "Concentration", severity: "low", title: "Concentrated liquidity IL", note: "Auto-managed ranges still carry standard concentrated-liquidity impermanent-loss exposure.", source: "manual" },
    ],
    contracts: [
      { label: "BunniHub", address: "0x000000DCeb71f3107909b1b748424349bfde5493", kind: "core" },
    ],
    incidents: [
      { ts: "2024-09-02", type: "exploit", severity: "high", title: "Liquidity-density rounding exploit - ~$8.4M", note: "A precision error in custom liquidity-shape math allowed an attacker to drain multiple pools." },
    ],
    dependencies: [
      { type: "protocol", target: "uniswap-v4", note: "Built directly on Uniswap V3/V4 pool mechanics and hooks." },
    ],
    askSuggestions: ["What exactly was the math bug in the September 2024 exploit, and has it been fixed?", "How is Bunni's auto-management different from a manual concentrated liquidity position?"],
  },
  {
    id: "gmx", name: "GMX", ticker: "GMX",
    aliases: ["GMX V2", "GM Pools"], category: "dex", chain: "arbitrum", settlementLayer: "ethereum",
    kind: "Decentralized perpetuals exchange",
    description: "Leading on-chain perpetuals venue. Liquidity providers (GM pools in V2, GLP in V1) act as the counterparty to all trader positions, earning fees but also absorbing net trader PnL. V2 moved to isolated per-market GM pools instead of V1's single shared GLP pool.",
    launchDate: "2021-09-01",
    links: { website: "https://gmx.io", docs: "https://docs.gmx.io", github: "https://github.com/gmx-io", twitter: "https://x.com/GMX_IO", defillama: "https://defillama.com/protocol/gmx", audits: ["ABDK", "Guardian Audits"] },
    market: { price: 24.5, marketCap: 245000000, fdv: 245000000, priceChange24h: -0.4, priceChange7d: 1.2, priceChange30d: -9.0, circulating: 10000000, maxSupply: 10000000, rank: 145, athMultiple: "-51% from ATH ($90.85, Jan 2024)" },
    assessmentSummary: "GMX pioneered the LP-as-counterparty perp model and has run through multiple market cycles, but that counterparty structure means GM/GLP holders can lose money in strongly trending markets even with zero smart-contract bugs - it's an inherent design tradeoff, not a defect. A December 2022 oracle-spread manipulation on GMX V1 also cost the protocol ~$565K.",
    riskFlags: ["glp pool counterparty risk", "oracle manipulation surface"],
    confidence: "high",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$500M", normalized: 0.72, trend: "down", weight: 0.1, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "-0.8%", normalized: 0.65, trend: "down", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.78, trend: "flat", weight: 0.09, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Perp trading volume 24h", raw: "high", normalized: 0.8, trend: "flat", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "high", normalized: 0.82, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral-positive", normalized: 0.68, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 new incidents", normalized: 0.85, trend: "flat", weight: 0.07, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "moderate", normalized: 0.65, trend: "flat", weight: 0.03, source: "manual", status: "manual" },
      },
      typed: {
        counterpartyExposure: { label: "LP net-PnL exposure to traders", raw: "structural, ongoing", normalized: 0.55, trend: "flat", weight: 0.12, source: "manual", status: "manual" },
        oracleManipHistory: { label: "Prior oracle-spread exploit", raw: "~$565K (Dec 2022)", normalized: 0.6, trend: "flat", weight: 0.08, source: "manual", status: "manual" },
        marketIsolation: { label: "V2 isolated GM pools", raw: "yes, per-market", normalized: 0.75, trend: "flat", weight: 0.05, source: "manual", status: "manual" },
        openInterestSkew: { label: "Long/short OI skew", raw: "moderate", normalized: 0.65, trend: "flat", weight: 0.04, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Market design", severity: "medium", title: "LP-as-counterparty structure", note: "GM/GLP liquidity providers take the opposite side of every trader's position - in a strongly trending market, LPs can lose money even with flawless code.", source: "manual" },
      { category: "Oracle", severity: "medium", title: "Prior oracle-spread manipulation", note: "December 2022: a trader exploited GMX V1's oracle spread mechanics for ~$565K; V2's design narrows but doesn't eliminate this surface.", source: "manual" },
      { category: "Concentration", severity: "low", title: "Open interest skew", note: "One-sided positioning in a market increases the LP pool's directional exposure.", source: "manual" },
    ],
    contracts: [
      { label: "GMX V2 Exchange Router", address: "0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8", kind: "router" },
    ],
    incidents: [
      { ts: "2022-12-27", type: "exploit", severity: "medium", title: "Oracle spread manipulation - ~$565K", note: "A trader exploited AVAX price-spread mechanics on GMX V1 to extract profit from the GLP pool." },
    ],
    dependencies: [
      { type: "chain", target: "arbitrum", note: "Primary deployment; also live on Avalanche." },
      { type: "oracle", target: "chainlink", note: "Low-latency price feeds for perp mark prices." },
    ],
    askSuggestions: ["Can GM pool liquidity providers actually lose money even if nothing gets hacked?", "How did V2's isolated pools change risk versus V1's single GLP pool?"],
  },
  {
    id: "ichi", name: "ICHI", ticker: "ICHI",
    aliases: ["ICHI Vaults"], category: "dex", chain: "ethereum", settlementLayer: null,
    kind: "Single-sided concentrated liquidity vaults",
    description: "ICHI Vaults let projects and users provide single-sided concentrated liquidity (deposit only one token) into a Uniswap V3-style range that's automatically managed. Niche relative to major DEXs, with TVL concentrated in a smaller set of partner-token vaults.",
    launchDate: "2020-11-01",
    links: { website: "https://ichi.org", docs: "https://docs.ichi.org", github: "https://github.com/ichifarm", twitter: "https://x.com/ichifarm", defillama: "https://defillama.com/protocol/ichi-vaults" },
    market: { price: 12.8, marketCap: 3800000, fdv: 12800000, priceChange24h: 0.6, priceChange7d: -3.0, priceChange30d: -18.0, circulating: 297000, maxSupply: 1000000, rank: 1650, athMultiple: "-99% from ATH ($3,313, Feb 2021)" },
    assessmentSummary: "A niche, smaller-TVL single-sided liquidity primitive. Structurally sound (built on audited Uniswap V3 mechanics), but low liquidity, thin trading volume in the ICHI token itself, and concentration in a handful of partner vaults mean the practical downside is more about scale and exit liquidity than a specific known exploit.",
    riskFlags: ["single-sided IL exposure", "smaller protocol"],
    confidence: "low",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$40M", normalized: 0.4, trend: "up", weight: 0.12, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+0.9%", normalized: 0.6, trend: "up", weight: 0.06, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.75, trend: "flat", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Vault rebalance volume 24h", raw: "low", normalized: 0.45, trend: "flat", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "low", normalized: 0.45, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral", normalized: 0.5, trend: "flat", weight: 0.03, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.85, trend: "flat", weight: 0.06, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "low", normalized: 0.4, trend: "flat", weight: 0.03, source: "manual", status: "manual" },
      },
      typed: {
        vaultConcentration: { label: "TVL in top-3 vaults", raw: "high", normalized: 0.45, trend: "flat", weight: 0.1, source: "manual", status: "manual" },
        exitLiquidity: { label: "ICHI token trading depth", raw: "thin", normalized: 0.4, trend: "flat", weight: 0.05, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Concentration", severity: "medium", title: "Vault TVL concentration", note: "A large share of TVL sits in a small number of partner-token vaults.", source: "DeFiLlama" },
      { category: "Liquidity", severity: "medium", title: "Thin exit liquidity", note: "Small market cap and trading volume make large position exits costly.", source: "manual" },
      { category: "Market", severity: "low", title: "Single-sided IL exposure", note: "Depositing one token into a managed range still carries standard concentrated-liquidity IL as the range moves.", source: "manual" },
    ],
    contracts: [
      { label: "ICHI Vault Factory", address: "0x2d2c72C4dC71AA32D66D9e9385D3c1F6a9F5CaAa", kind: "factory" },
    ],
    incidents: [],
    dependencies: [
      { type: "protocol", target: "uniswap-v3", note: "Vaults manage positions directly on Uniswap V3 pools." },
    ],
    askSuggestions: ["What's the actual exit liquidity like if I need to withdraw a large position?", "How concentrated is ICHI's TVL in a small number of vaults?"],
  },
  {
    id: "pendle", name: "Pendle", ticker: "PENDLE",
    aliases: ["Pendle Finance"], category: "lending", chain: "ethereum", settlementLayer: null,
    kind: "Yield tokenization protocol",
    description: "Splits yield-bearing assets into Principal Tokens (PT, redeemable 1:1 at maturity) and Yield Tokens (YT, claim on the yield stream). Lets users fix yield, speculate on yield direction, or trade discounted principal. TVL has grown enormously alongside points/airdrop farming demand.",
    launchDate: "2021-06-01",
    links: { website: "https://pendle.finance", docs: "https://docs.pendle.finance", github: "https://github.com/pendle-finance", twitter: "https://x.com/pendle_fi", defillama: "https://defillama.com/protocol/pendle", audits: ["ABDK", "Dedaub", "WatchPug"] },
    market: { price: 4.9, marketCap: 970000000, fdv: 1470000000, priceChange24h: 1.8, priceChange7d: 6.5, priceChange30d: 15.0, circulating: 198000000, maxSupply: 300000000, rank: 58, athMultiple: "-38% from ATH ($7.51, Dec 2024)" },
    assessmentSummary: "Pendle's TVL growth has been substantial, much of it correlated with points/airdrop farming cycles on underlying yield sources rather than pure fixed-yield demand - a real dependency on external incentive trends. The PT/YT AMM math is more complex than a standard swap pool, and every position ultimately inherits the risk of whatever underlying yield-bearing asset was tokenized.",
    riskFlags: ["yield-tokenization complexity", "underlying protocol dependency"],
    confidence: "medium",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$4.5B", normalized: 0.85, trend: "up", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+4.1%", normalized: 0.82, trend: "up", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.8, trend: "flat", weight: 0.09, source: "Alchemy Transfers", status: "live" },
        activity: { label: "PT/YT swap volume 24h", raw: "high", normalized: 0.82, trend: "up", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "high", normalized: 0.85, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "positive", normalized: 0.8, trend: "up", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.92, trend: "flat", weight: 0.07, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "active", normalized: 0.72, trend: "flat", weight: 0.04, source: "Snapshot", status: "manual" },
      },
      typed: {
        pointsFarmingDependency: { label: "TVL tied to points/airdrop cycles", raw: "significant", normalized: 0.5, trend: "flat", weight: 0.1, source: "manual", status: "manual" },
        underlyingAssetDiversity: { label: "Tokenized yield-source diversity", raw: "broad (LSDs, LP tokens, RWAs)", normalized: 0.75, trend: "up", weight: 0.05, source: "manual", status: "manual" },
        maturityConcentration: { label: "TVL concentration by maturity", raw: "moderate", normalized: 0.6, trend: "flat", weight: 0.04, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Dependency", severity: "medium", title: "Underlying yield-source risk pass-through", note: "A PT/YT position is only as safe as the yield-bearing asset it wraps - a depeg or exploit in the underlying passes straight through.", source: "manual" },
      { category: "Market", severity: "medium", title: "Points-farming TVL dependency", note: "A meaningful share of TVL growth tracks points/airdrop farming cycles rather than pure fixed-yield demand, which can reverse when those cycles end.", source: "manual" },
      { category: "Smart contract", severity: "low", title: "AMM complexity", note: "PT/YT pricing math is more involved than a standard constant-product pool.", source: "manual" },
    ],
    contracts: [
      { label: "Pendle Router V4", address: "0x888888888889758F76e7103c6CbF23ABbF58F946", kind: "router" },
    ],
    incidents: [],
    dependencies: [
      { type: "protocol", target: "many", note: "Each market tokenizes a specific underlying yield source (LSDs, LP tokens, lending receipts, etc.), inheriting that source's risk." },
    ],
    askSuggestions: ["How much of Pendle's current TVL is airdrop-farming-driven versus organic fixed-yield demand?", "If the underlying asset I tokenized depegs, what happens to my PT/YT position?"],
  },
  {
    id: "shadow", name: "Shadow Exchange", ticker: "SHADOW",
    aliases: [], category: "dex", chain: "sonic", settlementLayer: null,
    kind: "ve(3,3) concentrated liquidity AMM",
    description: "Sonic chain's leading native DEX, combining Solidly-style ve(3,3) emission mechanics with Uniswap V3-style concentrated liquidity. Tightly coupled to Sonic's growth (formerly Fantom, relaunched with a new VM and incentive program in 2025).",
    launchDate: "2024-12-01",
    links: { website: "https://www.shadow.so", docs: "https://docs.shadow.so", twitter: "https://x.com/ShadowOnSonic", defillama: "https://defillama.com/protocol/shadow-exchange" },
    market: { price: 8.2, marketCap: 16000000, fdv: 41000000, priceChange24h: -1.8, priceChange7d: -5.2, priceChange30d: -15.0, circulating: 1950000, maxSupply: 5000000 },
    assessmentSummary: "Shadow has grown quickly as Sonic's dominant DEX, but both the application and its host chain are young. Sonic's relaunch (from Fantom) is still building a multi-cycle track record, and emissions-heavy ve(3,3) tokenomics tend to produce TVL that's more mercenary than sticky.",
    riskFlags: ["new chain risk (sonic)", "concentrated liquidity risk"],
    confidence: "low",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$120M", normalized: 0.48, trend: "down", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "-3.8%", normalized: 0.4, trend: "down", weight: 0.06, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "moderate", normalized: 0.5, trend: "down", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Swap tx volume 24h", raw: "moderate", normalized: 0.55, trend: "flat", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "high", normalized: 0.78, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "mixed", normalized: 0.5, trend: "down", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.8, trend: "flat", weight: 0.06, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity (ve gauge votes)", raw: "active", normalized: 0.65, trend: "flat", weight: 0.03, source: "manual", status: "manual" },
      },
      typed: {
        chainMaturity: { label: "Sonic mainnet age (relaunch)", raw: "~8 months", normalized: 0.35, trend: "up", weight: 0.13, source: "manual", status: "manual" },
        emissionDependency: { label: "TVL sensitivity to emissions", raw: "high", normalized: 0.4, trend: "flat", weight: 0.09, source: "manual", status: "manual" },
        veLockedShare: { label: "Supply locked as ve(3,3)", raw: "moderate", normalized: 0.55, trend: "flat", weight: 0.04, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Chain", severity: "high", title: "New chain risk (Sonic)", note: "Sonic's current form is a relatively recent relaunch; chain-level infrastructure has a short independent track record.", source: "manual" },
      { category: "Tokenomics", severity: "medium", title: "Emission-driven TVL", note: "ve(3,3) mechanics reward mercenary liquidity that can rotate out quickly when emissions favor another venue.", source: "manual" },
      { category: "Market", severity: "low", title: "Concentrated liquidity risk", note: "Standard V3-style range risk applies on top of chain and emission risk.", source: "manual" },
    ],
    contracts: [
      { label: "Shadow Voter", address: "0x9F59349bDa2Aa4b8CDA0C46E0eF77e2C7Efd5ba1", kind: "governance" },
    ],
    incidents: [],
    dependencies: [
      { type: "chain", target: "sonic", note: "Single-chain deployment on Sonic's relaunched mainnet." },
    ],
    askSuggestions: ["How mature is Sonic as a chain compared to established L1s/L2s?", "How much of Shadow's TVL would leave if emissions dropped?"],
  },
  {
    id: "silo", name: "Silo Finance", ticker: "SILO",
    aliases: ["Silo V2"], category: "lending", chain: "ethereum", settlementLayer: null,
    kind: "Isolated-pair lending markets",
    description: "Every asset gets its own isolated lending market (\"silo\") paired against a bridge asset, so a bad listing or oracle failure in one silo can't directly cause bad debt in another - a similar isolation philosophy to Morpho Blue, arrived at independently and earlier.",
    launchDate: "2021-09-01",
    links: { website: "https://silo.finance", docs: "https://docs.silo.finance", github: "https://github.com/silo-finance", twitter: "https://x.com/SiloFinance", defillama: "https://defillama.com/protocol/silo-v2", audits: ["ABDK", "Sigma Prime", "Trail of Bits"] },
    market: { price: 0.065, marketCap: 45000000, fdv: 65000000, priceChange24h: 0.3, priceChange7d: 1.0, priceChange30d: -4.0, circulating: 692000000, maxSupply: 1000000000, rank: 380, athMultiple: "-92% from ATH ($0.82, Sep 2021)" },
    assessmentSummary: "Silo's isolated-market design directly targets DeFi lending's classic contagion problem, and the protocol has run for several years without a direct exploit. TVL is modest relative to Aave/Compound, and per-silo oracle quality varies, since anyone can permissionlessly create a new silo - the isolation protects other silos, not necessarily depositors in a poorly configured one.",
    riskFlags: ["isolated market risk", "oracle dependency"],
    confidence: "medium",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$280M", normalized: 0.6, trend: "up", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+1.6%", normalized: 0.7, trend: "up", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.8, trend: "flat", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        liquidations: { label: "Liquidation rate 24h", raw: "$0.3M (normal)", normalized: 0.85, trend: "flat", weight: 0.07, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "moderate", normalized: 0.68, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral", normalized: 0.6, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.9, trend: "flat", weight: 0.07, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "moderate", normalized: 0.62, trend: "flat", weight: 0.04, source: "Snapshot", status: "manual" },
      },
      typed: {
        marketIsolation: { label: "Cross-silo contagion protection", raw: "structural", normalized: 0.85, trend: "flat", weight: 0.09, source: "manual", status: "manual" },
        permissionlessListing: { label: "Silo creation permission", raw: "permissionless", normalized: 0.5, trend: "flat", weight: 0.07, source: "manual", status: "manual" },
        badDebt: { label: "Bad debt across silos", raw: "isolated, low aggregate", normalized: 0.78, trend: "flat", weight: 0.06, source: "subgraph", status: "live" },
      },
    },
    risk: [
      { category: "Isolation", severity: "low", title: "Isolated market design", note: "Bad debt in one silo cannot directly spread to another - the core value proposition, and it has held up in practice.", source: "manual" },
      { category: "Listing", severity: "medium", title: "Permissionless silo creation", note: "Anyone can create a new silo; oracle and asset quality varies market-to-market, and isolation protects other silos, not depositors in a poorly built one.", source: "manual" },
      { category: "Oracle", severity: "low", title: "Per-silo oracle dependency", note: "Each silo's safety depends on its own configured price oracle.", source: "manual" },
    ],
    contracts: [
      { label: "SiloFactory", address: "0x6d22C7B9739C7ec03F1af58f9E3C7D8D6a76E7f1", kind: "factory" },
    ],
    incidents: [],
    dependencies: [
      { type: "oracle", target: "chainlink", note: "Most silos price via Chainlink, configured per-market at creation." },
    ],
    askSuggestions: ["Since anyone can create a silo, how do I know a specific market is well-configured?", "How does Silo's isolation actually prevent contagion compared to a pooled lending market?"],
  },
  {
    id: "tokemak", name: "Tokemak", ticker: "TOKE",
    aliases: ["Tokemak V2", "Auto-pools"], category: "lending", chain: "ethereum", settlementLayer: null,
    kind: "Liquidity-direction protocol",
    description: "Auto-pools accept a single deposit asset and algorithmically route it across multiple underlying DEX/lending venues to optimize risk-adjusted yield, rebalancing as conditions change. Pivoted to this design in V2 after V1's original 'liquidity reactor' model struggled to sustain itself.",
    launchDate: "2021-06-01",
    links: { website: "https://tokemak.xyz", docs: "https://docs.tokemak.xyz", github: "https://github.com/Tokemak", twitter: "https://x.com/Tokemak", defillama: "https://defillama.com/protocol/tokemak" },
    market: { price: 0.11, marketCap: 5600000, fdv: 8800000, priceChange24h: -0.5, priceChange7d: -2.8, priceChange30d: -10.0, circulating: 51000000, maxSupply: 80000000, rank: 950, athMultiple: "-99% from ATH ($22.42, Sep 2021)" },
    assessmentSummary: "Tokemak V2's Auto-pools model is a meaningful redesign after V1 struggled to sustain its original tokenomics, but the protocol is now smaller and less battle-tested in its current form than its multi-year brand history might suggest. Rebalancing logic that spans multiple external venues adds real operational complexity.",
    riskFlags: ["auto-rebalancing risk", "smaller protocol"],
    confidence: "low",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$25M", normalized: 0.32, trend: "down", weight: 0.12, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "-2.0%", normalized: 0.45, trend: "down", weight: 0.06, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "moderate", normalized: 0.5, trend: "down", weight: 0.1, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Rebalance tx volume 24h", raw: "low", normalized: 0.45, trend: "flat", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "low", normalized: 0.4, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "neutral", normalized: 0.48, trend: "flat", weight: 0.03, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.85, trend: "flat", weight: 0.06, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "low", normalized: 0.42, trend: "flat", weight: 0.03, source: "manual", status: "manual" },
      },
      typed: {
        strategyComplexity: { label: "Cross-venue rebalancing surface", raw: "multiple external protocols", normalized: 0.45, trend: "flat", weight: 0.12, source: "manual", status: "manual" },
        v1LegacyOverhang: { label: "V1-to-V2 migration status", raw: "mostly complete", normalized: 0.6, trend: "up", weight: 0.05, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Smart contract", severity: "medium", title: "Cross-venue rebalancing complexity", note: "Auto-pools route capital across multiple external DEX/lending venues; a bug or failure in any downstream venue's integration affects the pool.", source: "manual" },
      { category: "Scale", severity: "low", title: "Smaller, less battle-tested TVL base", note: "Current V2 form has a shorter, smaller track record than the protocol's multi-year brand history implies.", source: "manual" },
    ],
    contracts: [
      { label: "Auto-pool Factory", address: "0x94E4A9679a1dEd0Cd6dF11Fd5eeB74d76F94a1AA", kind: "factory" },
    ],
    incidents: [],
    dependencies: [
      { type: "protocol", target: "many", note: "Auto-pools allocate across multiple underlying DEX/lending venues, inheriting each one's risk while deployed there." },
    ],
    askSuggestions: ["How is V2's Auto-pools model different from what Tokemak originally launched with?", "What venues is a given Auto-pool currently allocated across?"],
  },
  {
    id: "velodrome", name: "Velodrome", ticker: "VELO",
    aliases: ["Velodrome Finance"], category: "dex", chain: "optimism", settlementLayer: "ethereum",
    kind: "ve(3,3) automated market maker",
    description: "The dominant native DEX on the OP Superchain, combining Solidly's ve(3,3) design (vote-locked emissions directing liquidity) with both stable and volatile pool types. Deeply embedded in Optimism ecosystem incentive programs.",
    launchDate: "2022-06-01",
    links: { website: "https://velodrome.finance", docs: "https://docs.velodrome.finance", github: "https://github.com/velodrome-finance", twitter: "https://x.com/VelodromeFi", defillama: "https://defillama.com/protocol/velodrome-finance", audits: ["Spearbit", "Trail of Bits"] },
    market: { price: 0.062, marketCap: 88000000, fdv: 124000000, priceChange24h: 0.7, priceChange7d: 3.5, priceChange30d: 8.0, circulating: 1420000000, maxSupply: 2000000000, rank: 220, athMultiple: "-88% from ATH ($0.52, Jun 2022)" },
    assessmentSummary: "Velodrome has been the OP Superchain's dominant liquidity venue for multiple years with a clean security record and deep integration into Optimism's own incentive programs - a genuine strength, but also a real concentration: its fortunes are tied closely to Optimism/OP-Stack chain health specifically.",
    riskFlags: ["emissions dilution", "op chain concentration"],
    confidence: "high",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$400M", normalized: 0.72, trend: "up", weight: 0.1, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "+2.6%", normalized: 0.78, trend: "up", weight: 0.05, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "low", normalized: 0.82, trend: "flat", weight: 0.09, source: "Alchemy Transfers", status: "live" },
        activity: { label: "Swap tx volume 24h", raw: "high", normalized: 0.8, trend: "up", weight: 0.05, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "high", normalized: 0.82, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "positive", normalized: 0.75, trend: "flat", weight: 0.04, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "0 incidents", normalized: 0.93, trend: "flat", weight: 0.07, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity (ve gauge votes)", raw: "very active", normalized: 0.8, trend: "flat", weight: 0.04, source: "manual", status: "manual" },
      },
      typed: {
        opChainConcentration: { label: "OP Superchain TVL share", raw: "dominant", normalized: 0.55, trend: "flat", weight: 0.09, source: "manual", status: "manual" },
        emissionInflation: { label: "VELO emission dilution rate", raw: "moderate, decaying schedule", normalized: 0.6, trend: "flat", weight: 0.07, source: "manual", status: "manual" },
        veLockedShare: { label: "Supply locked as veVELO", raw: "high", normalized: 0.75, trend: "flat", weight: 0.04, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Concentration", severity: "medium", title: "OP Superchain concentration", note: "Velodrome's fortunes are closely tied to Optimism/OP-Stack chain health and incentive programs specifically.", source: "manual" },
      { category: "Tokenomics", severity: "low", title: "Emission dilution", note: "Continuous VELO emissions to liquidity providers dilute non-staking holders over time, on a decaying schedule.", source: "manual" },
    ],
    contracts: [
      { label: "Velodrome V2 Router", address: "0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858", kind: "router" },
    ],
    incidents: [],
    dependencies: [
      { type: "chain", target: "optimism", note: "Primary and dominant deployment on the OP Superchain." },
    ],
    askSuggestions: ["How exposed is Velodrome specifically to Optimism chain-level issues versus general DEX risk?", "How fast does VELO emission dilution actually run?"],
  },
  {
    id: "abracadabra", name: "Abracadabra", ticker: "SPELL",
    aliases: ["Abracadabra Money", "MIM"], category: "cdp", chain: "ethereum", settlementLayer: null,
    kind: "CDP stablecoin issuer (MIM)",
    description: "Issues MIM (Magic Internet Money), a stablecoin minted against yield-bearing collateral (interest-bearing tokens, LP positions) through isolated 'Cauldron' markets. Has a real, repeated history of depeg events and a March 2025 exploit, making its risk profile materially different from more conservative CDP issuers.",
    launchDate: "2021-05-01",
    links: { website: "https://abracadabra.money", docs: "https://docs.abracadabra.money", github: "https://github.com/Abracadabra-money", twitter: "https://x.com/MIM_Spell", defillama: "https://defillama.com/protocol/abracadabra" },
    market: { price: 0.0004, marketCap: 24000000, fdv: 24000000, priceChange24h: -2.1, priceChange7d: -7.5, priceChange30d: -20.0, circulating: 60000000000, maxSupply: 60000000000, rank: 480, athMultiple: "-99.98% from ATH ($15.79, Apr 2021)" },
    assessmentSummary: "MIM has depegged multiple times, most notably during the May 2022 Terra/UST contagion when CRV-collateral exposure raised solvency concerns, and a March 2025 exploit drained roughly $13M via price manipulation of a specific Cauldron. Each isolated Cauldron carries its own collateral-specific risk, but the protocol's overall track record is the weakest of the CDP-style protocols in this set.",
    riskFlags: ["past depeg events", "leveraged position risk"],
    confidence: "medium",
    signals: {
      onchain: {
        tvl: { label: "Total value locked", raw: "$150M", normalized: 0.42, trend: "down", weight: 0.11, source: "DeFiLlama", status: "live", unit: "USD" },
        tvlDelta7d: { label: "TVL 7d change", raw: "-4.2%", normalized: 0.35, trend: "down", weight: 0.06, source: "DeFiLlama", status: "live" },
        whaleOutflow: { label: "Whale outflows 24h", raw: "elevated", normalized: 0.4, trend: "down", weight: 0.11, source: "Alchemy Transfers", status: "live" },
        liquidations: { label: "Cauldron liquidations 24h", raw: "elevated", normalized: 0.45, trend: "down", weight: 0.08, source: "subgraph", status: "live" },
      },
      offchain: {
        githubVelocity: { label: "Commit velocity (30d)", raw: "moderate", normalized: 0.55, trend: "flat", weight: 0.05, source: "GitHub REST", status: "live" },
        sentiment: { label: "Social sentiment", raw: "negative", normalized: 0.35, trend: "down", weight: 0.05, source: "LunarCrush", status: "manual" },
        securityNews: { label: "Security events (90d)", raw: "recent exploit history", normalized: 0.4, trend: "down", weight: 0.09, source: "DeFiLlama Hacks", status: "live" },
        governance: { label: "Governance activity", raw: "low", normalized: 0.45, trend: "flat", weight: 0.03, source: "manual", status: "manual" },
      },
      typed: {
        pegDeviation: { label: "MIM / USD peg", raw: "~0.98, historically volatile", normalized: 0.55, trend: "down", weight: 0.13, source: "oracle", status: "live" },
        depegHistory: { label: "Prior depeg events", raw: "multiple (2022, 2023)", normalized: 0.35, trend: "flat", weight: 0.1, source: "manual", status: "manual" },
        exploitHistory: { label: "Prior exploit loss", raw: "~$13M (Mar 2025)", normalized: 0.35, trend: "flat", weight: 0.09, source: "manual", status: "manual" },
        collateralQuality: { label: "Cauldron collateral risk", raw: "mixed, some illiquid/volatile", normalized: 0.45, trend: "flat", weight: 0.06, source: "manual", status: "manual" },
      },
    },
    risk: [
      { category: "Peg", severity: "high", title: "Repeated depeg history", note: "MIM has depegged multiple times, most notably during the May 2022 Terra/UST contagion when CRV-collateral solvency concerns spread.", source: "manual" },
      { category: "Smart contract", severity: "high", title: "March 2025 Cauldron exploit", note: "A specific Cauldron market was drained for roughly $13M via price manipulation of its collateral oracle.", source: "manual" },
      { category: "Collateral", severity: "medium", title: "Leveraged/illiquid collateral", note: "Some Cauldrons accept volatile or thinly-liquid collateral, increasing liquidation-cascade risk under stress.", source: "manual" },
    ],
    contracts: [
      { label: "MIM Token", address: "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3", kind: "token" },
    ],
    incidents: [
      { ts: "2022-05-12", type: "depeg", severity: "high", title: "MIM depeg during Terra/UST contagion", note: "CRV-collateral solvency fears during the broader Terra collapse pushed MIM meaningfully off peg for several days." },
      { ts: "2025-03-25", type: "exploit", severity: "high", title: "Cauldron exploit - ~$13M", note: "Price manipulation of a specific Cauldron's collateral valuation allowed over-minting of MIM against undercollateralized positions." },
    ],
    dependencies: [
      { type: "collateral", target: "various", note: "Each Cauldron accepts a specific yield-bearing or LP collateral type, with risk varying market-to-market." },
    ],
    askSuggestions: ["Given the depeg and exploit history, is MIM meaningfully riskier than other CDP stablecoins today?", "What collateral backs the specific Cauldron I'd be exposed to?"],
  },
];
