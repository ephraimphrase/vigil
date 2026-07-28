// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVigilProtocolAdapter} from "../IVigilProtocolAdapter.sol";

// SKELETON - Notional Finance fixed-rate lending. Primary: USDC, DAI.
// TODO: Notional lends via fCash - zero-coupon-bond-like positions with a
// fixed maturity date, priced at a discount rather than accruing a live
// balance the way variable-rate lending does. totalAssets()/maxWithdraw()
// need to account for maturity (full value only realized at maturity;
// exiting early means trading fCash back on Notional's AMM, at a
// potentially worse rate). protocolPool should be the Notional Router,
// plus a currency/maturity identifier for the specific market.
contract NotionalAdapter is IVigilProtocolAdapter {
    address public immutable vault;
    IERC20  public immutable underlying;
    bytes32 public immutable override protocolId;

    address public immutable protocolPool;

    error OnlyVault();
    error ZeroAddress();
    error NotImplemented();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(address _vault, IERC20 _underlying, address _protocolPool, bytes32 _protocolId) {
        if (_vault == address(0)) revert ZeroAddress();
        if (address(_underlying) == address(0)) revert ZeroAddress();
        if (_protocolPool == address(0)) revert ZeroAddress();

        vault        = _vault;
        underlying   = _underlying;
        protocolPool = _protocolPool;
        protocolId   = _protocolId;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function totalAssets() external view override returns (uint256) {
        revert NotImplemented();
    }

    function maxWithdraw() external view override returns (uint256) {
        revert NotImplemented();
    }

    function deposit(uint256 amount) external override onlyVault returns (uint256 supplied) {
        revert NotImplemented();
    }

    function withdraw(uint256 amount) external override onlyVault returns (uint256 withdrawn) {
        revert NotImplemented();
    }

    function withdrawAll() external override onlyVault returns (uint256 withdrawn) {
        revert NotImplemented();
    }
}
