// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockStrategyAdapter} from "../../src/adapter/MockStrategyAdapter.sol";
import {VigilVault} from "../../src/vault/VigilVault.sol";
import {IVigilProtocolAdapter} from "../../src/interface/IVigilProtocolAdapter.sol";
import {DeployRegistrar} from "../lib/DeployRegistrar.sol";

interface IWETH9 {
    function deposit() external payable;
}

// Deploys one MockStrategyAdapter per STRATEGY in
// apps/web/seed/strategies.json - the real per-strategy list (42 entries,
// one per src/beefy_strategies/**/Strategy*.sol file, each with its actual
// stratName() and a curated APY). MockStrategyAdapter implements
// IVigilProtocolAdapter directly - no BeefyStrategyAdapter wrapping;
// that's reserved for real Common/ strategies, not mocks. Only for
// protocols with no real Base Sepolia deployment (see
// data/84532/protocolAddressBook.json); real ones (Aave, Morpho) get a
// real adapter wired to the real protocol instead of this.
//
// `underlying` is WETH for every mock adapter regardless of the seed's
// `want` field (real LP tokens/staked shares don't exist on testnet) -
// VigilVault itself is WETH-denominated. stratName/apy/protocolId come
// from the real seed data.
//
// Multiple strategies share a protocolId (curve has 8 variants, pendle 4,
// gmx 4, balancer/silo/morpho/stargate/velodrome 2-3 each) - but
// VigilVault.addAdapter() rejects a second adapter for a protocolId
// already whitelisted (DuplicateProtocol), and MAX_ADAPTERS caps the vault
// at 8 total regardless. So: every strategy gets deployed for real
// (individually verifiable), but only the FIRST strategy encountered per
// unique protocolId gets wired into the live vault, up to MAX_ADAPTERS.
//
// Usage (full batch, all 42 from the seed file):
//   forge script script/deploy/DeployMockStrategyAdapters.s.sol \
//     --rpc-url $RPC_URL --broadcast --private-key <ORACLE_ADMIN private key>
//
// Usage (single custom strategy, bypassing the seed file entirely):
//   STRAT_NAME="My Strategy" PROTOCOL_ID=myprotocol APY_BPS=650 \
//     forge script script/deploy/DeployMockStrategyAdapters.s.sol \
//     --rpc-url $RPC_URL --broadcast --private-key <ORACLE_ADMIN private key>
//   (APY_BPS is basis points - 650 = 6.50%. If VigilVault already has
//   MAX_ADAPTERS adapters or this protocolId is already whitelisted, the
//   adapter still deploys but addAdapter() is skipped, same as the batch
//   path.)
//
// Optional VAULT_ADDRESS overrides which VigilVault this targets (defaults
// to .VigilVault in data/<chainid>/deployedContracts.json) - the adapter's
// token is always read from that vault's own asset(), never assumed to be
// WETH, so this works against any vault regardless of its underlying token.
//
// WRAP_NATIVE (default true) controls how each reserve gets funded: when
// true, RESERVE_PER_ADAPTER of native currency is wrapped via the token's
// own deposit() - only correct if the vault's token is actually WETH-like.
// Set WRAP_NATIVE=false for any other token; the broadcaster must then
// already hold RESERVE_PER_ADAPTER * (number of strategies) of that token,
// pulled via a plain approve + fundReserve instead.
//
// Must broadcast as the VigilVault admin - addAdapter() is admin-gated.
contract DeployMockStrategyAdaptersScript is Script, DeployRegistrar {
    string constant SEED_PATH = "../web/seed/strategies.json";
    uint256 constant RESERVE_PER_ADAPTER = 0.001 ether;

    bytes32[] private _wiredProtocolIds;

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
        _registerContract(string.concat("MockStrategyAdapter_", id), address(adapter));

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

    // Pulls id/protocolId/stratName/apyBps for strategies[index] in one jq
    // call - apy in the seed is a decimal (e.g. 4.8), which Solidity can't
    // parse directly as JSON, so the *100-and-round happens in jq rather
    // than trying to parse a float on-chain.
    function _strategyAt(uint256 index)
        internal
        returns (string memory id, string memory protocolId, string memory stratName, uint256 apyBps)
    {
        string[] memory cmd = new string[](3);
        cmd[0] = "bash";
        cmd[1] = "-c";
        cmd[2] = string.concat(
            "jq -j '.strategies[",
            vm.toString(index),
            '] | .id + "|" + .protocolId + "|" + .stratName + "|" + ((.apy*100)|round|tostring)\' ',
            SEED_PATH
        );
        bytes memory result = vm.ffi(cmd);
        string[] memory parts = vm.split(string(result), "|");
        return (parts[0], parts[1], parts[2], vm.parseUint(parts[3]));
    }

    function _seedLength() internal returns (uint256) {
        string[] memory cmd = new string[](3);
        cmd[0] = "bash";
        cmd[1] = "-c";
        cmd[2] = string.concat("jq -j '\"n=\" + (.strategies | length | tostring)' ", SEED_PATH);
        bytes memory result = vm.ffi(cmd);
        string[] memory parts = vm.split(string(result), "=");
        return vm.parseUint(parts[1]);
    }

    // VAULT_ADDRESS lets this target any deployed VigilVault, not just
    // whichever one happens to be registered as ".VigilVault" - useful
    // once there's more than one vault (different vaults don't have to
    // share the same underlying token).
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
