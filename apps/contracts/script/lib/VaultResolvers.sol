// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {VaultFactory} from "../../src/vault/VaultFactory.sol";
import {DeployRegistrar} from "./DeployRegistrar.sol";

// Shared "find or deploy the shared HealthOracle/VaultFactory" logic - used
// by both DeployVault.s.sol (one vault) and DeployManyMockVaults.s.sol
// (many vaults). Every vault deployed on a chain shares the same
// HealthOracle and VaultFactory regardless of how many vaults or which
// underlying tokens they use, so this lives in exactly one place instead
// of two copies drifting apart.
abstract contract VaultResolvers is Script, DeployRegistrar {
    function _resolveOracle() internal returns (address) {
        address override_ = vm.envOr("ORACLE_ADDRESS", address(0));
        if (override_ != address(0)) return override_;

        string memory path = string.concat("data/", vm.toString(block.chainid), "/deployedContracts.json");
        require(
            vm.exists(path),
            "No ORACLE_ADDRESS set and data/<chainid>/deployedContracts.json not found - run DeployHealthOracle.s.sol first, or set ORACLE_ADDRESS explicitly"
        );
        return vm.parseJsonAddress(vm.readFile(path), ".HealthOracle");
    }

    // A factory is stateless enough to reuse across every vault ever
    // created on this chain - deploying a fresh one each run would just
    // leave orphaned duplicates in deployedContracts.json overwriting each
    // other.
    function _resolveFactory() internal returns (address) {
        address override_ = vm.envOr("VAULT_FACTORY_ADDRESS", address(0));
        if (override_ != address(0)) return override_;

        string memory path = string.concat("data/", vm.toString(block.chainid), "/deployedContracts.json");
        if (vm.exists(path)) {
            string memory json = vm.readFile(path);
            if (vm.keyExistsJson(json, ".VaultFactory")) {
                address existing = vm.parseJsonAddress(json, ".VaultFactory");
                if (existing != address(0)) return existing;
            }
        }

        VaultFactory factory = new VaultFactory();
        _registerContract("VaultFactory", address(factory));
        return address(factory);
    }
}
