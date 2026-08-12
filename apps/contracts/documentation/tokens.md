# Tokens: WETH9, SeedTokenFactory, SeedToken

## WETH9 (`src/token/WETH9.sol`)

Standard wrapped-ether: `deposit()`/`receive()` mints 1:1 against ETH sent
in, `withdraw(amount)` burns and sends ETH back. Nothing Vigil-specific
about it.

**It is not actually deployed on Base or Base Sepolia.** Both chains
already have a real WETH9 at the canonical OP-stack predeploy address
`0x4200000000000000000000000000000000000006`. `DeployWETH.s.sol` detects
this (any chain id other than local anvil's 31337) and just registers that
predeploy address into `deployedContracts.json` under the `WETH9` key
instead of deploying anything — so from every other script's point of view,
"the WETH9 address" always resolves correctly regardless of chain.

## SeedTokenFactory + SeedToken (`src/token/SeedTokenFactory.sol`, `SeedToken.sol`)

A minimal-proxy (EIP-1167 clone) factory for stamping out lightweight ERC20
tokens that stand in for real DeFi tokens (steth, aave, uni, ...) on a
testnet where the real tokens don't exist or aren't easily obtainable.

**Deployment flow** (`SeedTokens.s.sol`, run on local anvil or Base
Sepolia):

1. Shells out to `script/shell/_pull_defi_tokens.sh`, which hits
   CoinGecko's markets API for the top ~500 tokens by market cap in the
   `decentralized-finance-defi` category, filters out dead/illiquid ones
   (`market_cap > $1M`, `total_volume > 0`), and emits `{logo, name, symbol}`
   for each.
2. Deploys one `SeedTokenFactory` (itself deploys one `SeedToken`
   implementation contract in its constructor).
3. For each fetched token, calls `factory.deployToken(name, symbol)`, which:
   - Clones the implementation (`Clones.clone`, cheap — just a proxy that
     delegates to the shared implementation's code).
   - Calls `initialize(name, symbol, 1_000_000 ether, deployer)` on the
     clone, which sets the name/symbol and mints the deployer the entire
     1,000,000-token initial supply. Can only run once (`initializer`
     modifier + `_disableInitializers()` in the constructor blocks
     initializing the implementation contract itself).
   - Skips (logs, doesn't revert) if a token with that symbol was already
     deployed by this factory — CoinGecko occasionally lists more than one
     token under the same symbol (wrapped/bridged variants).
4. Writes every deployed `{token, symbol, name, decimals, logoURI}` to
   `data/<chainId>/token.json`.

**`MAX_TOKENS`** caps how many of the fetched tokens actually get deployed —
unset, it deploys everything the fetch script returned (typically 400-460
after filtering), which is a lot of real transactions on a public chain.

### `mint(uint256 amount)` — the testnet faucet hook

```solidity
function mint(uint256 amount) external {
    _mint(msg.sender, amount);
}
```

Fully permissionless: **any address can mint itself any amount of any
`SeedToken`.** This is intentional, not an oversight — these tokens only
ever exist behind `SeedTokenFactory` on local/Base Sepolia deployments, so
there's no real value to protect. It exists specifically so `Faucet.claim()`
can mint fresh supply per claim instead of needing a pre-funded balance (see
[`faucet.md`](./faucet.md)), and so anyone can self-serve test tokens
directly:

```
cast send <SEED_TOKEN_ADDRESS> "mint(uint256)" <AMOUNT_WEI> --rpc-url $RPC_URL --private-key <KEY>
```

### Why a clone factory instead of deploying each token's full bytecode

`SeedToken` itself is a normal (if minimal) ERC20; what's cloned is just its
already-deployed bytecode via `DELEGATECALL` proxying. With ~450 tokens
deployed per run, this matters: a full `new SeedToken()` per token would cost
full contract-creation gas ~450 times, versus one implementation deploy plus
~450 cheap `CREATE` calls of a ~45-byte proxy each.
