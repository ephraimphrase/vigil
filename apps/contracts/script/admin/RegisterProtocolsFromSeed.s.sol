// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HealthOracle} from "../../src/oracle/HealthOracle.sol";

// Registers every protocol from apps/web/seed/protocols.json onto
// HealthOracle - the same canonical protocol list apps/web/scripts/seed-db.ts
// seeds into Postgres, used here as the single source of truth for "which
// protocols exist" instead of a separately hand-maintained list that could
// drift from it. Each protocol's seeded `score` becomes its initialScore.
//
// protocolId is bytes32(bytes(id)) - the same left-aligned ASCII encoding
// `cast format-bytes32-string <id>` produces, so a later setScore/scoreOf
// call for e.g. "aave" needs that exact same encoding.
//
// Must be run by the current DEFAULT_ADMIN_ROLE holder (ORACLE_ADMIN) -
// registerProtocol is admin-gated, not scorer-gated. Safe to re-run: an
// already-registered protocol is skipped (logged, not reverted) rather
// than aborting the rest of the batch.
//
// Usage:
//   ORACLE_ADDRESS=0x... forge script script/admin/RegisterProtocolsFromSeed.s.sol \
//     --rpc-url $RPC_URL --broadcast --private-key $DEPLOYER_KEY
contract RegisterProtocolsFromSeedScript is Script {
    string constant SEED_PATH = "../web/seed/protocols.json";

    function run() external {
        HealthOracle oracle = HealthOracle(vm.envAddress("ORACLE_ADDRESS"));

        string memory json = vm.readFile(SEED_PATH);
        // parseJsonStringArray/parseJsonUintArray don't support "$[*].field"
        // wildcard projection ("must return exactly one JSON value") - pull
        // the array length, then extract each object's id/score by index
        // instead. Also sidesteps decoding the rest of each object as a
        // struct, which would choke on its non-integer fields (delta24h,
        // tvlDelta24h) that Solidity has no type for anyway.
        //
        // vm.parseJsonArrayLength itself is unimplemented by this forge
        // build (forge-std declares it but the installed forge nightly
        // rejects it as an unknown cheatcode) - shell out to jq via ffi
        // instead. The "n=" prefix matters: forge's ffi return-decoding
        // treats a bare numeric string like "22" as hex bytes (0x22) rather
        // than text, so a non-hex prefix forces it to stay a UTF-8 string.
        uint256 length = _seedLength();

        console.log("Registering", length, "protocols from", SEED_PATH);

        vm.startBroadcast();
        for (uint256 i; i < length; ++i) {
            string memory idPath = string.concat("$[", vm.toString(i), "].id");
            string memory scorePath = string.concat("$[", vm.toString(i), "].score");

            string memory id = vm.parseJsonString(json, idPath);
            uint16 initialScore = uint16(vm.parseJsonUint(json, scorePath));
            bytes32 protocolId = bytes32(bytes(id));

            try oracle.registerProtocol(protocolId, initialScore) {
                console.log("  Registered:", id, initialScore);
            } catch {
                console.log("  Already registered, skipping:", id);
            }
        }
        vm.stopBroadcast();
    }

    function _seedLength() internal returns (uint256) {
        string[] memory cmd = new string[](3);
        cmd[0] = "bash";
        cmd[1] = "-c";
        cmd[2] = string.concat("jq -j '\"n=\" + (length|tostring)' ", SEED_PATH);
        bytes memory result = vm.ffi(cmd);
        string[] memory parts = vm.split(string(result), "=");
        return vm.parseUint(parts[1]);
    }
}
