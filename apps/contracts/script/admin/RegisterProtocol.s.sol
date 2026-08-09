// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HealthOracle} from "../../src/oracle/HealthOracle.sol";

// Registers one or more protocols on HealthOracle - required once per
// protocol before setScore()/scoreOf() will work for it (a fresh oracle
// starts with zero protocols registered; NotRegistered fires for anything
// not registered yet). Must be run by the current DEFAULT_ADMIN_ROLE
// holder (ORACLE_ADMIN) - registerProtocol is deliberately admin-gated,
// not scorer-gated (see HealthOracle.sol).
//
// protocolId is bytes32(bytes(name)) - the same left-aligned ASCII
// encoding `cast format-bytes32-string <name>` produces, so whatever you
// pass here as a name is exactly what a later setScore/scoreOf call needs
// to pass too.
//
// Safe to re-run: a name that's already registered gets skipped (logged,
// not reverted) rather than aborting the rest of the batch.
//
// Usage:
//   ORACLE_ADDRESS=0x... PROTOCOLS=aave,compound,curve [INITIAL_SCORE=50] \
//     forge script script/admin/RegisterProtocol.s.sol --rpc-url $RPC_URL --broadcast --private-key $DEPLOYER_KEY
contract RegisterProtocolScript is Script {
    function run() external {
        HealthOracle oracle = HealthOracle(vm.envAddress("ORACLE_ADDRESS"));
        string[] memory names = vm.envString("PROTOCOLS", ",");
        uint16 initialScore = uint16(vm.envOr("INITIAL_SCORE", uint256(50)));

        vm.startBroadcast();
        for (uint256 i; i < names.length; ++i) {
            bytes32 protocolId = bytes32(bytes(names[i]));

            try oracle.registerProtocol(protocolId, initialScore) {
                console.log("Registered:", names[i]);
                console.logBytes32(protocolId);
            } catch {
                console.log("Already registered, skipping:", names[i]);
            }
        }
        vm.stopBroadcast();
    }
}
