// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHealthOracle {
    function stalenessWindow() external view returns (uint256);

    function protocolIds(uint256 index) external view returns (bytes32);

    function protocolCount() external view returns (uint256);

    function scoreOf(bytes32 protocolId) external view returns (uint16 score, uint40 updatedAt);

    function registerProtocol(bytes32 protocolId, uint16 initialScore) external;

    function setScore(bytes32 protocolId, uint16 newScore) external;

    function setScores(bytes32[] calldata ids, uint16[] calldata values) external;

    function emergencyZero(bytes32 protocolId) external;
}
