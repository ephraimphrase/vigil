// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interface/beefy/IBeefySwapper.sol";

contract UniV2ToSwapperAdapter {
    using SafeERC20 for IERC20;

    address public swapper;

    constructor(address _swapper) {
        swapper = _swapper;
    }

    function swapExactTokensForTokens(uint256 amountIn, uint256, address[] calldata path, address, uint256)
        external
        returns (uint256[] memory amounts)
    {
        address from = path[0];
        address to = path[path.length - 1];
        IERC20(from).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(from).forceApprove(swapper, amountIn);
        uint256 amountOut = IBeefySwapper(swapper).swap(from, to, amountIn);
        IERC20(to).safeTransfer(msg.sender, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
    }
}
