// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {HealthOracle} from "../../src/oracle/HealthOracle.sol";
import {VaultFactory} from "../../src/vault/VaultFactory.sol";
import {VigilVault} from "../../src/vault/VigilVault.sol";
import {IVigilVault} from "../../src/interface/IVigilVault.sol";
import {IVigilProtocolAdapter} from "../../src/interface/IVigilProtocolAdapter.sol";
import {MockStrategyAdapter} from "../../src/adapter/MockStrategyAdapter.sol";
import {StrategySeedReader} from "../lib/StrategySeedReader.sol";
import {VaultResolvers} from "../lib/VaultResolvers.sol";

interface IWETH9 {
    function deposit() external payable;
}

// Deploys one vault per address in TOKEN_ADDRESSES (each an already-real,
// already-existing token - this script never deploys a token itself),
// each wired with STRATEGIES_PER_VAULT (default 5) MockStrategyAdapters
// pulled from apps/web/seed/strategies.json. VaultFactory only allows one
// vault per asset, so TOKEN_ADDRESSES must list distinct tokens - sourcing
// those is out of scope here.
//
// Requires HealthOracle already deployed (VaultResolvers._resolveOracle()
// has no fallback deploy path for it, unlike the factory) - run
// DeployHealthOracle.s.sol and register protocols first via
// RegisterProtocolsFromSeed.s.sol, since addAdapter()'s weighting depends
// on real oracle scores.
//
// Each vault and its adapters are registered in
// data/<chainid>/deployedContracts.json under keys like
// "Vault_WETH-1"/"Aave_WETH-1_aave" - the label is the vault's own token
// symbol plus its index in TOKEN_ADDRESSES (matching how the frontend
// labels vaults, e.g. "WETH-1"), and adapter keys use the strategy's real
// stratName rather than a generic label - so everything is individually
// inspectable afterward.
//
// WRAP_NATIVE (default true) controls how each reserve gets funded: when
// true, RESERVE_PER_ADAPTER of native currency is wrapped via the token's
// own deposit() - only correct if that token is WETH-like. Set false for
// any other token; the broadcaster must already hold
// RESERVE_PER_ADAPTER * (adapters deployed) of it instead.
//
// Usage:
//   TOKEN_ADDRESSES=0xAAA...,0xBBB...,0xCCC... STRATEGIES_PER_VAULT=5 \
//   forge script script/deploy/DeployManyMockVaults.s.sol \
//     --rpc-url $RPC_URL --broadcast --slow --private-key <ORACLE_ADMIN private key>
// Must broadcast as the ORACLE_ADMIN key - addAdapter() is admin-gated.
contract DeployManyMockVaultsScript is VaultResolvers, StrategySeedReader {
    uint256 constant RESERVE_PER_ADAPTER = 0.001 ether;

    // Bundles the config shared across every vault in the loop - keeps
    // _deployOneVault's own parameter count small enough to avoid
    // "stack too deep" (a struct is one stack slot, not six).
    struct Config {
        address oracle;
        address factory;
        address admin;
        address keeper;
        address guardian;
        uint256 strategyLength;
    }

    // Bundles what every per-strategy call needs about the vault it's
    // deploying into - same "struct instead of N params" fix as Config,
    // applied one level deeper where stack pressure was still too high.
    struct VaultCtx {
        VigilVault vault;
        address token;
        address admin;
        string vLabel;
    }

    function run() external {
        address[] memory tokenAddresses = vm.envAddress("TOKEN_ADDRESSES", ",");
        require(tokenAddresses.length > 0, "TOKEN_ADDRESSES is empty");
        uint256 stratsPerVault = vm.envOr("STRATEGIES_PER_VAULT", uint256(5));
        address admin = vm.envOr("ORACLE_ADMIN", 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
        address oracle = _resolveOracle();
        uint256 strategyLength = _seedLength();
        require(stratsPerVault <= strategyLength, "STRATEGIES_PER_VAULT exceeds strategies.json length");

        console.log("Deploying", tokenAddresses.length, "vaults");
        console.log("Strategies per vault:", stratsPerVault);

        // _resolveFactory() may deploy a fresh VaultFactory (new VaultFactory())
        // when none exists yet - that call MUST happen after
        // startBroadcast(), or the deployment only ever occurs in
        // simulation and is never actually sent as a real transaction,
        // even though the script reports success and _registerContract
        // still writes the (never-broadcast) address to deployedContracts.json.
        vm.startBroadcast();
        Config memory cfg = Config({
            oracle: oracle,
            factory: _resolveFactory(),
            admin: admin,
            keeper: vm.envOr("VAULT_KEEPER", admin),
            guardian: vm.envOr("ORACLE_GUARDIAN", admin),
            strategyLength: strategyLength
        });
        for (uint256 v; v < tokenAddresses.length; ++v) {
            _deployOneVault(v, tokenAddresses[v], cfg, stratsPerVault);
        }
        vm.stopBroadcast();
    }

    function _deployOneVault(uint256 v, address token, Config memory cfg, uint256 stratsPerVault) internal {
        string memory vLabel = string.concat(IERC20Metadata(token).symbol(), "-", vm.toString(v));
        VigilVault vault = _createVault(vLabel, token, cfg);
        VaultCtx memory ctx = VaultCtx({vault: vault, token: token, admin: cfg.admin, vLabel: vLabel});

        uint256 n = stratsPerVault < vault.MAX_ADAPTERS() ? stratsPerVault : vault.MAX_ADAPTERS();
        _deployStrategiesForVault(ctx, (v * n) % cfg.strategyLength, n, cfg.strategyLength);

        console.log(string.concat("  vault ", vLabel, ":"), address(vault));
        console.log("    token:", token);
    }

    // Split out from _deployOneVault to keep that function's own stack
    // frame small ("stack too deep" otherwise with this many locals in one
    // function).
    function _createVault(string memory vLabel, address token, Config memory cfg) internal returns (VigilVault vault) {
        string memory name = IERC20Metadata(token).name();
        string memory symbol = IERC20Metadata(token).symbol();

        vault = VaultFactory(cfg.factory)
            .createVault(
                IERC20(token),
                IVigilVault.VaultKind.Single,
                HealthOracle(cfg.oracle),
                cfg.admin,
                cfg.keeper,
                cfg.guardian,
                name,
                symbol
            );
        _registerContract(string.concat("Vault_", vLabel), address(vault));
    }

    // Scans forward from startIndex picking distinct protocolIds only -
    // VigilVault.addAdapter() reverts on a duplicate protocolId within the
    // same vault, and a naive contiguous window can easily contain two
    // entries for the same protocol (e.g. curve has 8 variants back to
    // back in the seed file). Bounded by strategyLength so it can never
    // loop forever even if n can't actually be satisfied. Split out from
    // _deployOneVault to keep that function's own stack frame small
    // ("stack too deep" otherwise with this many locals in one function).
    function _deployStrategiesForVault(VaultCtx memory ctx, uint256 startIndex, uint256 n, uint256 strategyLength)
        internal
    {
        bytes32[] memory picked = new bytes32[](n);
        uint256 pickedCount;
        for (uint256 offset; offset < strategyLength && pickedCount < n; ++offset) {
            uint256 index = (startIndex + offset) % strategyLength;
            pickedCount = _maybeDeployStrategy(ctx, index, picked, pickedCount);
        }
    }

    // Isolated into its own function (rather than inlined in the loop
    // above) so the strategy-data locals (id/protocolIdStr/stratName/
    // apyBps/protocolId) live in their own stack frame, not stacked on top
    // of the loop's own locals - the combination was "stack too deep"
    // otherwise.
    function _maybeDeployStrategy(VaultCtx memory ctx, uint256 index, bytes32[] memory picked, uint256 pickedCount)
        internal
        returns (uint256)
    {
        (string memory id, string memory protocolIdStr, string memory stratName, uint256 apyBps) = _strategyAt(index);
        bytes32 protocolId = bytes32(bytes(protocolIdStr));

        if (_contains(picked, pickedCount, protocolId)) return pickedCount;

        picked[pickedCount] = protocolId;
        _deployOneStrategy(ctx, protocolId, id, stratName, apyBps);
        return pickedCount + 1;
    }

    function _contains(bytes32[] memory arr, uint256 len, bytes32 needle) internal pure returns (bool) {
        for (uint256 j; j < len; ++j) {
            if (arr[j] == needle) return true;
        }
        return false;
    }

    // Registers each adapter under its real stratName (e.g. "Aave",
    // "BalancerGryo") rather than a generic "MockStrategyAdapter" label -
    // the id is still appended since a few stratNames repeat across
    // different strategies (both Penpie strategies share stratName
    // "Penpie", for example).
    //
    // Funds the reserve via the same WRAP_NATIVE pattern as
    // DeployMockStrategyAdapters.s.sol, since the token is now real/
    // external and not necessarily mintable by this script.
    function _deployOneStrategy(
        VaultCtx memory ctx,
        bytes32 protocolId,
        string memory id,
        string memory stratName,
        uint256 apyBps
    ) internal {
        MockStrategyAdapter adapter = new MockStrategyAdapter(
            address(ctx.vault), ctx.token, protocolId, apyBps, stratName
        );
        _registerContract(string.concat(stratName, "_", ctx.vLabel, "_", id), address(adapter));

        if (vm.envOr("WRAP_NATIVE", true)) {
            IWETH9(ctx.token).deposit{value: RESERVE_PER_ADAPTER}();
        }
        IERC20(ctx.token).approve(address(adapter), RESERVE_PER_ADAPTER);
        adapter.fundReserve(RESERVE_PER_ADAPTER);

        ctx.vault.addAdapter(IVigilProtocolAdapter(address(adapter)));
    }
}
