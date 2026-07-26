// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WETH9} from "../src/token/WETH9.sol";

struct TokenRecord {
    address token;
    string symbol;
    string name;
}

contract DeployWETHScript is Script {
    function run() external returns (WETH9 weth) {
        vm.startBroadcast();
        weth = new WETH9();
        vm.stopBroadcast();

        console.log("WETH9 deployed at:", address(weth));

        _appendToTokensFile(_tokenRecordJson(TokenRecord({token: address(weth), symbol: "WETH", name: "Wrapped Ether"})));
    }

    // ─── UTILS ───
    function _appendToTokensFile(string memory newEntryJson) internal {
        string memory dir = string.concat("data/", vm.toString(block.chainid));
        string memory path = string.concat(dir, "/token.json");
        vm.createDir(dir, true);

        string memory json;
        if (vm.exists(path)) {
            string memory existingInner = _stripArrayBrackets(vm.readFile(path));
            json = bytes(existingInner).length == 0
                ? string.concat("[", newEntryJson, "]")
                : string.concat("[", existingInner, ",", newEntryJson, "]");
        } else {
            json = string.concat("[", newEntryJson, "]");
        }

        vm.writeJson(json, path);
        console.log("wrote deployed tokens to", path);
    }

    function _tokenRecordJson(TokenRecord memory t) internal pure returns (string memory) {
        return string.concat(
            "{\"token\":\"", vm.toString(t.token), "\",\"symbol\":\"", t.symbol, "\",\"name\":\"", t.name, "\"}"
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
}
