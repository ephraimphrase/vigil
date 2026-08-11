import { createConfig, factory } from "ponder";
import {
  type AbiEvent,
  createPublicClient,
  type GetLogsReturnType,
  getAbiItem,
  http,
} from "viem";

import { readFileSync } from "node:fs";

import { HealthOracleAbi } from "./abis/HealthOracleAbi";
import { StrategyAdapterAbi } from "./abis/StrategyAdapterAbi";
import { VaultFactoryAbi } from "./abis/VaultFactoryAbi";
import { VigilVaultAbi } from "./abis/VigilVaultAbi";

// Base Sepolia only. Addresses are read from
// apps/contracts/data/84532/deployedContracts.json - the actual source of
// truth every deploy script writes to - rather than duplicated here as
// hardcoded strings that could drift if that file ever changes (it's
// already been manually edited/restored more than once this session).
const deployedContracts: Record<string, `0x${string}`> = JSON.parse(
  readFileSync(
    new URL("../contracts/data/84532/deployedContracts.json", import.meta.url),
    "utf-8",
  ),
);
const VAULT_FACTORY_ADDRESS = deployedContracts.VaultFactory!;
const HEALTH_ORACLE_ADDRESS = deployedContracts.HealthOracle!;
// Not in deployedContracts.json (that file only has addresses) - found once
// via Basescan's contract-creation lookup and hardcoded, since neither
// contract has been redeployed since.
// VaultFactory was redeployed fresh during the 40-vault reseed on Base
// Sepolia (block from the real deploy tx receipt); HealthOracle was reused
// as-is, so its start block is unchanged.
const VAULT_FACTORY_START_BLOCK = 45358036;
const HEALTH_ORACLE_START_BLOCK = 45240276;

const rpcUrl = process.env.PONDER_RPC_URL_84532 ?? "https://sepolia.base.org";

// Vault addresses aren't known ahead of time - discovered dynamically from
// VaultFactory's own VaultCreated event, so every vault gets indexed as
// it's created without needing a config change.
const vaultsFactory = factory({
  address: VAULT_FACTORY_ADDRESS,
  event: getAbiItem({ abi: VaultFactoryAbi, name: "VaultCreated" }),
  parameter: "vault",
});

// StrategyAdapter instances aren't created by an on-chain factory
// contract - each one is deployed directly (new MockStrategyAdapter(...),
// the actual contract type) by a deploy script, then wired in via
// VigilVault.addAdapter(). So there's
// no single factory contract/event Ponder's factory() can point at (it only
// accepts a static address or list, not another factory() - no chaining a
// third level deep off the already-dynamic vault set). Instead: resolve the
// current adapter set once here, at config-load time, by directly querying
// every vault's AdapterAdded logs. This runs as a real top-level await -
// ponder.config.ts is a plain ESM module, and Ponder's config loader
// (vite-node) awaits the whole module before reading its default export -
// so this genuinely blocks config resolution on a real RPC round trip.
// Tradeoff: an adapter added while the process is already running won't be
// picked up until the next restart. `ponder dev` restarts on every file
// save, so that's rarely noticeable there; `ponder start` needs a manual
// restart to pick up newly-added adapters.
// sepolia.base.org (the public RPC) caps eth_getLogs at a 2000-block
// range per call, so a single fromBlock->latest query fails outright once
// the chain's moved on far enough - paginate in chunks instead.
const MAX_BLOCK_RANGE = 2000n;

async function getLogsPaginated<const event extends AbiEvent>(
  client: ReturnType<typeof createPublicClient>,
  address: `0x${string}` | `0x${string}`[],
  event_: event,
  fromBlock: bigint,
) {
  const latest = await client.getBlockNumber();
  const logs: GetLogsReturnType<event>[number][] = [];
  for (let from = fromBlock; from <= latest; from += MAX_BLOCK_RANGE + 1n) {
    const to =
      from + MAX_BLOCK_RANGE < latest ? from + MAX_BLOCK_RANGE : latest;
    logs.push(
      ...(await client.getLogs({
        address,
        event: event_,
        fromBlock: from,
        toBlock: to,
      })),
    );
  }
  return logs;
}

async function resolveAdapterAddresses(): Promise<readonly `0x${string}`[]> {
  const client = createPublicClient({ transport: http(rpcUrl) });

  const vaultCreatedLogs = await getLogsPaginated(
    client,
    VAULT_FACTORY_ADDRESS,
    getAbiItem({ abi: VaultFactoryAbi, name: "VaultCreated" }),
    BigInt(VAULT_FACTORY_START_BLOCK),
  );
  const vaultAddresses = vaultCreatedLogs.map((log) => log.args.vault!);
  if (vaultAddresses.length === 0) return [];

  const adapterAddedLogs = await getLogsPaginated(
    client,
    vaultAddresses,
    getAbiItem({ abi: VigilVaultAbi, name: "AdapterAdded" }),
    BigInt(VAULT_FACTORY_START_BLOCK),
  );
  return [...new Set(adapterAddedLogs.map((log) => log.args.adapter!))];
}

const adapterAddresses = await resolveAdapterAddresses();

export default createConfig({
  // Real Postgres instead of the default embedded pglite - pglite kept
  // corrupting/locking its on-disk WAL across restarts during local
  // testing. Points at the same local Postgres apps/web's Drizzle setup
  // uses (DATABASE_URL), but under its own "ponder" schema so it never
  // touches apps/web's tables.
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  chains: {
    baseSepolia: {
      id: 84532,
      rpc: http(rpcUrl),
    },
  },
  contracts: {
    VaultFactory: {
      chain: "baseSepolia",
      abi: VaultFactoryAbi,
      address: VAULT_FACTORY_ADDRESS,
      // Factory's own creation block (via Basescan) - no vaults could
      // exist before this, so indexing from genesis would just waste
      // time scanning empty blocks.
      startBlock: VAULT_FACTORY_START_BLOCK,
    },
    VigilVault: {
      chain: "baseSepolia",
      abi: VigilVaultAbi,
      address: vaultsFactory,
      startBlock: VAULT_FACTORY_START_BLOCK,
    },
    HealthOracle: {
      chain: "baseSepolia",
      abi: HealthOracleAbi,
      address: HEALTH_ORACLE_ADDRESS,
      // HealthOracle's own creation block (via Basescan) - deployed
      // before VaultFactory, so it gets its own earlier startBlock.
      startBlock: HEALTH_ORACLE_START_BLOCK,
    },
    StrategyAdapter: {
      chain: "baseSepolia",
      abi: StrategyAdapterAbi,
      // Ponder rejects an empty address array, and a fresh chain with no
      // vaults yet legitimately has zero adapters - falls back to the zero
      // address (matches no real contract, so this just watches nothing)
      // rather than conditionally omitting the whole contract group, which
      // would make its TS type optional and break event-name inference
      // for every StrategyAdapter:* handler in src/index.ts.
      address:
        adapterAddresses.length > 0
          ? adapterAddresses
          : (["0x0000000000000000000000000000000000000000"] as const),
      startBlock: VAULT_FACTORY_START_BLOCK,
    },
  },
});
