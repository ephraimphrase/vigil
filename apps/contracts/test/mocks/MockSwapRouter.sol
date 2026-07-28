// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISwapRouter02} from "../../src/interface/ISwapRouter02.sol";
import {MockERC20} from "./MockERC20.sol";

// Swaps at a configurable rate and mints the output itself, so it never needs
// pre-funded liquidity. `honestRouter` can be flipped off to let a swap
// return less than amountOutMinimum — real routers never do this, but it's
// the only way to exercise VigilZapRouter's own defensive post-swap checks.
contract MockSwapRouter is ISwapRouter02 {
    using SafeERC20 for IERC20;

    uint256 public rateNumerator = 1;
    uint256 public rateDenominator = 1;
    bool public honestRouter = true;

    function setRate(uint256 numerator, uint256 denominator) external {
        rateNumerator = numerator;
        rateDenominator = denominator;
    }

    function setHonest(bool honest) external {
        honestRouter = honest;
    }

    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut) {
        address tokenIn = _firstToken(params.path);
        address tokenOut = _lastToken(params.path);

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);

        amountOut = params.amountIn * rateNumerator / rateDenominator;
        if (honestRouter) {
            require(amountOut >= params.amountOutMinimum, "MockSwapRouter: slippage");
        }

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
