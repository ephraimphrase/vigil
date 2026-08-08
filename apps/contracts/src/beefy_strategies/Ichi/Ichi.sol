// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IchiVault {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function deposit(uint256 deposit0, uint256 deposit1, address to) external returns (uint256 shares);
}
