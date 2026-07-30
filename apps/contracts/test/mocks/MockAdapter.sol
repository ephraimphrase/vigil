// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IVigilProtocolAdapter} from "../../src/interface/IVigilProtocolAdapter.sol";

// A trivial "protocol" that just holds the underlying 1:1 - no yield, no
// external pool. `liquidityCap` lets tests simulate a protocol that can't
// return everything on demand, the same way real adapters cap withdrawals
// at maxWithdraw(). It is its own "strategy" - there's no separate venue
// contract to front, so strategy() just returns address(this).
contract MockAdapter is IVigilProtocolAdapter, Pausable {
    using SafeERC20 for IERC20;

    address public immutable override vault;
    IERC20 public immutable underlying;
    bytes32 public immutable override protocolId;

    uint256 public liquidityCap = type(uint256).max;
    bool private _retired;
    uint256 public lastHarvest;

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    modifier notRetired() {
        if (_retired) revert AdapterRetired();
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

    function strategy() external view override returns (address) {
        return address(this);
    }

    function totalAssets() public view override returns (uint256) {
        return underlying.balanceOf(address(this));
    }

    function maxWithdraw() public view override returns (uint256) {
        uint256 position = totalAssets();
        return position < liquidityCap ? position : liquidityCap;
    }

    function maxDeposit() external view override returns (uint256) {
        return (!_retired && !paused()) ? type(uint256).max : 0;
    }

    function previewWithdrawAll() external view override returns (uint256) {
        return maxWithdraw();
    }

    function paused() public view override(Pausable, IVigilProtocolAdapter) returns (bool) {
        return super.paused();
    }

    function retired() external view override returns (bool) {
        return _retired;
    }

    // No yield in this mock, so there's never anything worth harvesting.
    function harvestable() external pure override returns (bool) {
        return false;
    }

    function deposit(uint256 amount, uint256 minSupplied)
        external
        override
        onlyVault
        notRetired
        returns (uint256 supplied)
    {
        if (amount == 0) revert ZeroAmount();
        if (paused()) revert DepositsClosed();

        supplied = underlying.balanceOf(address(this));
        if (supplied < minSupplied) revert InsufficientOutput(supplied, minSupplied);

        emit Deposited(amount, supplied);
    }

    function withdraw(uint256 amount, uint256 minWithdrawn) external override onlyVault returns (uint256 withdrawn) {
        if (amount == 0) revert ZeroAmount();

        uint256 cap = maxWithdraw();
        withdrawn = amount < cap ? amount : cap;
        if (withdrawn < minWithdrawn) revert InsufficientOutput(withdrawn, minWithdrawn);
        if (withdrawn == 0) return 0;

        underlying.safeTransfer(vault, withdrawn);
        emit Withdrawn(amount, withdrawn);
    }

    function withdrawAll(uint256 minWithdrawn) external override onlyVault returns (uint256 withdrawn) {
        withdrawn = maxWithdraw();
        if (withdrawn < minWithdrawn) revert InsufficientOutput(withdrawn, minWithdrawn);
        if (withdrawn == 0) return 0;

        underlying.safeTransfer(vault, withdrawn);
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
        withdrawn = maxWithdraw();
        if (withdrawn < minWithdrawn) revert InsufficientOutput(withdrawn, minWithdrawn);
        if (withdrawn > 0) underlying.safeTransfer(vault, withdrawn);

        _retired = true;
        emit Retired(withdrawn);
    }

    // No yield in this mock, so there's never anything to compound.
    function harvest(uint256) external pure override returns (uint256 gain) {
        return 0;
    }
}
