// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockStrategyAdapter} from "../src/adapter/MockStrategyAdapter.sol";
import {IVigilProtocolAdapter} from "../src/interface/IVigilProtocolAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MockStrategyAdapterTest is Test {
    MockStrategyAdapter adapter;
    MockERC20 weth;

    address vault = makeAddr("vault");
    bytes32 constant PROTOCOL = keccak256("aave");
    uint256 constant APY_BPS = 480; // 4.8%, matches strategies.json's aave entry

    function setUp() public {
        weth = new MockERC20("Wrapped Ether", "WETH");
        adapter = new MockStrategyAdapter(vault, address(weth), PROTOCOL, APY_BPS, "Aave");
    }

    function test_IdentityMatchesSeedData() public view {
        assertEq(adapter.protocolId(), PROTOCOL);
        assertEq(adapter.stratName(), "Aave");
        assertEq(adapter.apyBps(), APY_BPS);
        assertEq(adapter.asset(), address(weth));
    }

    function test_DepositRequiresPriorTransferMatchingRebalancePattern() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        uint256 supplied = adapter.deposit(100e18, 0);

        assertEq(supplied, 100e18);
        assertEq(adapter.totalAssets(), 100e18);
    }

    function test_AccruesRoughlyExpectedYieldOverOneYear() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        adapter.deposit(100e18, 0);

        weth.mint(address(this), 10e18);
        weth.approve(address(adapter), 10e18);
        adapter.fundReserve(10e18);

        vm.warp(block.timestamp + 365 days);

        // 100e18 * 4.8% = 4.8e18 expected accrued yield.
        assertApproxEqAbs(adapter.totalAssets(), 104.8e18, 1e12);
    }

    function test_YieldCappedByRealReserveEvenIfTheoreticalIsHigher() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        adapter.deposit(100e18, 0);
        // No reserve funded.

        vm.warp(block.timestamp + 365 days);

        assertEq(adapter.totalAssets(), 100e18);
    }

    function test_WithdrawAllReturnsRealTokensNeverMoreThanHeld() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        adapter.deposit(100e18, 0);

        weth.mint(address(this), 10e18);
        weth.approve(address(adapter), 10e18);
        adapter.fundReserve(10e18);

        vm.warp(block.timestamp + 365 days);

        vm.prank(vault);
        uint256 withdrawn = adapter.withdrawAll(0);

        assertApproxEqAbs(withdrawn, 104.8e18, 1e12);
        assertEq(weth.balanceOf(vault), withdrawn);
        assertEq(adapter.totalAssets(), 0);
    }

    function test_FundReservePullsRealTokensFromCaller() public {
        weth.mint(address(this), 5e18);
        weth.approve(address(adapter), 5e18);
        adapter.fundReserve(5e18);

        assertEq(weth.balanceOf(address(adapter)), 5e18);
        assertEq(adapter.reserve(), 5e18);
    }

    // ─── WITHDRAW (PARTIAL) ───

    function test_PartialWithdrawReturnsExactAmountRequested() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        adapter.deposit(100e18, 0);

        vm.prank(vault);
        uint256 withdrawn = adapter.withdraw(40e18, 0);

        assertEq(withdrawn, 40e18);
        assertEq(weth.balanceOf(vault), 40e18);
        assertEq(adapter.totalAssets(), 60e18);
    }

    function test_PartialWithdrawCapsAtPrincipalIfAmountExceedsIt() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        adapter.deposit(100e18, 0);

        vm.prank(vault);
        uint256 withdrawn = adapter.withdraw(1_000e18, 0);

        assertEq(withdrawn, 100e18);
        assertEq(adapter.totalAssets(), 0);
    }

    function test_WithdrawRevertsBelowMinWithdrawn() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        adapter.deposit(100e18, 0);

        vm.prank(vault);
        vm.expectRevert(abi.encodeWithSelector(IVigilProtocolAdapter.InsufficientOutput.selector, 40e18, 50e18));
        adapter.withdraw(40e18, 50e18);
    }

    function test_WithdrawRevertsForNonVaultCaller() public {
        vm.expectRevert(IVigilProtocolAdapter.OnlyVault.selector);
        adapter.withdraw(1, 0);
    }

    function test_DepositRevertsForNonVaultCaller() public {
        weth.mint(address(adapter), 100e18);
        vm.expectRevert(IVigilProtocolAdapter.OnlyVault.selector);
        adapter.deposit(100e18, 0);
    }

    // ─── NEVER MINTS FRESH TOKENS ───

    // The adapter must never be able to conjure new underlying out of
    // nothing - every unit it ever reports or pays out has to come from an
    // explicit, real inflow (a deposit transfer or fundReserve()), never
    // from the adapter itself calling mint(). Confirmed here by watching
    // totalSupply() across deposit, a year of accrual, harvest, and a full
    // withdrawal - it only ever changes when *this test* mints, never as a
    // side effect of calling the adapter.
    function test_NeverMintsFreshTokensAcrossFullLifecycle() public {
        uint256 supplyBeforeAnyMock = weth.totalSupply();

        weth.mint(address(adapter), 100e18);
        uint256 supplyAfterUserMint = weth.totalSupply();
        assertEq(supplyAfterUserMint, supplyBeforeAnyMock + 100e18);

        vm.prank(vault);
        adapter.deposit(100e18, 0);
        assertEq(weth.totalSupply(), supplyAfterUserMint, "deposit() must not mint");

        weth.mint(address(this), 10e18);
        weth.approve(address(adapter), 10e18);
        adapter.fundReserve(10e18);
        uint256 supplyAfterReserveMint = weth.totalSupply();
        assertEq(supplyAfterReserveMint, supplyAfterUserMint + 10e18);

        vm.warp(block.timestamp + 365 days);
        assertEq(weth.totalSupply(), supplyAfterReserveMint, "yield accrual must not mint");

        adapter.harvest(0);
        assertEq(weth.totalSupply(), supplyAfterReserveMint, "harvest() must not mint");

        vm.prank(vault);
        adapter.withdrawAll(0);
        assertEq(weth.totalSupply(), supplyAfterReserveMint, "withdrawAll() must not mint");

        // Every withdrawn token is accounted for by mints this test made
        // directly - nothing extra appeared.
        assertEq(weth.balanceOf(vault), 104.8e18);
    }

    // ─── PAUSE / RETIRE ───

    function test_PausePreventsDepositButNotWithdraw() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        adapter.deposit(100e18, 0);

        vm.prank(vault);
        adapter.pause();

        weth.mint(address(adapter), 1e18);
        vm.prank(vault);
        vm.expectRevert(IVigilProtocolAdapter.DepositsClosed.selector);
        adapter.deposit(1e18, 0);

        vm.prank(vault);
        uint256 withdrawn = adapter.withdraw(50e18, 0);
        assertEq(withdrawn, 50e18);
    }

    function test_RetireMarksRetiredAndBlocksFurtherDeposits() public {
        weth.mint(address(adapter), 100e18);
        vm.prank(vault);
        adapter.deposit(100e18, 0);

        vm.prank(vault);
        adapter.retire(0);

        assertTrue(adapter.retired());
        assertEq(weth.balanceOf(vault), 100e18);

        weth.mint(address(adapter), 1e18);
        vm.prank(vault);
        vm.expectRevert(IVigilProtocolAdapter.AdapterRetired.selector);
        adapter.deposit(1e18, 0);
    }
}
