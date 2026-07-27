
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVigilProtocolAdapter} from "../interface/IVigilProtocolAdapter.sol";

interface IMorpho {
    function supply(address poolToken, address onBehalf, uint256 amount) external;
    function withdraw(address poolToken, uint256 amount) external;
}

interface IMorphoLens {
    function getCurrentSupplyBalanceInOf(address poolToken, address user)
        external
        view
        returns (uint256 balanceInP2P, uint256 balanceOnPool, uint256 totalBalance);
}

interface ICToken is IERC20 {
    function underlying() external view returns (address);
    function getCash() external view returns (uint256);
}

contract MorphoCompoundAdapter is IVigilProtocolAdapter, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant MORPHO_MAX = type(uint256).max;

    address public immutable vault;

    IMorpho     public immutable morpho;
    IMorphoLens public immutable lens;
    ICToken     public immutable poolToken;
    IERC20      public immutable underlying;
    bytes32     public immutable override protocolId;

    event Supplied(uint256 amount);
    event Withdrawn(uint256 requested, uint256 actual);
    event Rescued(address indexed token, uint256 amount);

    error OnlyVault();
    error ZeroAddress();
    error ZeroAmount();
    error AssetMismatch();
    error CannotRescueCoreAsset();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(
        address _vault,
        IMorpho _morpho,
        IMorphoLens _lens,
        ICToken _poolToken,
        IERC20 _underlying,
        bytes32 _protocolId
    ) {
        if (_vault == address(0)) revert ZeroAddress();
        if (address(_morpho) == address(0)) revert ZeroAddress();
        if (address(_lens) == address(0)) revert ZeroAddress();
        if (address(_poolToken) == address(0)) revert ZeroAddress();
        if (address(_underlying) == address(0)) revert ZeroAddress();

        if (_poolToken.underlying() != address(_underlying)) revert AssetMismatch();

        vault      = _vault;
        morpho     = _morpho;
        lens       = _lens;
        poolToken  = _poolToken;
        underlying = _underlying;
        protocolId = _protocolId;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function totalAssets() public view override returns (uint256) {
        (, , uint256 total) = lens.getCurrentSupplyBalanceInOf(address(poolToken), address(this));
        return total;
    }

    function maxWithdraw() public view override returns (uint256) {
        uint256 position = totalAssets();
        uint256 available = poolToken.getCash();
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

        underlying.forceApprove(address(morpho), supplied);
        morpho.supply(address(poolToken), address(this), supplied);
        underlying.forceApprove(address(morpho), 0);

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
        morpho.withdraw(address(poolToken), target);
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
        if (totalAssets() == 0) return 0;

        uint256 before = underlying.balanceOf(address(this));
        morpho.withdraw(address(poolToken), MORPHO_MAX);
        withdrawn = underlying.balanceOf(address(this)) - before;
        underlying.safeTransfer(vault, withdrawn);

        emit Withdrawn(MORPHO_MAX, withdrawn);
    }

    function rescue(IERC20 token) external onlyVault nonReentrant {
        if (address(token) == address(underlying)) {
            revert CannotRescueCoreAsset();
        }
        uint256 bal = token.balanceOf(address(this));
        if (bal > 0) {
            token.safeTransfer(vault, bal);
            emit Rescued(address(token), bal);
        }
    }
}
