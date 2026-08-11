// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVigilProtocolAdapter} from "../interface/IVigilProtocolAdapter.sol";

// Flat stand-in adapter for a strategy in apps/web/seed/strategies.json with
// no real Base Sepolia deployment (see data/84532/protocolAddressBook.json)
// - implements IVigilProtocolAdapter directly, no BeefyStrategyAdapter/
// separate-strategy-contract wrapping. BeefyStrategyAdapter exists to wrap
// a real Common/ strategy's initialize()/deposit()/withdraw() surface;
// there's nothing real underneath a mock, so that split adds a layer of
// indirection with no purpose here.
//
// Every unit of reported yield is real `underlying` actually held by this
// contract, pre-funded via fundReserve() - totalAssets() can never exceed
// principal + whatever reserve is left to back it, and withdraw() always
// transfers exactly what it reports, never more.
contract MockStrategyAdapter is IVigilProtocolAdapter, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable override vault;
    IERC20 public immutable underlying;
    bytes32 private immutable _protocolId;
    uint256 public immutable apyBps; // e.g. 500 = 5.00% annualized
    string public stratName;

    uint256 public principal;
    uint256 public reserve;
    uint256 private _principalTimestamp;
    bool private _retired;
    uint256 private _lastHarvest;

    uint256 constant BPS_DIVISOR = 10_000;
    uint256 constant YEAR = 365 days;

    event ReserveFunded(uint256 amount);

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    modifier notRetired() {
        if (_retired) revert AdapterRetired();
        _;
    }

    constructor(address _vault, address _underlying, bytes32 _id, uint256 _apyBps, string memory _stratName) {
        if (_vault == address(0) || _underlying == address(0)) revert ZeroAddress();

        vault = _vault;
        underlying = IERC20(_underlying);
        _protocolId = _id;
        apyBps = _apyBps;
        stratName = _stratName;
        _principalTimestamp = block.timestamp;
    }

    // Deployer tops this up with real underlying to back the APY this
    // adapter will report - accrued yield can never exceed what's actually
    // held.
    function fundReserve(uint256 amount) external {
        underlying.safeTransferFrom(msg.sender, address(this), amount);
        reserve += amount;
        emit ReserveFunded(amount);
    }

    // ─── IDENTITY ───

    function protocolId() external view override returns (bytes32) {
        return _protocolId;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function strategy() external view override returns (address) {
        return address(this);
    }

    function totalAssets() public view override returns (uint256) {
        return principal + _pendingAccrued();
    }

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

    // `amount` of underlying must already be sitting in this adapter's own
    // balance - matches VigilVault.rebalance()'s transfer-then-call order.
    function deposit(uint256 amount, uint256 minSupplied)
        external
        override
        onlyVault
        notRetired
        nonReentrant
        returns (uint256 supplied)
    {
        if (amount == 0) revert ZeroAmount();
        if (paused()) revert DepositsClosed();

        _settle();
        principal += amount;
        supplied = amount;
        if (supplied < minSupplied) revert InsufficientOutput(supplied, minSupplied);

        emit Deposited(amount, supplied);
    }

    function withdraw(uint256 amount, uint256 minWithdrawn)
        external
        override
        onlyVault
        nonReentrant
        returns (uint256 withdrawn)
    {
        if (amount == 0) revert ZeroAmount();

        _settle();
        withdrawn = amount > principal ? principal : amount;
        principal -= withdrawn;

        if (withdrawn < minWithdrawn) revert InsufficientOutput(withdrawn, minWithdrawn);
        if (withdrawn > 0) underlying.safeTransfer(vault, withdrawn);

        emit Withdrawn(amount, withdrawn);
    }

    function withdrawAll(uint256 minWithdrawn) external override onlyVault nonReentrant returns (uint256 withdrawn) {
        _settle();
        withdrawn = principal;
        principal = 0;

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

    function retire(uint256 minWithdrawn)
        external
        override
        onlyVault
        notRetired
        nonReentrant
        returns (uint256 withdrawn)
    {
        _retired = true;
        _settle();
        withdrawn = principal;
        principal = 0;

        if (withdrawn < minWithdrawn) revert InsufficientOutput(withdrawn, minWithdrawn);
        if (withdrawn > 0) underlying.safeTransfer(vault, withdrawn);

        emit Retired(withdrawn);
    }

    // ─── MAINTENANCE ───

    function harvest(uint256 minGain) external override notRetired returns (uint256 gain) {
        uint256 before = totalAssets();
        _settle();
        gain = totalAssets() - before; // always 0 - _settle() never changes the reported total, only its bookkeeping
        if (gain < minGain) revert InsufficientOutput(gain, minGain);

        _lastHarvest = block.timestamp;
        emit Harvested(gain, totalAssets());
    }

    function harvestable() external view override returns (bool) {
        return !_retired && _pendingAccrued() > 0;
    }

    // ─── INTERNAL ───

    function _pendingAccrued() internal view returns (uint256) {
        uint256 elapsed = block.timestamp - _principalTimestamp;
        uint256 theoretical = (principal * apyBps * elapsed) / (BPS_DIVISOR * YEAR);
        return theoretical < reserve ? theoretical : reserve;
    }

    // Folds accrued-so-far interest into principal, consuming exactly that
    // much reserve - preserves the invariant
    // underlying.balanceOf(address(this)) == principal + reserve (as long
    // as deposit()/fundReserve() are the only inflows, which they are).
    function _settle() internal {
        uint256 accrued = _pendingAccrued();
        principal += accrued;
        reserve -= accrued;
        _principalTimestamp = block.timestamp;
    }
}
