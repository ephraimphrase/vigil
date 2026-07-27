// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HealthOracle} from "../oracle/HealthOracle.sol";
import {VigilVault} from "../vault/VigilVault.sol";

interface IVaultFactory {
    function vaults(uint256 index) external view returns (address);

    function vaultByAsset(address asset) external view returns (address);

    function vaultCount() external view returns (uint256);

    function createVault(
        IERC20 asset,
        HealthOracle oracle,
        address admin,
        address keeper,
        address guardian,
        string calldata name,
        string calldata symbol
    ) external returns (VigilVault vault);
}
