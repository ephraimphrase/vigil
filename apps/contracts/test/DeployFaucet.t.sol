// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DeployFaucetScript} from "../script/deploy/DeployFaucet.s.sol";

// Exercises _readTokenAddresses() against the real, on-disk token.json to
// catch struct/field-order mismatches (vm.parseJson -> abi.decode is
// alphabetical-field-order-sensitive - see the struct's own comment) before
// they'd otherwise only surface mid-deploy.
contract DeployFaucetTest is Test, DeployFaucetScript {
    function test_ReadsRealTokenJsonAddresses() public {
        vm.chainId(84532);
        address[] memory tokens = _readTokenAddresses();
        assertGt(tokens.length, 0);
        for (uint256 i = 0; i < tokens.length; i++) {
            assertTrue(tokens[i] != address(0));
        }
    }
}
