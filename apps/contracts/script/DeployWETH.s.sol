// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WETH9} from "../src/WETH9.sol";

contract DeployWETHScript is Script {
    function run() external returns (WETH9 weth) {
        vm.startBroadcast();
        weth = new WETH9();
        vm.stopBroadcast();

        console.log("WETH9 deployed at:", address(weth));
    }
}
