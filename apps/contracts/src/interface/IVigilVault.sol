// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HealthOracle} from "../oracle/HealthOracle.sol";
import {IVigilProtocolAdapter} from "../adapter/IVigilProtocolAdapter.sol";

// Covers the Vigil-specific surface only - standard vault accounting
// (deposit/withdraw/totalAssets/...) already comes from IERC4626 via
// ERC4626, and role management from IAccessControl via AccessControl.
interface IVigilVault {
    function oracle() external view returns (HealthOracle);

    function adapters(uint256 index) external view returns (IVigilProtocolAdapter);

    function isAdapter(address adapter) external view returns (bool);

    function adapterCount() external view returns (uint256);

    function addAdapter(IVigilProtocolAdapter adapter) external;

    function removeAdapter(IVigilProtocolAdapter adapter) external;

    function targetWeights() external view returns (uint256[] memory weights, uint256 totalWeight);

    function rebalance() external;

    function emergencyEvacuate(IVigilProtocolAdapter adapter) external returns (uint256 withdrawn);
}
