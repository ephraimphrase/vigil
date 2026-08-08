// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

interface ICurveRouter {
    function exchange_multiple(
        address[9] calldata _route,
        uint256[3][4] calldata _swap_params,
        uint256 _amount,
        uint256 _expected
    ) external returns (uint256);
}
