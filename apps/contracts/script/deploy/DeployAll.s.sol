// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HealthOracle} from "../../src/oracle/HealthOracle.sol";
import {VaultFactory} from "../../src/vault/VaultFactory.sol";
import {VigilVault} from "../../src/vault/VigilVault.sol";
import {IVigilVault} from "../../src/interface/IVigilVault.sol";
import {DeployRegistrar} from "../lib/DeployRegistrar.sol";

// Deploys the core stack in dependency order and registers all 3 in
// data/<chainid>/deployedContracts.json (see DeployRegistrar) so
// apps/web's sync-contracts.ts can pick them up:
//   HealthOracle -> VaultFactory -> VigilVault (via factory)
// Requires WETH9 already deployed (run DeployWETH.s.sol first on a local
// chain) - VigilVault wraps a real ERC20, it can't stand something up
// itself.
contract DeployAllScript is DeployRegistrar {
    address constant DEFAULT_LOCAL_ROLE_HOLDER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external returns (HealthOracle oracle, VaultFactory factory, VigilVault vault) {
        address weth = _resolveWeth();
        address admin = vm.envOr("ORACLE_ADMIN", DEFAULT_LOCAL_ROLE_HOLDER);
        address scorer = vm.envOr("ORACLE_SCORER", DEFAULT_LOCAL_ROLE_HOLDER);
        address guardian = vm.envOr("ORACLE_GUARDIAN", DEFAULT_LOCAL_ROLE_HOLDER);
        address keeper = vm.envOr("VAULT_KEEPER", DEFAULT_LOCAL_ROLE_HOLDER);
        uint256 stalenessWindow = vm.envOr("ORACLE_STALENESS_WINDOW", uint256(0));

        vm.startBroadcast();

        oracle = new HealthOracle(admin, scorer, guardian, stalenessWindow);
        _registerContract("HealthOracle", address(oracle));

        factory = new VaultFactory();
        _registerContract("VaultFactory", address(factory));

        vault = factory.createVault(
            IERC20(weth), IVigilVault.VaultKind.Single, oracle, admin, keeper, guardian, "Vigil WETH", "vgWETH"
        );
        _registerContract("VigilVault", address(vault));

        vm.stopBroadcast();

        console.log("HealthOracle:", address(oracle));
        console.log("VaultFactory:", address(factory));
        console.log("VigilVault:  ", address(vault));
    }

    function _resolveWeth() internal returns (address) {
        address override_ = vm.envOr("WETH_ADDRESS", address(0));
        if (override_ != address(0)) return override_;

        string memory path = string.concat("data/", vm.toString(block.chainid), "/deployedContracts.json");
        require(
            vm.exists(path),
            "No WETH_ADDRESS set and data/<chainid>/deployedContracts.json not found - run DeployWETH.s.sol first, or set WETH_ADDRESS explicitly on a non-local chain"
        );
        return vm.parseJsonAddress(vm.readFile(path), ".WETH9");
    }
}
