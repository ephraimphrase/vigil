// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVigilProtocolAdapter} from "../IVigilProtocolAdapter.sol";

// SKELETON - Maple Finance institutional credit pools. Primary asset: USDC.
// TODO: Maple pools are permissioned (lender allowlists, withdrawal request
// + cooldown windows tied to loan terms) rather than instantly liquid like
// a lending market - maxWithdraw() can't just report a live balance the way
// it does for Aave/Compound; it needs to reflect whatever's already been
// requested and is currently withdrawable. protocolPool should be the
// specific Maple pool (v2 PoolManager/Pool) address.
contract MapleAdapter is IVigilProtocolAdapter {
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
