// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockStrategyAdapter} from "../../src/adapter/MockStrategyAdapter.sol";
import {VigilVault} from "../../src/vault/VigilVault.sol";
import {IVigilProtocolAdapter} from "../../src/interface/IVigilProtocolAdapter.sol";
import {DeployRegistrar} from "../lib/DeployRegistrar.sol";
import {StrategySeedReader} from "../lib/StrategySeedReader.sol";

interface IWETH9 {
    function deposit() external payable;
}

// Deploys one MockStrategyAdapter per STRATEGY in
// apps/web/seed/strategies.json (42 entries, one per
// src/beefy_strategies/**/Strategy*.sol file, each with its real
// stratName() and a curated APY). MockStrategyAdapter implements
// IVigilProtocolAdapter directly - no BeefyStrategyAdapter wrapping; that's
// reserved for real Common/ strategies, not mocks. Only for protocols with
// no real Base Sepolia deployment (see data/84532/protocolAddressBook.json);
// real ones (Aave, Morpho) get a real adapter wired to the real protocol
// instead of this.
//
// Targets whichever vault VAULT_ADDRESS (or .VigilVault in
// deployedContracts.json) points at, and always reads that vault's own
// asset() rather than assuming WETH - see WRAP_NATIVE below for how that
// affects reserve funding.
//
// Multiple strategies share a protocolId (curve has 8 variants, pendle 4,
// gmx 4, balancer/silo/morpho/stargate/velodrome 2-3 each) - but
// VigilVault.addAdapter() rejects a second adapter for a protocolId
// already whitelisted (DuplicateProtocol), and MAX_ADAPTERS caps the vault
// at 8 total regardless. So: every strategy gets deployed for real
// (individually verifiable), but only the FIRST strategy encountered per
// unique protocolId gets wired into the live vault.
//
// Env vars:
//   VAULT_ADDRESS   optional - defaults to .VigilVault in deployedContracts.json
//   WRAP_NATIVE     optional, default true - wraps native currency into the
//                   vault's token to fund each reserve (only correct if
//                   that token is WETH-like). Set false for any other
//                   token; the broadcaster must already hold
//                   RESERVE_PER_ADAPTER * (strategy count) of it instead.
//   STRAT_NAME / PROTOCOL_ID / APY_BPS   set all three to deploy ONE custom
//                   strategy instead of the full 42-entry batch (APY_BPS
//                   is basis points, e.g. 650 = 6.50%).
//
// Usage:
//   forge script script/deploy/DeployMockStrategyAdapters.s.sol \
//     --rpc-url $RPC_URL --broadcast --private-key <ORACLE_ADMIN private key>
//
// Must broadcast as the VigilVault admin - addAdapter() is admin-gated.
contract DeployMockStrategyAdaptersScript is Script, DeployRegistrar, StrategySeedReader {
    uint256 constant RESERVE_PER_ADAPTER = 0.001 ether;

    bytes32[] private _wiredProtocolIds;

    function run() external {
        address vault = _resolveVault();
        address token = address(VigilVault(vault).asset());
        uint256 maxAdapters = VigilVault(vault).MAX_ADAPTERS();

        string memory singleName = vm.envOr("STRAT_NAME", string(""));
        if (bytes(singleName).length > 0) {
            string memory protocolIdStr = vm.envString("PROTOCOL_ID");
            uint256 apyBps = vm.envUint("APY_BPS");
            vm.startBroadcast();
            _deployOne(vault, token, maxAdapters, singleName, protocolIdStr, singleName, apyBps);
            vm.stopBroadcast();
            return;
        }

        uint256 length = _seedLength();
        console.log("Deploying", length, "mock strategy adapters from", SEED_PATH);
        console.log("VigilVault.MAX_ADAPTERS is", maxAdapters, "- only one strategy per unique protocolId gets wired");

        vm.startBroadcast();
        for (uint256 i; i < length; ++i) {
            (string memory id, string memory protocolIdStr, string memory stratName, uint256 apyBps) = _strategyAt(i);
            _deployOne(vault, token, maxAdapters, id, protocolIdStr, stratName, apyBps);
        }
        vm.stopBroadcast();
    }

    // Shared by both the batch loop and the single-strategy path - deploys
    // one MockStrategyAdapter, funds its reserve, and wires it into the
    // vault if there's room and its protocolId isn't already live.
    function _deployOne(
        address vault,
        address token,
        uint256 maxAdapters,
        string memory id,
        string memory protocolIdStr,
        string memory stratName,
        uint256 apyBps
    ) internal {
        bytes32 protocolId = bytes32(bytes(protocolIdStr));

        MockStrategyAdapter adapter = new MockStrategyAdapter(vault, token, protocolId, apyBps, stratName);
        _registerContract(string.concat("StrategyAdapter_", id), address(adapter));

        if (vm.envOr("WRAP_NATIVE", true)) {
            IWETH9(token).deposit{value: RESERVE_PER_ADAPTER}();
        }
        IERC20(token).approve(address(adapter), RESERVE_PER_ADAPTER);
        adapter.fundReserve(RESERVE_PER_ADAPTER);

        bool alreadyWired = _isProtocolWired(protocolId);
        bool wired = !alreadyWired && VigilVault(vault).adapterCount() < maxAdapters;
        if (wired) {
            VigilVault(vault).addAdapter(IVigilProtocolAdapter(address(adapter)));
            _wiredProtocolIds.push(protocolId);
        }

        console.log(string.concat("  ", id, " (", stratName, "): apyBps="), apyBps, "adapter=", address(adapter));
        if (wired) {
            console.log("    wired into vault");
        } else if (alreadyWired) {
            console.log("    deployed, NOT wired (protocolId already has a strategy live)");
        } else {
            console.log("    deployed, NOT wired (MAX_ADAPTERS reached)");
        }
    }

    function _isProtocolWired(bytes32 protocolId) internal view returns (bool) {
        uint256 n = _wiredProtocolIds.length;
        for (uint256 i; i < n; ++i) {
            if (_wiredProtocolIds[i] == protocolId) return true;
        }
        return false;
    }

    function _resolveVault() internal returns (address) {
        address override_ = vm.envOr("VAULT_ADDRESS", address(0));
        if (override_ != address(0)) return override_;

        string memory json = _deployedContractsJson();
        require(
            vm.keyExistsJson(json, ".VigilVault"),
            "No VigilVault in deployedContracts.json and VAULT_ADDRESS not set - run DeployVault.s.sol first, or pass VAULT_ADDRESS explicitly"
        );
        return vm.parseJsonAddress(json, ".VigilVault");
    }

    function _deployedContractsJson() internal returns (string memory) {
        string memory path = string.concat("data/", vm.toString(block.chainid), "/deployedContracts.json");
        require(vm.exists(path), "data/<chainid>/deployedContracts.json not found");
        return vm.readFile(path);
    }
}
