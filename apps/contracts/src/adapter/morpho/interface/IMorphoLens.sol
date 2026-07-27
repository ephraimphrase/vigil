// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMorphoLens {
    function getCurrentSupplyBalanceInOf(address poolToken, address user)
        external
        view
        returns (uint256 balanceInP2P, uint256 balanceOnPool, uint256 totalBalance);
}
