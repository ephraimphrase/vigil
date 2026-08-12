# Faucet (`src/token/Faucet.sol`)

Testnet faucet for `SeedToken` clones. Mints fresh supply on every claim
rather than paying out of a balance it holds — see below for why that's a
meaningful design choice, not an implementation detail.

## `claim` / `claimMany`

```solidity
function claim(address token) external nonReentrant
function claimMany(address[] calldata tokens) external nonReentrant
```

Both mint `CLAIM_AMOUNT` (1,000 tokens, 18 decimals) of `token` and send it
to `msg.sender`, gated by:

- **`isSupportedToken[token]`** — set via `setSupportedTokens` (owner-only).
  `claim`/`claimMany` revert `UnsupportedToken(token)` for anything not on
  the list. The most common way to hit this by accident: passing a _wallet_
  address where a _token contract_ address was expected.
- **`COOLDOWN`** (1 hour) per `(token, caller)` pair, tracked in
  `lastClaimed[token][user]`.

The two functions differ in how they handle a token still on cooldown:

- **`claim`** — reverts outright (`"Faucet: cooldown"`). A direct
  single-token claim hitting cooldown is treated as a caller mistake, not
  something to silently work around.
- **`claimMany`** — **skips** that token (emits `Skipped(user, token,
availableAt)`) and continues processing the rest of the batch, rather than
  reverting the whole call over one token's cooldown. Bounded to
  `MAX_BATCH` (64) tokens per call to keep gas estimation/block-limit griefing
  off the table. `claimableAt(user, tokens)` lets a frontend render cooldown
  state for a whole token list in one read instead of one call per token.

## Why minting instead of paying from a balance

Earlier in this project's history, `Faucet` held a balance per token
(funded once at deploy time via a plain `transfer()` from the deployer) and
`claim()` paid out of it. That design was replaced once `SeedToken` gained
a permissionless `mint(uint256)` — see [`tokens.md`](./tokens.md) — because
the balance model had two real costs the mint model doesn't:

1. **Deploy-time funding was O(tokens)** — one `transfer()` per supported
   token, meaning deploying a faucet for hundreds of `SeedToken`s meant
   hundreds of transactions before the faucet was even usable.
2. **Finite supply** — a popular token could genuinely run the faucet dry,
   at which point `claim()` for it would revert on insufficient balance
   until someone manually refunded it.

With minting, `DeployFaucet.s.sol` only needs to deploy the contract and
call `setSupportedTokens` once (cheap regardless of token count), and
supply is never a constraint — every claim mints exactly what it needs,
forever.

Internally, `claim`/`claimMany` call `ISeedTokenMintable(token).mint(CLAIM_AMOUNT)`
first (a minimal local interface, just the one function — no dependency on
`SeedToken`'s full implementation). That mints to the Faucet itself (`mint`
always credits `msg.sender` of _that_ call, which is the Faucet contract,
not the original caller), then the Faucet immediately forwards the same
amount via `safeTransfer` to whoever actually called `claim`. Net effect:
the Faucet's own balance is zero before and after every call — it never
custodies funds between transactions.

## `rescue`

```solidity
function rescue(address token, address to, uint256 amount) external onlyOwner
```

Still exists as an owner-only safety valve, but under normal operation
there's nothing to rescue — the Faucet mints and forwards in the same
transaction, so it shouldn't hold a balance between calls. This exists for
the unexpected case (someone sends tokens to the Faucet directly, a future
code change reintroduces a holding period, etc.), not as part of the normal
claim flow.
