// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HealthOracle} from "../oracle/HealthOracle.sol";
import {VigilVault} from "./VigilVault.sol";
import {IVaultFactory} from "../interface/IVaultFactory.sol";
import {IVigilVault} from "../interface/IVigilVault.sol";

// Deploys one VigilVault per underlying asset. Keeping a single canonical
// vault per asset (rather than allowing many) matches how VigilZapRouter is
// wired - it holds one immutable vault reference, not a registry.
contract VaultFactory is IVaultFactory {
    address[] public override vaults;
    mapping(address asset => address vault) public override vaultByAsset;

    event VaultCreated(
        address indexed asset, address indexed vault, address indexed oracle, IVigilVault.VaultKind kind
    );

    error ZeroAddress();
    error VaultAlreadyExists(address asset);

    function createVault(
        IERC20 asset,
        IVigilVault.VaultKind kind,
        HealthOracle oracle,
        address admin,
        address keeper,
        address guardian,
        string calldata name,
        string calldata symbol
    ) external override returns (VigilVault vault) {
        if (address(asset) == address(0)) revert ZeroAddress();
        if (vaultByAsset[address(asset)] != address(0)) revert VaultAlreadyExists(address(asset));

        vault = new VigilVault(asset, kind, oracle, admin, keeper, guardian, name, symbol);

        vaultByAsset[address(asset)] = address(vault);
        vaults.push(address(vault));

        emit VaultCreated(address(asset), address(vault), address(oracle), kind);
    }

    function vaultCount() external view override returns (uint256) {
        return vaults.length;
    }
}
