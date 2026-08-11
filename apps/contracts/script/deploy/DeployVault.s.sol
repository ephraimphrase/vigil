// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HealthOracle} from "../../src/oracle/HealthOracle.sol";
import {VaultFactory} from "../../src/vault/VaultFactory.sol";
import {VigilVault} from "../../src/vault/VigilVault.sol";
import {IVigilVault} from "../../src/interface/IVigilVault.sol";
import {VaultResolvers} from "../lib/VaultResolvers.sol";

// Standalone VaultFactory + VigilVault deploy, split out from
// DeployAll.s.sol so a vault can be deployed on its own - e.g. a second
// vault for a different underlying asset, reusing the existing
// HealthOracle and VaultFactory, without redeploying the whole stack.
//
// Reuses an already-deployed VaultFactory from
// data/<chainid>/deployedContracts.json if one exists (a factory has no
// per-asset state of its own worth resetting), and requires HealthOracle to
// already be deployed (run DeployHealthOracle.s.sol or DeployAll.s.sol
// first) - a vault is meaningless without a health score to allocate
// against.
//
// Usage:
//   forge script script/deploy/DeployVault.s.sol --rpc-url $RPC_URL --broadcast --private-key $DEPLOYER_KEY
// Optional overrides: WETH_ADDRESS, ORACLE_ADDRESS, VAULT_FACTORY_ADDRESS, VAULT_NAME, VAULT_SYMBOL
contract DeployVaultScript is VaultResolvers {
    address constant DEFAULT_LOCAL_ROLE_HOLDER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external returns (VaultFactory factory, VigilVault vault) {
        address weth = _resolveWeth();
        HealthOracle oracle = HealthOracle(_resolveOracle());
        address admin = vm.envOr("ORACLE_ADMIN", DEFAULT_LOCAL_ROLE_HOLDER);
        address keeper = vm.envOr("VAULT_KEEPER", DEFAULT_LOCAL_ROLE_HOLDER);
        address guardian = vm.envOr("ORACLE_GUARDIAN", DEFAULT_LOCAL_ROLE_HOLDER);
        string memory name = vm.envOr("VAULT_NAME", string("Vigil WETH"));
        string memory symbol = vm.envOr("VAULT_SYMBOL", string("vgWETH"));

        vm.startBroadcast();

        factory = VaultFactory(_resolveFactory());

        vault = factory.createVault(
            IERC20(weth), IVigilVault.VaultKind.Single, oracle, admin, keeper, guardian, name, symbol
        );
        // "VigilVault" is the canonical default vault other scripts fall
        // back to when no override is given (e.g.
        // DeployMockStrategyAdapters.s.sol's _resolveVault()) - only claim
        // that key if nothing already holds it, so a second/third vault
        // deployed with this script doesn't clobber an earlier one. Every
        // vault also gets its own "Vault_{symbol}" key regardless, so it's
        // individually addressable either way.
        string memory deployedPath = string.concat("data/", vm.toString(block.chainid), "/deployedContracts.json");
        bool hasDefaultVault = vm.exists(deployedPath) && vm.keyExistsJson(vm.readFile(deployedPath), ".VigilVault");
        if (!hasDefaultVault) {
            _registerContract("VigilVault", address(vault));
        }
        _registerContract(string.concat("Vault_", symbol), address(vault));

        vm.stopBroadcast();

        console.log("VaultFactory:", address(factory));
        console.log("VigilVault:  ", address(vault));
    }

    function _resolveWeth() internal returns (address) {
        address override_ = vm.envOr("WETH_ADDRESS", address(0));
        if (override_ != address(0)) return override_;

        string memory path = string.concat("data/", vm.toString(block.chainid), "/deployedContracts.json");
        require(
            vm.exists(path),
            "No WETH_ADDRESS set and data/<chainid>/deployedContracts.json not found - run DeployWETH.s.sol first, or set WETH_ADDRESS explicitly"
        );
        return vm.parseJsonAddress(vm.readFile(path), ".WETH9");
    }
}
