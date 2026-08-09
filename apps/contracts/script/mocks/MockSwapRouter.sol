// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISwapRouter02} from "../../src/interface/ISwapRouter02.sol";
import {MockERC20} from "./MockERC20.sol";

// script/'s own copy of the ISwapRouter02 stand-in DeployAll.s.sol wires
// VigilZapRouter to on local anvil, where no real Uniswap deployment
// exists. Deliberately not shared with test/mocks/MockSwapRouter.sol
// (which VigilZapRouter.t.sol uses) - scripts and tests each own their
// own fixtures rather than reaching across into the other's folder.
//
// Swaps at a configurable rate and mints the output itself, so it never
// needs pre-funded liquidity.
contract MockSwapRouter is ISwapRouter02 {
    using SafeERC20 for IERC20;

    uint256 public rateNumerator = 1;
    uint256 public rateDenominator = 1;

    function setRate(uint256 numerator, uint256 denominator) external {
        rateNumerator = numerator;
        rateDenominator = denominator;
    }

    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut) {
        address tokenIn = _firstToken(params.path);
        address tokenOut = _lastToken(params.path);

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);

        amountOut = params.amountIn * rateNumerator / rateDenominator;
        require(amountOut >= params.amountOutMinimum, "MockSwapRouter: slippage");

        MockERC20(tokenOut).mint(params.recipient, amountOut);
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
}
