// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVigilProtocolAdapter {
    function protocolId() external view returns (bytes32);

    function asset() external view returns (address);

    function totalAssets() external view returns (uint256);

    function maxWithdraw() external view returns (uint256);

    function deposit(uint256 amount) external returns (uint256 supplied);

    function withdraw(uint256 amount) external returns (uint256 withdrawn);

    function withdrawAll() external returns (uint256 withdrawn);
}
