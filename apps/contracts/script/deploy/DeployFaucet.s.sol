// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Faucet} from "../../src/token/Faucet.sol";
import {DeployRegistrar} from "../lib/DeployRegistrar.sol";

contract DeployFaucetScript is DeployRegistrar {
    uint256 constant LOCAL_CHAIN_ID = 31337;
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;

    // Field order is alphabetical (decimals, logoURI, name, symbol, token),
    // matching data/<chainid>/token.json's on-disk shape - see
    // SeedTokens.s.sol's TokenData/_tokenRecordJson for why (parseJson ->
    // abi.decode sorts JSON object keys alphabetically before assigning
    // struct fields positionally, regardless of source key order, and must
    // match exactly - no "kind" field, that's never actually written).
    struct TokenJsonRecord {
        uint8 decimals;
        string logoURI;
        string name;
        string symbol;
        address token;
    }

    function run() external returns (Faucet faucet) {
        if (block.chainid != LOCAL_CHAIN_ID && block.chainid != BASE_SEPOLIA_CHAIN_ID) {
            console2.log("not a local or Sepolia chain, skipping faucet deploy");
            return faucet;
        }

        address[] memory tokens = _readTokenAddresses();
        if (tokens.length == 0) {
            console2.log("no tokens found in token.json, skipping faucet deploy");
            return faucet;
        }

        // Faucet.claim/claimMany mint each token to themselves and forward
        // the result - no pre-funded balance needed, so unlike a plain
        // distributor this deploy needs nothing from the deployer but gas.
        // Owner defaults to the deployer and can call setSupportedTokens
        // immediately in this same broadcast; FAUCET_OWNER can still hand
        // ownership to a different address afterward via transferOwnership.
        address deployer = vm.addr(vm.envUint("DEPLOYER_KEY"));
        address owner = vm.envOr("FAUCET_OWNER", deployer);

        vm.startBroadcast();
        faucet = new Faucet(deployer);
        faucet.setSupportedTokens(tokens, true);
        if (owner != deployer) {
            faucet.transferOwnership(owner);
        }
        vm.stopBroadcast();

        console2.log("Faucet deployed at:", address(faucet));
        console2.log("  owner:", owner);
        console2.log("  tokens supported:", tokens.length);

        _registerContract("Faucet", address(faucet));
    }

    function _readTokenAddresses() internal view returns (address[] memory addresses) {
        string memory path = string.concat("data/", vm.toString(block.chainid), "/token.json");
        if (!vm.exists(path)) return addresses;

        string memory json = vm.readFile(path);
        bytes memory encoded = vm.parseJson(json);
        TokenJsonRecord[] memory records = abi.decode(encoded, (TokenJsonRecord[]));

        addresses = new address[](records.length);
        for (uint256 i = 0; i < records.length; i++) {
            addresses[i] = records[i].token;
        }
    }
}
