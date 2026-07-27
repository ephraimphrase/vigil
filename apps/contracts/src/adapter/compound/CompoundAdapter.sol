// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVigilProtocolAdapter} from "../IVigilProtocolAdapter.sol";
import {ICToken} from "./interface/ICToken.sol";

contract CompoundV2Adapter is IVigilProtocolAdapter, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant NO_ERROR = 0;
    uint256 private constant EXCHANGE_RATE_SCALE = 1e18;

    address public immutable vault;

    ICToken public immutable cToken;
    IERC20  public immutable underlying;
    bytes32 public immutable override protocolId;

    event Supplied(uint256 amount);
    event Withdrawn(uint256 requested, uint256 actual);
    event Rescued(address indexed token, uint256 amount);

    error OnlyVault();
    error ZeroAddress();
    error ZeroAmount();
    error AssetMismatch();
    error CompoundError(uint256 code);
    error CannotRescueCoreAsset();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(
        address _vault,
        ICToken _cToken,
        IERC20 _underlying,
        bytes32 _protocolId
    ) {
        if (_vault == address(0)) revert ZeroAddress();
        if (address(_cToken) == address(0)) revert ZeroAddress();
        if (address(_underlying) == address(0)) revert ZeroAddress();

        if (_cToken.underlying() != address(_underlying)) revert AssetMismatch();

        vault      = _vault;
        cToken     = _cToken;
        underlying = _underlying;
        protocolId = _protocolId;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function totalAssets() public view override returns (uint256) {
        return (cToken.balanceOf(address(this)) * cToken.exchangeRateStored()) / EXCHANGE_RATE_SCALE;
    }

    function maxWithdraw() public view override returns (uint256) {
        uint256 position = totalAssets();
        uint256 available = cToken.getCash();
        return position < available ? position : available;
    }

    function deposit(uint256 amount)
        external
        override
        onlyVault
        nonReentrant
        returns (uint256 supplied)
    {
        if (amount == 0) revert ZeroAmount();

        supplied = underlying.balanceOf(address(this));
        if (supplied == 0) revert ZeroAmount();

        underlying.forceApprove(address(cToken), supplied);
        uint256 err = cToken.mint(supplied);
        if (err != NO_ERROR) revert CompoundError(err);
        underlying.forceApprove(address(cToken), 0);

        emit Supplied(supplied);
    }

    function withdraw(uint256 amount)
        external
        override
        onlyVault
        nonReentrant
        returns (uint256 withdrawn)
    {
        if (amount == 0) revert ZeroAmount();

        uint256 cap = maxWithdraw();
        if (cap == 0) return 0;

        uint256 target = amount < cap ? amount : cap;

        uint256 before = underlying.balanceOf(address(this));
        uint256 err = cToken.redeemUnderlying(target);
        if (err != NO_ERROR) revert CompoundError(err);
        withdrawn = underlying.balanceOf(address(this)) - before;
        underlying.safeTransfer(vault, withdrawn);

        emit Withdrawn(amount, withdrawn);
    }

    function withdrawAll()
        external
        override
        onlyVault
        nonReentrant
        returns (uint256 withdrawn)
    {
        uint256 balance = cToken.balanceOf(address(this));
        if (balance == 0) return 0;

        uint256 before = underlying.balanceOf(address(this));
        uint256 err = cToken.redeem(balance);
        if (err != NO_ERROR) revert CompoundError(err);
        withdrawn = underlying.balanceOf(address(this)) - before;
        underlying.safeTransfer(vault, withdrawn);

        emit Withdrawn(type(uint256).max, withdrawn);
    }

    function rescue(IERC20 token) external onlyVault nonReentrant {
        if (address(token) == address(underlying) || address(token) == address(cToken)) {
            revert CannotRescueCoreAsset();
        }
        uint256 bal = token.balanceOf(address(this));
        if (bal > 0) {
            token.safeTransfer(vault, bal);
            emit Rescued(address(token), bal);
        }
    }
}
