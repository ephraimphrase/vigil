// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

// Shared apps/web/seed/strategies.json reader - used by both
// DeployMockStrategyAdapters.s.sol (one vault) and DeployManyMockVaults.s.sol
// (many vaults), so the jq-based extraction logic lives in exactly one
// place instead of two copies drifting apart.
abstract contract StrategySeedReader is Script {
    string constant SEED_PATH = "../web/seed/strategies.json";

    // Pulls id/protocolId/stratName/apyBps for strategies[index] in one jq
    // call - apy in the seed is a decimal (e.g. 4.8), which Solidity can't
    // parse directly as JSON, so the *100-and-round happens in jq rather
    // than trying to parse a float on-chain.
    function _strategyAt(uint256 index)
        internal
        returns (string memory id, string memory protocolId, string memory stratName, uint256 apyBps)
    {
        string[] memory cmd = new string[](3);
        cmd[0] = "bash";
        cmd[1] = "-c";
        cmd[2] = string.concat(
            "jq -j '.strategies[",
            vm.toString(index),
            '] | .id + "|" + .protocolId + "|" + .stratName + "|" + ((.apy*100)|round|tostring)\' ',
            SEED_PATH
        );
        bytes memory result = vm.ffi(cmd);
        string[] memory parts = vm.split(string(result), "|");
        return (parts[0], parts[1], parts[2], vm.parseUint(parts[3]));
    }

    function _seedLength() internal returns (uint256) {
        string[] memory cmd = new string[](3);
        cmd[0] = "bash";
        cmd[1] = "-c";
        cmd[2] = string.concat("jq -j '\"n=\" + (.strategies | length | tostring)' ", SEED_PATH);
        bytes memory result = vm.ffi(cmd);
        string[] memory parts = vm.split(string(result), "=");
        return vm.parseUint(parts[1]);
    }
}
