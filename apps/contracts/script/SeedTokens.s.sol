// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {SeedTokenFactory} from "../src/token/SeedTokenFactory.sol";
import {TokenRecord} from "./DeployWETH.s.sol";

// ─── TYPES ───
// Field order here MUST match the key order emitted by _pull_defi_tokens.sh's
// jq object construction. Foundry's parseJson -> abi.decode is order-sensitive,
// not name-sensitive.
struct TokenData {
    string symbol;
    string name;
}

contract SeedTokensScript is Script {
    // ─── CONSTANTS ───
    // Underscore prefix: this is an FFI helper invoked by run() below, not a
    // standalone entrypoint you'd run directly.
    string constant FETCH_SCRIPT = "script/_pull_defi_tokens.sh";
    uint256 constant PRICE_SCALE = 1e6;
    uint256 constant LOCAL_CHAIN_ID = 31337;

    // ─── MAIN ───
    function run() external returns (SeedTokenFactory factory) {
        if (block.chainid != LOCAL_CHAIN_ID) {
            console2.log("not a local chain, skipping seed tokens");
            return factory;
        }

        TokenData[] memory tokens = _fetchTokens();
        _logTokens(tokens);

        vm.startBroadcast();
        factory = new SeedTokenFactory();
        _deployTokens(factory, tokens);
        vm.stopBroadcast();

        console2.log("---");
        console2.log("SeedTokenFactory deployed at:", address(factory));
        console2.log("tokens deployed:", factory.tokenCount());

        _writeTokensFile(factory);
    }

    // ─── UTILS ───
    function _writeTokensFile(SeedTokenFactory factory) internal {
        SeedTokenFactory.TokenInfo[] memory deployed = factory.allTokens();
        if (deployed.length == 0) return;

        string[] memory entries = new string[](deployed.length);
        for (uint256 i = 0; i < deployed.length; i++) {
            entries[i] = _tokenRecordJson(
                TokenRecord({
                    token: deployed[i].token,
                    symbol: deployed[i].symbol,
                    name: deployed[i].name,
                    decimals: 18
                })
            );
        }

        _appendToTokensFile(_joinWithCommas(entries));
    }

    // Repeatedly accumulating via string.concat is O(n^2) - each call copies
    // the entire string built so far - which blows the script memory limit
    // once there are hundreds of tokens. This joins in a single pre-sized
    // buffer instead.
    function _joinWithCommas(string[] memory items) internal pure returns (string memory) {
        if (items.length == 0) return "";

        uint256 totalLen = items.length - 1; // commas between entries
        for (uint256 i = 0; i < items.length; i++) {
            totalLen += bytes(items[i]).length;
        }

        bytes memory buf = new bytes(totalLen);
        uint256 pos = 0;
        for (uint256 i = 0; i < items.length; i++) {
            if (i > 0) buf[pos++] = ",";
            bytes memory item = bytes(items[i]);
            for (uint256 j = 0; j < item.length; j++) {
                buf[pos++] = item[j];
            }
        }
        return string(buf);
    }

    function _appendToTokensFile(string memory newEntriesJson) internal {
        string memory dir = string.concat("data/", vm.toString(block.chainid));
        string memory path = string.concat(dir, "/token.json");
        vm.createDir(dir, true);

        string memory json;
        if (vm.exists(path)) {
            string memory existingInner = _stripArrayBrackets(vm.readFile(path));
            json = bytes(existingInner).length == 0
                ? string.concat("[", newEntriesJson, "]")
                : string.concat("[", existingInner, ",", newEntriesJson, "]");
        } else {
            json = string.concat("[", newEntriesJson, "]");
        }

        vm.writeJson(json, path);
        console2.log("wrote deployed tokens to", path);
    }

    function _tokenRecordJson(TokenRecord memory t) internal pure returns (string memory) {
        return string.concat(
            "{\"token\":\"",
            vm.toString(t.token),
            "\",\"symbol\":\"",
            t.symbol,
            "\",\"name\":\"",
            t.name,
            "\",\"decimals\":",
            vm.toString(t.decimals),
            "}"
        );
    }

    // Foundry's vm.parseJson -> abi.decode cannot reliably round-trip a JSON
    // array with exactly one element (it collapses to the bare element
    // instead of a length-1 array), so existing entries are carried forward
    // as raw text rather than parsed back into structs.
    function _stripArrayBrackets(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        uint256 start = 0;
        while (start < b.length && b[start] != "[") start++;
        uint256 end = b.length;
        while (end > 0 && b[end - 1] != "]") end--;
        if (end == 0 || start + 1 >= end - 1) {
            return "";
        }
        uint256 innerLen = (end - 1) - (start + 1);
        bytes memory inner = new bytes(innerLen);
        for (uint256 i = 0; i < innerLen; i++) {
            inner[i] = b[start + 1 + i];
        }
        return string(inner);
    }

    function _deployTokens(SeedTokenFactory factory, TokenData[] memory tokens) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            // CoinGecko occasionally lists more than one token under the same
            // symbol (wrapped/bridged variants); the factory keys on symbol,
            // so keep the first hit and skip the rest instead of reverting.
            if (factory.tokenBySymbol(tokens[i].symbol) != address(0)) {
                console2.log("skipping duplicate symbol:", tokens[i].symbol);
                continue;
            }
            factory.deployToken(tokens[i].name, tokens[i].symbol);
        }
    }

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
