// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISwapRouter02} from "../interface/ISwapRouter02.sol";
import {IVigilZapRouter} from "../interface/IVigilZapRouter.sol";

contract VigilZapRouter is ReentrancyGuard, IVigilZapRouter {
    using SafeERC20 for IERC20;

    uint256 private constant ADDR_SIZE = 20;
    uint256 private constant FEE_SIZE = 3;
    uint256 private constant MIN_PATH_LEN = ADDR_SIZE + FEE_SIZE + ADDR_SIZE;

    IERC4626 public immutable override vault;
    IERC20 public immutable override weth;
    ISwapRouter02 public immutable override swapRouter;

    event ZapIn(
        address indexed caller,
        address indexed receiver,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 wethOut,
        uint256 shares
    );

    event ZapOut(
        address indexed caller,
        address indexed receiver,
        address indexed tokenOut,
        uint256 shares,
        uint256 wethIn,
        uint256 amountOut
    );

    error ZeroAmount();
    error ZeroAddress();
    error Expired();
    error BadPath();
    error PathMustEndInWeth();
    error PathMustStartWithWeth();
    error InsufficientShares(uint256 got, uint256 min);
    error InsufficientOutput(uint256 got, uint256 min);

    modifier notExpired(uint256 deadline) {
        if (block.timestamp > deadline) revert Expired();
        _;
    }

    constructor(IERC4626 _vault, ISwapRouter02 _swapRouter) {
        if (address(_vault) == address(0)) revert ZeroAddress();
        if (address(_swapRouter) == address(0)) revert ZeroAddress();

        vault = _vault;
        weth = IERC20(_vault.asset());
        swapRouter = _swapRouter;
    }

    function zapIn(
        address tokenIn,
        uint256 amountIn,
        bytes calldata path,
        uint256 minWethOut,
        uint256 minSharesOut,
        address receiver,
        uint256 deadline
    ) public override nonReentrant notExpired(deadline) returns (uint256 shares) {
        if (amountIn == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();
        _validatePathIn(path, tokenIn);

        uint256 balBefore = IERC20(tokenIn).balanceOf(address(this));
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 received = IERC20(tokenIn).balanceOf(address(this)) - balBefore;

        IERC20(tokenIn).forceApprove(address(swapRouter), received);

        uint256 wethOut = swapRouter.exactInput(
            ISwapRouter02.ExactInputParams({
                path: path, recipient: address(this), amountIn: received, amountOutMinimum: minWethOut
            })
        );

        IERC20(tokenIn).forceApprove(address(swapRouter), 0);

        weth.forceApprove(address(vault), wethOut);
        shares = vault.deposit(wethOut, receiver);
        weth.forceApprove(address(vault), 0);

        if (shares < minSharesOut) revert InsufficientShares(shares, minSharesOut);

        _sweep(tokenIn, msg.sender);
        _sweep(address(weth), msg.sender);

        emit ZapIn(msg.sender, receiver, tokenIn, received, wethOut, shares);
    }

    function zapInWithPermit(
        address tokenIn,
        uint256 amountIn,
        bytes calldata path,
        uint256 minWethOut,
        uint256 minSharesOut,
        address receiver,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override returns (uint256 shares) {
        try IERC20Permit(tokenIn).permit(msg.sender, address(this), amountIn, deadline, v, r, s) {} catch {}

        return zapIn(tokenIn, amountIn, path, minWethOut, minSharesOut, receiver, deadline);
    }

    function zapOut(
        uint256 shares,
        address tokenOut,
        bytes calldata path,
        uint256 minAmountOut,
        address receiver,
        uint256 deadline
    ) external override nonReentrant notExpired(deadline) returns (uint256 amountOut) {
        if (shares == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();
        _validatePathOut(path, tokenOut);

        IERC20(address(vault)).safeTransferFrom(msg.sender, address(this), shares);
        uint256 wethIn = vault.redeem(shares, address(this), address(this));

        weth.forceApprove(address(swapRouter), wethIn);

        amountOut = swapRouter.exactInput(
            ISwapRouter02.ExactInputParams({
                path: path, recipient: receiver, amountIn: wethIn, amountOutMinimum: minAmountOut
            })
        );

        weth.forceApprove(address(swapRouter), 0);

        if (amountOut < minAmountOut) revert InsufficientOutput(amountOut, minAmountOut);

        _sweep(address(weth), msg.sender);

        emit ZapOut(msg.sender, receiver, tokenOut, shares, wethIn, amountOut);
    }

    function _validatePathIn(bytes calldata path, address tokenIn) private view {
        if (path.length < MIN_PATH_LEN) revert BadPath();
        if ((path.length - ADDR_SIZE) % (FEE_SIZE + ADDR_SIZE) != 0) revert BadPath();
        if (_firstToken(path) != tokenIn) revert BadPath();
        if (_lastToken(path) != address(weth)) revert PathMustEndInWeth();
    }

    function _validatePathOut(bytes calldata path, address tokenOut) private view {
        if (path.length < MIN_PATH_LEN) revert BadPath();
        if ((path.length - ADDR_SIZE) % (FEE_SIZE + ADDR_SIZE) != 0) revert BadPath();
        if (_firstToken(path) != address(weth)) revert PathMustStartWithWeth();
        if (_lastToken(path) != tokenOut) revert BadPath();
    }

    function _firstToken(bytes calldata path) private pure returns (address token) {
        assembly {
            token := shr(96, calldataload(path.offset))
        }
    }

    function _lastToken(bytes calldata path) private pure returns (address token) {
        assembly {
            token := shr(96, calldataload(add(path.offset, sub(path.length, 20))))
        }
    }

    function _sweep(address token, address to) private {
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(token).safeTransfer(to, bal);
        }
    }
}
