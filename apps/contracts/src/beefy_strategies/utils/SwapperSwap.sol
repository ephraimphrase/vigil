// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "../interface/beefy/IBeefySwapper.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SwapperSwap {
    using SafeERC20 for IERC20;

    address public swapper;

    constructor(address _swapper) {
        swapper = _swapper;
    }

    function swap(address[] calldata route, uint256 amount) external {
        IERC20(route[0]).safeTransferFrom(msg.sender, address(this), amount);

        for (uint256 i; i < route.length - 1; ++i) {
            address from = route[i];
            address to = route[i + 1];
            uint256 bal = IERC20(from).balanceOf(address(this));
            IERC20(from).approve(swapper, bal);
            IBeefySwapper(swapper).swap(from, to, bal);
        }

        IERC20 out = IERC20(route[route.length - 1]);
        out.safeTransfer(msg.sender, out.balanceOf(address(this)));
    }
}
