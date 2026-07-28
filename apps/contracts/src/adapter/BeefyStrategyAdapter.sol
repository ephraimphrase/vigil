// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IVigilProtocolAdapter} from "../interface/IVigilProtocolAdapter.sol";
import {IBeefyStrategyLike} from "../beefy_strategies/interface/beefy/IBeefyStrategyLike.sol";

// Wraps ANY Common/ strategy behind IVigilProtocolAdapter, regardless of
// which protocol it targets underneath - it only ever calls the shared
// want()/balanceOf()/deposit()/withdraw()/retireStrat() surface every
// strategy in this repo exposes identically (see IBeefyStrategyLike).
//
// Deploy order (breaks the circular want-each-other's-address dependency):
//   1. Deploy the strategy's proxy WITHOUT calling initialize() yet - an
//      unintialized proxy still has a deterministic address.
//   2. Deploy this adapter, passing that proxy address in.
//   3. Call strategy.initialize(..., Addresses{ vault: address(adapter), ... }).
//      The strategy must trust this adapter as its `vault`, or every
//      withdraw()/retireStrat() call here will revert with "!vault".
//   4. VigilVault.addAdapter(adapter).
contract BeefyStrategyAdapter is IVigilProtocolAdapter {
    using SafeERC20 for IERC20;

    address public immutable vigilVault;
    IBeefyStrategyLike public immutable strategy;
    IERC20 public immutable underlying;
    bytes32 public immutable override protocolId;

    error OnlyVault();
    error ZeroAmount();
    error AssetMismatch();

    modifier onlyVigilVault() {
        if (msg.sender != vigilVault) revert OnlyVault();
        _;
    }

    constructor(address _vigilVault, address _strategy, bytes32 _protocolId) {
        if (_vigilVault == address(0) || _strategy == address(0)) revert ZeroAmount();

        vigilVault = _vigilVault;
        strategy = IBeefyStrategyLike(_strategy);
        underlying = IERC20(strategy.want());
        protocolId = _protocolId;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function totalAssets() public view override returns (uint256) {
        return strategy.balanceOf();
    }

    // No Common/ strategy exposes real-time available liquidity, so this is
    // optimistic - it assumes the full position is redeemable. If a wrapped
    // protocol can go illiquid, that risk should be reflected in its
    // HealthOracle score rather than papered over here.
    function maxWithdraw() external view override returns (uint256) {
        return totalAssets();
    }

    // VigilVault transfers `amount` to this adapter before calling deposit(),
    // per its rebalance() flow - the strategy's own deposit() then sweeps
    // whatever `want` balance it's holding, so it takes no argument.
    function deposit(uint256 amount) external override onlyVigilVault returns (uint256 supplied) {
        if (amount == 0) revert ZeroAmount();

        underlying.safeTransfer(address(strategy), amount);
        uint256 before = strategy.balanceOf();
        strategy.deposit();
        supplied = strategy.balanceOf() - before;
    }

    function withdraw(uint256 amount) external override onlyVigilVault returns (uint256 withdrawn) {
        if (amount == 0) revert ZeroAmount();

        uint256 before = underlying.balanceOf(address(this));
        strategy.withdraw(amount);
        withdrawn = underlying.balanceOf(address(this)) - before;
        if (withdrawn > 0) underlying.safeTransfer(vigilVault, withdrawn);
    }

    function withdrawAll() external override onlyVigilVault returns (uint256 withdrawn) {
        uint256 before = underlying.balanceOf(address(this));
        strategy.retireStrat();
        withdrawn = underlying.balanceOf(address(this)) - before;
        if (withdrawn > 0) underlying.safeTransfer(vigilVault, withdrawn);
    }
}
