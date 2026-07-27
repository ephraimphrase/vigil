// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISwapRouter02} from "../interface/ISwapRouter02.sol";

contract VigilZapRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =================================================================
    // ⬢ CONSTANTS
    // =================================================================

    /// @dev Uniswap V3 path layout: token(20) fee(3) token(20) ...
    uint256 private constant ADDR_SIZE = 20;
    uint256 private constant FEE_SIZE = 3;
    uint256 private constant MIN_PATH_LEN = ADDR_SIZE + FEE_SIZE + ADDR_SIZE;

    // =================================================================
    // ⬢ IMMUTABLES
    // =================================================================

    IERC4626 public immutable vault;
    IERC20 public immutable weth;
    ISwapRouter02 public immutable swapRouter;

    // =================================================================
    // ⬢ EVENTS
    // =================================================================

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

    // =================================================================
    // ⬢ ERRORS
    // =================================================================

    error ZeroAmount();
    error ZeroAddress();
    error Expired();
    error BadPath();
    error PathMustEndInWeth();
    error PathMustStartWithWeth();
    error InsufficientShares(uint256 got, uint256 min);
    error InsufficientOutput(uint256 got, uint256 min);

    // =================================================================
    // ⬢ MODIFIERS
    // =================================================================

    modifier notExpired(uint256 deadline) {
        if (block.timestamp > deadline) revert Expired();
        _;
    }

    // =================================================================
    // ⬢ CONSTRUCTOR
    // =================================================================

    constructor(IERC4626 _vault, ISwapRouter02 _swapRouter) {
        if (address(_vault) == address(0)) revert ZeroAddress();
        if (address(_swapRouter) == address(0)) revert ZeroAddress();

        vault = _vault;
        weth = IERC20(_vault.asset());
        swapRouter = _swapRouter;
    }

    // =================================================================
    // ⬢ ZAP IN
    // =================================================================

    /// @notice Deposit any token, receive vault shares.
    /// @param tokenIn      Token being deposited (e.g. USDC).
    /// @param amountIn     Amount of tokenIn to pull from msg.sender.
    /// @param path         Uniswap V3 encoded path. MUST start with
    ///                     tokenIn and end with WETH.
    ///                     USDC -> WETH @ 0.05%:
    ///                     abi.encodePacked(USDC, uint24(500), WETH)
    /// @param minWethOut   Slippage bound on the swap. Caller-supplied.
    /// @param minSharesOut Slippage bound on the deposit. Caller-supplied.
    /// @param receiver     Who receives the shares.
    /// @param deadline     Unix timestamp after which this reverts.
    function zapIn(
        address tokenIn,
        uint256 amountIn,
        bytes calldata path,
        uint256 minWethOut,
        uint256 minSharesOut,
        address receiver,
        uint256 deadline
    ) public nonReentrant notExpired(deadline) returns (uint256 shares) {
        // -------- validate --------
        if (amountIn == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();
        _validatePathIn(path, tokenIn);

        // -------- pull --------
        // balanceBefore/After handles fee-on-transfer tokens correctly.
        uint256 balBefore = IERC20(tokenIn).balanceOf(address(this));
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 received = IERC20(tokenIn).balanceOf(address(this)) - balBefore;

        // -------- swap to WETH --------
        IERC20(tokenIn).forceApprove(address(swapRouter), received);

        uint256 wethOut = swapRouter.exactInput(
            ISwapRouter02.ExactInputParams({
                path: path,
                recipient: address(this),
                amountIn: received,
                amountOutMinimum: minWethOut
            })
        );

        IERC20(tokenIn).forceApprove(address(swapRouter), 0);

        // -------- deposit --------
        weth.forceApprove(address(vault), wethOut);
        shares = vault.deposit(wethOut, receiver);
        weth.forceApprove(address(vault), 0);

        if (shares < minSharesOut) revert InsufficientShares(shares, minSharesOut);

        // -------- sweep --------
        _sweep(tokenIn, msg.sender);
        _sweep(address(weth), msg.sender);

        emit ZapIn(msg.sender, receiver, tokenIn, received, wethOut, shares);
    }

    /// @notice zapIn with an EIP-2612 signature instead of a prior
    ///         approve tx. USDC supports this — one transaction total.
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
    ) external returns (uint256 shares) {
        // try/catch: a griefer can front-run the permit to make it
        // revert. If the allowance already landed, proceed anyway.
        try IERC20Permit(tokenIn).permit(
            msg.sender, address(this), amountIn, deadline, v, r, s
        ) {} catch {}

        return zapIn(
            tokenIn, amountIn, path, minWethOut, minSharesOut, receiver, deadline
        );
    }

    // =================================================================
    // ⬢ ZAP OUT
    // =================================================================

    /// @notice Burn vault shares, receive any token.
    /// @param path MUST start with WETH and end with tokenOut.
    /// @dev Caller must approve this router for their vault shares.
    function zapOut(
        uint256 shares,
        address tokenOut,
        bytes calldata path,
        uint256 minAmountOut,
        address receiver,
        uint256 deadline
    ) external nonReentrant notExpired(deadline) returns (uint256 amountOut) {
        // -------- validate --------
        if (shares == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();
        _validatePathOut(path, tokenOut);

        // -------- redeem --------
        IERC20(address(vault)).safeTransferFrom(msg.sender, address(this), shares);
        uint256 wethIn = vault.redeem(shares, address(this), address(this));

        // -------- swap out --------
        weth.forceApprove(address(swapRouter), wethIn);

        amountOut = swapRouter.exactInput(
            ISwapRouter02.ExactInputParams({
                path: path,
                recipient: receiver,
                amountIn: wethIn,
                amountOutMinimum: minAmountOut
            })
        );

        weth.forceApprove(address(swapRouter), 0);

        if (amountOut < minAmountOut) revert InsufficientOutput(amountOut, minAmountOut);

        // -------- sweep --------
        _sweep(address(weth), msg.sender);

        emit ZapOut(msg.sender, receiver, tokenOut, shares, wethIn, amountOut);
    }

    // =================================================================
    // ⬢ INTERNAL — PATH VALIDATION
    // ---------------------------------------------------------------
    // The path is caller-supplied calldata handed to an external
    // contract. Without these checks, a crafted path routes the swap
    // output somewhere other than WETH and the deposit accounting
    // silently reads someone else's leftovers.
    // =================================================================

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
            // last 20 bytes of the path
            token := shr(96, calldataload(add(path.offset, sub(path.length, 20))))
        }
    }

    // =================================================================
    // ⬢ INTERNAL — DUST
    // ---------------------------------------------------------------
    // Anything left here is claimable by the next caller. Sweep every
    // token this contract touched, every time, without exception.
    // =================================================================

    function _sweep(address token, address to) private {
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(token).safeTransfer(to, bal);
        }
    }
}