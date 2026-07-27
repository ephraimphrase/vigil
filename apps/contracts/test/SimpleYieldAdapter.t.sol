// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SimpleYieldAdapter} from "../src/adapter/simpleyield/SimpleYieldAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract SimpleYieldAdapterTest is Test {
    SimpleYieldAdapter adapter;
    MockERC20 underlying;

    address vault = makeAddr("vault");
    bytes32 constant PROTOCOL = keccak256("SIMPLE_YIELD");

    function setUp() public {
        underlying = new MockERC20("Wrapped Ether", "WETH");
        adapter = new SimpleYieldAdapter(vault, IERC20(address(underlying)), PROTOCOL);
    }

    function _fundReserve(uint256 amount) internal {
        underlying.mint(address(this), amount);
        underlying.approve(address(adapter), amount);
        adapter.fund(amount);
    }

    function _deposit(uint256 amount) internal {
        underlying.mint(address(adapter), amount);
        vm.prank(vault);
        adapter.deposit(amount);
    }

    // ─── CONSTRUCTOR ───

    function test_ConstructorRevertsOnZeroVault() public {
        vm.expectRevert(SimpleYieldAdapter.ZeroAddress.selector);
        new SimpleYieldAdapter(address(0), IERC20(address(underlying)), PROTOCOL);
    }

    function test_ConstructorRevertsOnZeroUnderlying() public {
        vm.expectRevert(SimpleYieldAdapter.ZeroAddress.selector);
        new SimpleYieldAdapter(vault, IERC20(address(0)), PROTOCOL);
    }

    // ─── MONEY ACTUALLY GROWS ───

    function test_TotalAssetsGrowsOverTimeWhenReserveCanCoverIt() public {
        _fundReserve(500e18);
        _deposit(1_000e18);
        assertEq(adapter.totalAssets(), 1_000e18);

        vm.warp(block.timestamp + 365 days);

        // 5% APR for a year: ~1050, backed by the 500 reserve.
        assertApproxEqAbs(adapter.totalAssets(), 1_050e18, 1e15);
    }

    function test_WithdrawAllPaysOutMoreThanDeposited() public {
        _fundReserve(500e18);
        _deposit(1_000e18);
        vm.warp(block.timestamp + 365 days);

        vm.prank(vault);
        uint256 withdrawn = adapter.withdrawAll();

        assertApproxEqAbs(withdrawn, 1_050e18, 1e15);
        assertEq(underlying.balanceOf(vault), withdrawn);
        assertGt(withdrawn, 1_000e18);
    }

    function test_DepositAfterFundingDoesNotInflatePrincipalByReserve() public {
        // Regression check: depositing after the reserve is funded must
        // not fold that reserve into what's "owed" - only the 1000
        // actually deposited should count as principal.
        _fundReserve(500e18);
        _deposit(1_000e18);

        assertEq(adapter.principal(), 1_000e18);
        assertEq(adapter.totalAssets(), 1_000e18);
    }

    function test_TotalAssetsCapsAtHeldBalanceWhenReserveInsufficient() public {
        // No reserve funded - growth is owed but the contract can't
        // actually pay out more than it holds.
        _deposit(1_000e18);
        vm.warp(block.timestamp + 365 days);

        assertEq(adapter.totalAssets(), 1_000e18);
    }

    function test_WithdrawAllReturnsOnlyWhatReserveCanCover() public {
        _deposit(1_000e18);
        vm.warp(block.timestamp + 365 days);

        vm.prank(vault);
        uint256 withdrawn = adapter.withdrawAll();

        assertEq(withdrawn, 1_000e18);
    }

    // ─── ACCESS CONTROL ───

    function test_DepositRevertsForNonVault() public {
        underlying.mint(address(adapter), 1_000e18);
        vm.expectRevert(SimpleYieldAdapter.OnlyVault.selector);
        adapter.deposit(1_000e18);
    }

    function test_WithdrawRevertsForNonVault() public {
        _deposit(1_000e18);
        vm.expectRevert(SimpleYieldAdapter.OnlyVault.selector);
        adapter.withdraw(100e18);
    }

    // ─── RESCUE ───

    function test_RescueRevertsOnCoreUnderlying() public {
        vm.prank(vault);
        vm.expectRevert(SimpleYieldAdapter.CannotRescueCoreAsset.selector);
        adapter.rescue(underlying);
    }

    function test_RescueSweepsStrayToken() public {
        MockERC20 stray = new MockERC20("Stray", "STR");
        stray.mint(address(adapter), 42e18);

        vm.prank(vault);
        adapter.rescue(stray);

        assertEq(stray.balanceOf(vault), 42e18);
    }
}
