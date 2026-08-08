// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";

// Shared helper every deploy script uses to record its output in
// data/<chainid>/deployedContracts.json - the single source
// apps/web's sync-contracts.ts script reads to generate a typed,
// ABI-attached deployedContracts.ts for the frontend.
//
// Only call this for addresses that are actual deployed contracts (need
// an ABI looked up from out/<Name>.sol/<Name>.json) - not EOAs or role
// addresses, which belong in each script's own free-form data file
// instead (see healthOracle.json's admin/scorer/guardian fields).
abstract contract DeployRegistrar is Script {
    function _registerContract(string memory name, address addr) internal {
        string memory dir = string.concat("data/", vm.toString(block.chainid));
        vm.createDir(dir, true);
        string memory path = string.concat(dir, "/deployedContracts.json");

        if (!vm.exists(path)) {
            vm.writeJson("{}", path);
        }
        vm.writeJson(vm.toString(addr), path, string.concat(".", name));
        console.log(string.concat(name, " registered at:"), addr);
    }
}
