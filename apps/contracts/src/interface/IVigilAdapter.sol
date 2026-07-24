// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IVigilAdapter {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external returns (uint256 withdrawn);

    function valueInBaseAsset() external view returns (uint256);
}
