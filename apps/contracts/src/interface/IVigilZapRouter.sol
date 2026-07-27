// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ISwapRouter02} from "./ISwapRouter02.sol";

interface IVigilZapRouter {
    function vault() external view returns (IERC4626);

    function weth() external view returns (IERC20);

    function swapRouter() external view returns (ISwapRouter02);

    function zapIn(
        address tokenIn,
        uint256 amountIn,
        bytes calldata path,
        uint256 minWethOut,
        uint256 minSharesOut,
        address receiver,
        uint256 deadline
    ) external returns (uint256 shares);

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
    ) external returns (uint256 shares);

    function zapOut(
        uint256 shares,
        address tokenOut,
        bytes calldata path,
        uint256 minAmountOut,
        address receiver,
        uint256 deadline
    ) external returns (uint256 amountOut);
}
