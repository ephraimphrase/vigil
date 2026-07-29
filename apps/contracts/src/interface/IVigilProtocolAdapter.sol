// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Uniform surface VigilVault uses to route capital into a single external
// yield venue. One adapter == one venue == one strategy instance - the
// adapter is the only address the underlying strategy trusts as its
// `vault`.
//
// Lifecycle: unpaused + not retired (deposits + withdrawals allowed) ->
// paused (deposits rejected, withdrawals still allowed, reversible) ->
// retired (terminal, position fully unwound, deposits permanently refused).
interface IVigilProtocolAdapter {
    error OnlyVault();
    error OnlyKeeper();
    error ZeroAmount();
    error ZeroAddress();
    error AssetMismatch(address expected, address actual);
    error DepositsClosed();
    error AdapterRetired();
    error InsufficientOutput(uint256 received, uint256 floor);

    event Deposited(uint256 requested, uint256 supplied);
    event Withdrawn(uint256 requested, uint256 received);
    event Harvested(uint256 gain, uint256 totalAssetsAfter);
    event Paused();
    event Resumed();
    event Retired(uint256 withdrawn);

    // ─── IDENTITY ───

    // Stable key the HealthOracle scores this venue under - must match the
    // id the oracle publishes, the vault joins on it.
    function protocolId() external view returns (bytes32);

    // MUST equal VigilVault.asset(); enforce at construction.
    function asset() external view returns (address);

    function strategy() external view returns (address);

    function vault() external view returns (address);

    // ─── ACCOUNTING ───

    function totalAssets() external view returns (uint256);

    // MUST reflect real venue liquidity, not the full position - returning
    // totalAssets() unconditionally is a bug, not a simplification.
    function maxWithdraw() external view returns (uint256);

    // 0 whenever paused or retired, or the venue is at a supply cap.
    function maxDeposit() external view returns (uint256);

    // May be below totalAssets() where exit incurs fees or slippage.
    function previewWithdrawAll() external view returns (uint256);

    function paused() external view returns (bool);

    function retired() external view returns (bool);

    function lastHarvest() external view returns (uint256);

    // ─── CAPITAL MOVEMENT (vault only) ───

    // Vault transfers `amount` of asset() to this adapter, then calls this
    // to deploy it. Reverts InsufficientOutput if the increase in
    // totalAssets() falls below minSupplied.
    function deposit(uint256 amount, uint256 minSupplied) external returns (uint256 supplied);

    // May return less than `amount` where the venue charges an exit fee -
    // the vault must book the shortfall as a realized loss.
    function withdraw(uint256 amount, uint256 minWithdrawn) external returns (uint256 withdrawn);

    // Reversible - the adapter stays usable and can be redeployed into.
    function withdrawAll(uint256 minWithdrawn) external returns (uint256 withdrawn);

    // ─── LIFECYCLE (vault or guardian) ───

    function pause() external;

    function resume() external;

    // One-way. The vault MUST remove this adapter from its active set in
    // the same transaction - a retired adapter left routable will revert
    // every future rebalance leg.
    function retire(uint256 minWithdrawn) external returns (uint256 withdrawn);

    // ─── MAINTENANCE (keeper) ───

    function harvest(uint256 minGain) external returns (uint256 gain);

    function harvestable() external view returns (bool);
}
