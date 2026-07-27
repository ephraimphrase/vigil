// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMorpho {
    function supply(address poolToken, address onBehalf, uint256 amount) external;
    function withdraw(address poolToken, uint256 amount) external;
}
