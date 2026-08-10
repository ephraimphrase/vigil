// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BeefyStrategyAdapter} from "../src/adapter/BeefyStrategyAdapter.sol";
import {IVigilProtocolAdapter} from "../src/interface/IVigilProtocolAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockBeefyStrategy} from "./mocks/MockBeefyStrategy.sol";

contract BeefyStrategyAdapterTest is Test {
    BeefyStrategyAdapter adapter;
    MockBeefyStrategy strategy;
    MockERC20 want;

    address vault = makeAddr("vault");
    bytes32 constant PROTOCOL = keccak256("PROTOCOL");

    function setUp() public {
        want = new MockERC20("Want", "WANT");
        strategy = new MockBeefyStrategy();
        // Deploy order mirrors the doc comment on BeefyStrategyAdapter:
        // strategy deployed uninitialized -> adapter deployed -> strategy
        // "initialized" -> link().
        adapter = new BeefyStrategyAdapter(vault, address(strategy), PROTOCOL);
    }

    function _linkAfterInit() internal {
        strategy.initialize(want);
        adapter.link();
    }

    // ─── LINK ───

    function test_ConstructorLeavesUnderlyingUnset() public view {
        assertEq(address(adapter.underlying()), address(0));
    }

    function test_LinkRevertsBeforeStrategyInitialized() public {
        vm.expectRevert(BeefyStrategyAdapter.NotYetInitialized.selector);
        adapter.link();
    }

    function test_LinkSetsUnderlyingAfterStrategyInitialized() public {
        strategy.initialize(want);
        adapter.link();
        assertEq(address(adapter.underlying()), address(want));
        assertEq(adapter.asset(), address(want));
    }

    function test_LinkRevertsIfAlreadyLinked() public {
        _linkAfterInit();
        vm.expectRevert(BeefyStrategyAdapter.AlreadyLinked.selector);
        adapter.link();
    }

    // ─── DEPOSIT / WITHDRAW GATED ON LINK ───

    function test_DepositRevertsBeforeLinked() public {
        vm.prank(vault);
        vm.expectRevert(BeefyStrategyAdapter.NotLinked.selector);
        adapter.deposit(100e18, 0);
    }

    function test_WithdrawRevertsBeforeLinked() public {
        vm.prank(vault);
        vm.expectRevert(BeefyStrategyAdapter.NotLinked.selector);
        adapter.withdraw(1, 0);
    }

    function test_DepositWorksAfterLink() public {
        _linkAfterInit();

        // deposit() transfers `amount` of `underlying` OUT of the adapter
        // itself into the strategy - matching VigilVault.rebalance(), which
        // sends the adapter its share BEFORE calling deposit(). `supplied`
        // measures only what _strategy.deposit() itself adds on top of that
        // transfer (e.g. a real pool converting want into a differently-
        // valued position) - for this trivial 1:1 mock with no external
        // pool, that delta is legitimately 0.
        want.mint(address(adapter), 100e18);

        vm.prank(vault);
        uint256 supplied = adapter.deposit(100e18, 0);

        assertEq(supplied, 0);
        assertEq(adapter.totalAssets(), 100e18);
        assertEq(want.balanceOf(address(strategy)), 100e18);
    }

    // ─── DUPLICATE-PROTOCOL / MISC guards live on VigilVault, not here ───

    // ─── WITHDRAWALL / RETIRE DEDUP ───

    function test_WithdrawAllReturnsFundsWithoutRetiring() public {
        _linkAfterInit();
        want.mint(address(strategy), 500e18);

        vm.prank(vault);
        uint256 withdrawn = adapter.withdrawAll(0);

        assertEq(withdrawn, 500e18);
        assertEq(want.balanceOf(vault), 500e18);
        assertFalse(adapter.retired());
        assertEq(strategy.retireStratCalls(), 1);
    }

    function test_RetireReturnsFundsAndMarksRetired() public {
        _linkAfterInit();
        want.mint(address(strategy), 500e18);

        vm.prank(vault);
        uint256 withdrawn = adapter.retire(0);

        assertEq(withdrawn, 500e18);
        assertEq(want.balanceOf(vault), 500e18);
        assertTrue(adapter.retired());
    }

    function test_RetireRevertsIfAlreadyRetired() public {
        _linkAfterInit();
        vm.prank(vault);
        adapter.retire(0);

        vm.prank(vault);
        vm.expectRevert(IVigilProtocolAdapter.AdapterRetired.selector);
        adapter.retire(0);
    }

    // ─── HARVEST UNDERFLOW GUARD ───

    function test_HarvestClampsToZeroOnLoss() public {
        _linkAfterInit();
        want.mint(address(strategy), 100e18);
        // Loss materializes mid-harvest() (fees/slippage taken before
        // rewards land) - without the clamp, afterBal - before underflows
        // and reverts with an opaque panic instead of gain == 0.
        strategy.setLossOnHarvest(10e18);

        uint256 gain = adapter.harvest(0);
        assertEq(gain, 0);
    }

    function test_HarvestRevertsBelowMinGainOnLoss() public {
        _linkAfterInit();
        want.mint(address(strategy), 100e18);
        strategy.setLossOnHarvest(10e18);

        vm.expectRevert(abi.encodeWithSelector(IVigilProtocolAdapter.InsufficientOutput.selector, 0, 1));
        adapter.harvest(1);
    }

    function test_HarvestReportsGain() public {
        _linkAfterInit();
        // Materialized inside _strategy.harvest() itself, not pre-funded -
        // the adapter's "before" snapshot is taken after any prior transfer
        // has already landed, so only a mid-call gain is observable.
        strategy.setGainOnHarvest(50e18);

        uint256 gain = adapter.harvest(0);
        assertEq(gain, 50e18);
    }
}
