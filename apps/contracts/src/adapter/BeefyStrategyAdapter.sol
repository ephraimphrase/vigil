// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IVigilProtocolAdapter} from "../interface/IVigilProtocolAdapter.sol";
import {IBeefyStrategyLike} from "../beefy_strategies/interface/beefy/IBeefyStrategyLike.sol";

// Wraps any Common/ strategy behind IVigilProtocolAdapter (see
// IBeefyStrategyLike for the shared surface this relies on).
//
// Deploy order: deploy the strategy's proxy uninitialized (address is
// deterministic) -> deploy this adapter with that address -> initialize()
// the strategy with vault = address(adapter) -> VigilVault.addAdapter().
//
// pause() doesn't pull funds from the farm - that needs the strategy's own
// keeper-gated panic()/unpause(), and `keeper` is shared across every
// strategy an IStrategyFactory manages, so this adapter can't safely hold
// it. It only blocks new deposits; withdraw()/withdrawAll() work either way.
contract BeefyStrategyAdapter is IVigilProtocolAdapter, Pausable {
    using SafeERC20 for IERC20;

    address public immutable override vault;
    IERC20 public immutable underlying;
    bytes32 private immutable _protocolId;
    IBeefyStrategyLike private immutable _strategy;

    bool private _retired;
    uint256 private _lastHarvest;

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    modifier notRetired() {
        if (_retired) revert AdapterRetired();
        _;
    }

    constructor(address _vault, address _strategyAddr, bytes32 _id) {
        if (_vault == address(0) || _strategyAddr == address(0)) revert ZeroAddress();

        vault = _vault;
        _strategy = IBeefyStrategyLike(_strategyAddr);
        underlying = IERC20(_strategy.want());
        _protocolId = _id;
    }

    // ─── IDENTITY ───

    function protocolId() external view override returns (bytes32) {
        return _protocolId;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function strategy() external view override returns (address) {
        return address(_strategy);
    }

    function totalAssets() public view override returns (uint256) {
        return _strategy.balanceOf();
    }

    // Optimistic: no Common/ strategy exposes real-time liquidity.
    function maxWithdraw() public view override returns (uint256) {
        return totalAssets();
    }

    function maxDeposit() external view override returns (uint256) {
        return (!_retired && !paused()) ? type(uint256).max : 0;
    }

    function previewWithdrawAll() external view override returns (uint256) {
        return totalAssets();
    }

    // ─── STATE ───

    function paused() public view override(Pausable, IVigilProtocolAdapter) returns (bool) {
        return super.paused();
    }

    function retired() external view override returns (bool) {
        return _retired;
    }

    function lastHarvest() external view override returns (uint256) {
        return _lastHarvest;
    }

    // ─── CAPITAL MOVEMENT ───

    // Strategy's own deposit() takes no argument - it sweeps whatever
    // `want` balance it's holding, so we transfer in first.
    function deposit(uint256 amount, uint256 minSupplied)
        external
        override
        onlyVault
        notRetired
        returns (uint256 supplied)
    {
        if (amount == 0) revert ZeroAmount();
        if (paused()) revert DepositsClosed();

        underlying.safeTransfer(address(_strategy), amount);
        uint256 before = totalAssets();
        _strategy.deposit();
        supplied = totalAssets() - before;
        if (supplied < minSupplied) revert InsufficientOutput(supplied, minSupplied);

        emit Deposited(amount, supplied);
    }

    function withdraw(uint256 amount, uint256 minWithdrawn) external override onlyVault returns (uint256 withdrawn) {
        if (amount == 0) revert ZeroAmount();

        uint256 before = underlying.balanceOf(address(this));
        _strategy.withdraw(amount);
        withdrawn = underlying.balanceOf(address(this)) - before;
        if (withdrawn < minWithdrawn) revert InsufficientOutput(withdrawn, minWithdrawn);

        if (withdrawn > 0) underlying.safeTransfer(vault, withdrawn);
        emit Withdrawn(amount, withdrawn);
    }

    function withdrawAll(uint256 minWithdrawn) external override onlyVault returns (uint256 withdrawn) {
        uint256 before = underlying.balanceOf(address(this));
        _strategy.retireStrat();
        withdrawn = underlying.balanceOf(address(this)) - before;
        if (withdrawn < minWithdrawn) revert InsufficientOutput(withdrawn, minWithdrawn);

        if (withdrawn > 0) underlying.safeTransfer(vault, withdrawn);
        emit Withdrawn(withdrawn, withdrawn);
    }

    function pause() external override onlyVault notRetired {
        _pause();
        emit Paused();
    }

    function resume() external override onlyVault notRetired {
        _unpause();
        emit Resumed();
    }

    function retire(uint256 minWithdrawn) external override onlyVault notRetired returns (uint256 withdrawn) {
        uint256 before = underlying.balanceOf(address(this));
        _strategy.retireStrat();
        withdrawn = underlying.balanceOf(address(this)) - before;
        if (withdrawn < minWithdrawn) revert InsufficientOutput(withdrawn, minWithdrawn);

        if (withdrawn > 0) underlying.safeTransfer(vault, withdrawn);

        _retired = true;
        emit Retired(withdrawn);
    }

    // ─── MAINTENANCE ───

    // Permissionless: the wrapped strategy's own harvest() already is.
    function harvest(uint256 minGain) external override notRetired returns (uint256 gain) {
        uint256 before = totalAssets();
        _strategy.harvest();
        gain = totalAssets() - before;
        if (gain < minGain) revert InsufficientOutput(gain, minGain);

        _lastHarvest = block.timestamp;
        emit Harvested(gain, totalAssets());
    }

    // No generic way to preview claimable rewards, so true whenever
    // harvest() wouldn't just revert outright.
    function harvestable() external view override returns (bool) {
        return !_retired;
    }
}
