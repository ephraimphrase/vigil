// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";

// ─── TYPES ───
// Field order here MUST match the key order emitted by _pull_defi_tokens.sh's
// jq object construction. Foundry's parseJson -> abi.decode is order-sensitive,
// not name-sensitive.
struct TokenData {
    string symbol;
    string name;
}

contract PullDefiTokensScript is Script {
    // ─── CONSTANTS ───
    // Underscore prefix: this is an FFI helper invoked by run() below, not a
    // standalone entrypoint you'd run directly.
    string constant FETCH_SCRIPT = "script/_pull_defi_tokens.sh";
    uint256 constant PRICE_SCALE = 1e6;

    // ─── MAIN ───
    function run() external {
        TokenData[] memory tokens = _fetchTokens();
        _logTokens(tokens);
    }

    // ─── UTILS ───
    function _fetchTokens() internal returns (TokenData[] memory) {
        string[] memory inputs = new string[](2);
        inputs[0] = "bash";
        inputs[1] = FETCH_SCRIPT;

        // vm.ffi shells out and returns stdout. Since the fetch script's output
        // is plain JSON text (not 0x-prefixed hex), Foundry hands it back as
        // the raw string bytes rather than trying to hex-decode it.
        bytes memory raw = vm.ffi(inputs);
        string memory json = string(raw);

        require(bytes(json).length > 0, "empty response from fetch script");

        bytes memory encoded = vm.parseJson(json);
        return abi.decode(encoded, (TokenData[]));
    }

    function _logTokens(TokenData[] memory tokens) internal pure {
        console2.log("tokens fetched:", tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            console2.log("---");
            console2.log(tokens[i].symbol, tokens[i].name);
        }
    }
}
