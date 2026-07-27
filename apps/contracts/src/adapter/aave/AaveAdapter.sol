// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVigilProtocolAdapter} from "../IVigilProtocolAdapter.sol";
import {IAavePool} from "./interface/IAavePool.sol";
import {IAToken} from "./interface/IAToken.sol";

contract AaveV3Adapter is IVigilProtocolAdapter, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant AAVE_MAX = type(uint256).max;

    uint16 private constant REFERRAL_CODE = 0;

    address public immutable vault;

    IAavePool public immutable pool;
    IERC20   public immutable underlying;
    IERC20   public immutable aToken;
    bytes32  public immutable override protocolId;

    event Supplied(uint256 amount);
    event Withdrawn(uint256 requested, uint256 actual);
    event Rescued(address indexed token, uint256 amount);

    error OnlyVault();
    error ZeroAddress();
    error ZeroAmount();
    error AssetMismatch();
    error PoolMismatch();
    error CannotRescueCoreAsset();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(
        address _vault,
        IAavePool _pool,
        IERC20 _underlying,
        IAToken _aToken,
        bytes32 _protocolId
    ) {
        if (_vault == address(0)) revert ZeroAddress();
        if (address(_pool) == address(0)) revert ZeroAddress();
        if (address(_underlying) == address(0)) revert ZeroAddress();
        if (address(_aToken) == address(0)) revert ZeroAddress();

        if (_aToken.UNDERLYING_ASSET_ADDRESS() != address(_underlying)) revert AssetMismatch();
        if (_aToken.POOL() != address(_pool)) revert PoolMismatch();

        vault      = _vault;
        pool       = _pool;
        underlying = _underlying;
        aToken     = IERC20(address(_aToken));
        protocolId = _protocolId;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function totalAssets() public view override returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    function maxWithdraw() public view override returns (uint256) {
        uint256 position = totalAssets();
        uint256 available = underlying.balanceOf(address(aToken));
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

        underlying.forceApprove(address(pool), supplied);
        pool.supply(address(underlying), supplied, address(this), REFERRAL_CODE);
        underlying.forceApprove(address(pool), 0);

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

        uint256 before = underlying.balanceOf(vault);
        pool.withdraw(address(underlying), target, vault);
        withdrawn = underlying.balanceOf(vault) - before;

        emit Withdrawn(amount, withdrawn);
    }

    function withdrawAll()
        external
        override
        onlyVault
        nonReentrant
        returns (uint256 withdrawn)
    {
        if (totalAssets() == 0) return 0;

        uint256 before = underlying.balanceOf(vault);
        pool.withdraw(address(underlying), AAVE_MAX, vault);
        withdrawn = underlying.balanceOf(vault) - before;

        emit Withdrawn(AAVE_MAX, withdrawn);
    }

    function rescue(IERC20 token) external onlyVault nonReentrant {
        if (address(token) == address(underlying) || address(token) == address(aToken)) {
            revert CannotRescueCoreAsset();
        }
        uint256 bal = token.balanceOf(address(this));
        if (bal > 0) {
            token.safeTransfer(vault, bal);
            emit Rescued(address(token), bal);
        }
    }
}
