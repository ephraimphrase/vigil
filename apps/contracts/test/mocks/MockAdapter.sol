// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IVigilProtocolAdapter} from "../../src/adapter/IVigilProtocolAdapter.sol";

// A trivial "protocol" that just holds the underlying 1:1 - no yield, no
// external pool. `liquidityCap` lets tests simulate a protocol that can't
// return everything on demand, the same way real adapters cap withdrawals
// at maxWithdraw().
contract MockAdapter is IVigilProtocolAdapter {
    using SafeERC20 for IERC20;

    address public immutable vault;
    IERC20 public immutable underlying;
    bytes32 public immutable override protocolId;

    uint256 public liquidityCap = type(uint256).max;

    error OnlyVault();
    error ZeroAmount();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(address _vault, IERC20 _underlying, bytes32 _protocolId) {
        vault = _vault;
        underlying = _underlying;
        protocolId = _protocolId;
    }

    function setLiquidityCap(uint256 cap) external {
        liquidityCap = cap;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function totalAssets() public view override returns (uint256) {
        return underlying.balanceOf(address(this));
    }

    function maxWithdraw() public view override returns (uint256) {
        uint256 position = totalAssets();
        return position < liquidityCap ? position : liquidityCap;
    }

    function deposit(uint256 amount) external view override onlyVault returns (uint256 supplied) {
        if (amount == 0) revert ZeroAmount();
        supplied = underlying.balanceOf(address(this));
        if (supplied == 0) revert ZeroAmount();
    }

    function withdraw(uint256 amount) external override onlyVault returns (uint256 withdrawn) {
        if (amount == 0) revert ZeroAmount();
        uint256 cap = maxWithdraw();
        withdrawn = amount < cap ? amount : cap;
        if (withdrawn == 0) return 0;
        underlying.safeTransfer(vault, withdrawn);
    }

    function withdrawAll() external override onlyVault returns (uint256 withdrawn) {
        withdrawn = maxWithdraw();
        if (withdrawn == 0) return 0;
        underlying.safeTransfer(vault, withdrawn);
    }
}
