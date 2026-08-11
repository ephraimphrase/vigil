// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {HealthOracle} from "../../src/oracle/HealthOracle.sol";
import {VaultFactory} from "../../src/vault/VaultFactory.sol";
import {VigilVault} from "../../src/vault/VigilVault.sol";
import {DeployHealthOracleScript} from "./DeployHealthOracle.s.sol";
import {DeployVaultScript} from "./DeployVault.s.sol";

// Runs DeployHealthOracle.s.sol then DeployVault.s.sol back to back -
// everything about how each one deploys/registers/resolves overrides lives
// in that one place, not duplicated here.
contract DeployAllScript is Script {
    function run() external returns (HealthOracle oracle, VaultFactory factory, VigilVault vault) {
        oracle = new DeployHealthOracleScript().run();
        (factory, vault) = new DeployVaultScript().run();
    }
}
