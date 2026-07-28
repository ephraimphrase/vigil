// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HealthOracle} from "../src/oracle/HealthOracle.sol";

contract DeployHealthOracleScript is Script {
    // Anvil default account 0 — matches the DEPLOYER_KEY documented in
    // .env.example, so a bare local run has every role held by the same
    // key without extra setup. Production deploys MUST override
    // ORACLE_ADMIN/ORACLE_SCORER/ORACLE_GUARDIAN with distinct addresses;
    // collapsing them back to one key defeats the role separation the
    // contract's threat model is built around.
    address constant DEFAULT_LOCAL_ROLE_HOLDER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external returns (HealthOracle oracle) {
        address admin = vm.envOr("ORACLE_ADMIN", DEFAULT_LOCAL_ROLE_HOLDER);
        address scorer = vm.envOr("ORACLE_SCORER", DEFAULT_LOCAL_ROLE_HOLDER);
        address guardian = vm.envOr("ORACLE_GUARDIAN", DEFAULT_LOCAL_ROLE_HOLDER);
        uint256 stalenessWindow = vm.envOr("ORACLE_STALENESS_WINDOW", uint256(0));

        vm.startBroadcast();
        oracle = new HealthOracle(admin, scorer, guardian, stalenessWindow);
        vm.stopBroadcast();

        console.log("HealthOracle deployed at:", address(oracle));
        console.log("  admin:   ", admin);
        console.log("  scorer:  ", scorer);
        console.log("  guardian:", guardian);
        console.log("  stalenessWindow (0 = contract default 6h):", stalenessWindow);

        _writeDeploymentFile(oracle, admin, scorer, guardian);
    }

    function _writeDeploymentFile(HealthOracle oracle, address admin, address scorer, address guardian) internal {
        string memory dir = string.concat("data/", vm.toString(block.chainid));
        vm.createDir(dir, true);

        string memory json = string.concat(
            "{\"oracle\":\"",
            vm.toString(address(oracle)),
            "\",\"admin\":\"",
            vm.toString(admin),
            "\",\"scorer\":\"",
            vm.toString(scorer),
            "\",\"guardian\":\"",
            vm.toString(guardian),
            "\"}"
        );

        string memory path = string.concat(dir, "/healthOracle.json");
        vm.writeJson(json, path);
        console.log("wrote oracle deployment to", path);
    }
}
