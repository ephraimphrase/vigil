// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {VigilVault} from "../src/vault/VigilVault.sol";
import {HealthOracle} from "../src/oracle/HealthOracle.sol";
import {IVigilProtocolAdapter} from "../src/interface/IVigilProtocolAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockAdapter} from "./mocks/MockAdapter.sol";

contract VigilVaultTest is Test {
    VigilVault vault;
    HealthOracle oracle;
    MockERC20 weth;

    MockAdapter adapterA;
    MockAdapter adapterB;
    bytes32 constant PROTOCOL_A = keccak256("PROTOCOL_A");
    bytes32 constant PROTOCOL_B = keccak256("PROTOCOL_B");

    address admin = makeAddr("admin");
    address keeper = makeAddr("keeper");
    address guardian = makeAddr("guardian");
    address scorer = makeAddr("scorer");
    address depositor = makeAddr("depositor");
    address stranger = makeAddr("stranger");

    function setUp() public {
        weth = new MockERC20("Wrapped Ether", "WETH");
        oracle = new HealthOracle(admin, scorer, guardian, 6 hours);
        vault = new VigilVault(
            IERC20(address(weth)), VigilVault.VaultKind.Single, oracle, admin, keeper, guardian, "Vigil WETH", "vgWETH"
        );

        // Adapters are immutable-bound to the vault address, so they can
        // only be constructed after the vault exists.
        adapterA = new MockAdapter(address(vault), IERC20(address(weth)), PROTOCOL_A);
        adapterB = new MockAdapter(address(vault), IERC20(address(weth)), PROTOCOL_B);

        vm.startPrank(admin);
        vault.addAdapter(IVigilProtocolAdapter(address(adapterA)));
        vault.addAdapter(IVigilProtocolAdapter(address(adapterB)));
        oracle.registerProtocol(PROTOCOL_A, 50);
        oracle.registerProtocol(PROTOCOL_B, 50);
        vm.stopPrank();
    }

    function _deposit(address who, uint256 amount) internal returns (uint256 shares) {
        weth.mint(who, amount);
        vm.startPrank(who);
        weth.approve(address(vault), amount);
        shares = vault.deposit(amount, who);
        vm.stopPrank();
    }

    // ─── CONSTRUCTOR ───

    function test_ConstructorRevertsOnZeroOracle() public {
        vm.expectRevert(VigilVault.ZeroAddress.selector);
        new VigilVault(
            IERC20(address(weth)),
            VigilVault.VaultKind.Single,
            HealthOracle(address(0)),
            admin,
            keeper,
            guardian,
            "n",
            "s"
        );
    }

    function test_ConstructorRevertsOnZeroAdmin() public {
        vm.expectRevert(VigilVault.ZeroAddress.selector);
        new VigilVault(
            IERC20(address(weth)), VigilVault.VaultKind.Single, oracle, address(0), keeper, guardian, "n", "s"
        );
    }

    function test_ConstructorSetsKind() public view {
        assertEq(uint256(vault.kind()), uint256(VigilVault.VaultKind.Single));
    }

    function test_ConstructorGrantsRoles() public view {
        assertTrue(vault.hasRole(vault.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(vault.hasRole(vault.KEEPER_ROLE(), keeper));
        assertTrue(vault.hasRole(vault.GUARDIAN_ROLE(), guardian));
    }

    // ─── ADAPTER MANAGEMENT ───

    function test_AddAdapterRevertsForNonAdmin() public {
        MockAdapter fresh = new MockAdapter(address(vault), IERC20(address(weth)), keccak256("FRESH"));
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, vault.DEFAULT_ADMIN_ROLE()
            )
        );
        vm.prank(stranger);
        vault.addAdapter(IVigilProtocolAdapter(address(fresh)));
    }

    function test_AddAdapterRevertsOnAssetMismatch() public {
        MockERC20 otherAsset = new MockERC20("Other", "OTH");
        MockAdapter mismatched = new MockAdapter(address(vault), IERC20(address(otherAsset)), keccak256("OTHER"));
        vm.prank(admin);
        vm.expectRevert(VigilVault.AssetMismatch.selector);
        vault.addAdapter(IVigilProtocolAdapter(address(mismatched)));
    }

    function test_AddAdapterRevertsOnDuplicate() public {
        vm.prank(admin);
        vm.expectRevert(VigilVault.AdapterAlreadyAdded.selector);
        vault.addAdapter(IVigilProtocolAdapter(address(adapterA)));
    }

    function test_AddAdapterRevertsAboveMax() public {
        vm.startPrank(admin);
        for (uint256 i = 0; i < vault.MAX_ADAPTERS() - 2; i++) {
            MockAdapter a = new MockAdapter(address(vault), IERC20(address(weth)), keccak256(abi.encode(i)));
            vault.addAdapter(IVigilProtocolAdapter(address(a)));
        }
        assertEq(vault.adapterCount(), vault.MAX_ADAPTERS());

        MockAdapter overflow = new MockAdapter(address(vault), IERC20(address(weth)), keccak256("overflow"));
        vm.expectRevert(VigilVault.TooManyAdapters.selector);
        vault.addAdapter(IVigilProtocolAdapter(address(overflow)));
        vm.stopPrank();
    }

    function test_RemoveAdapterWithdrawsRemainingBalanceAndDropsFromArray() public {
        _deposit(depositor, 1_000e18);
        vm.prank(keeper);
        vault.rebalance();
        assertGt(adapterA.totalAssets(), 0);

        vm.prank(admin);
        vault.removeAdapter(IVigilProtocolAdapter(address(adapterA)));

        assertEq(adapterA.totalAssets(), 0);
        assertFalse(vault.isAdapter(address(adapterA)));
        assertEq(vault.adapterCount(), 1);
        assertEq(address(vault.adapters(0)), address(adapterB));
        // Funds pulled from A land as idle balance, still backing shares.
        assertEq(vault.totalAssets(), 1_000e18);
    }

    function test_RemoveAdapterRevertsForNonAdapter() public {
        vm.prank(admin);
        vm.expectRevert(VigilVault.NotAnAdapter.selector);
        vault.removeAdapter(IVigilProtocolAdapter(address(0xdead)));
    }

    // ─── REBALANCE / ALLOCATION ───

    function test_RebalanceSplitsProportionallyToHealthScore() public {
        vm.warp(block.timestamp + oracle.MIN_INTERVAL() + 1);
        vm.prank(scorer);
        oracle.setScore(PROTOCOL_A, 80); // A:80, B:50 (unmoved) -> 80/130, 50/130

        _deposit(depositor, 1_300e18);

        vm.prank(keeper);
        vault.rebalance();

        assertEq(adapterA.totalAssets(), 800e18);
        assertEq(adapterB.totalAssets(), 500e18);
        assertEq(weth.balanceOf(address(vault)), 0);
    }

    function test_RebalanceTreatsStaleScoreAsZeroWeight() public {
        _deposit(depositor, 1_000e18);
        vm.prank(keeper);
        vault.rebalance();
        assertEq(adapterA.totalAssets(), 500e18);
        assertEq(adapterB.totalAssets(), 500e18);

        vm.warp(block.timestamp + 6 hours + 1);
        // A's score is now stale (never re-written), B is freshly written
        // and so still counts.
        vm.prank(scorer);
        oracle.setScore(PROTOCOL_B, 60);

        vm.prank(keeper);
        vault.rebalance();

        assertEq(adapterA.totalAssets(), 0);
        assertEq(adapterB.totalAssets(), 1_000e18);
    }

    function test_RebalancePullsEverythingToIdleWhenAllScoresStale() public {
        _deposit(depositor, 1_000e18);
        vm.prank(keeper);
        vault.rebalance();

        vm.warp(block.timestamp + 6 hours + 1);
        vm.prank(keeper);
        vault.rebalance();

        assertEq(adapterA.totalAssets(), 0);
        assertEq(adapterB.totalAssets(), 0);
        assertEq(weth.balanceOf(address(vault)), 1_000e18);
    }

    function test_RebalanceRevertsForNonKeeper() public {
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, vault.KEEPER_ROLE())
        );
        vm.prank(stranger);
        vault.rebalance();
    }

    function test_RebalanceConvergesFurtherWhenProtocolIlliquid() public {
        vm.warp(block.timestamp + oracle.MIN_INTERVAL() + 1);
        vm.prank(scorer);
        oracle.setScore(PROTOCOL_A, 80);
        _deposit(depositor, 1_300e18);

        vm.prank(keeper);
        vault.rebalance();
        assertEq(adapterA.totalAssets(), 800e18);

        // Guardian zeroes A after some incident; A can only return half its
        // position right now.
        adapterA.setLiquidityCap(400e18);
        vm.prank(guardian);
        oracle.emergencyZero(PROTOCOL_A);

        vm.prank(keeper);
        vault.rebalance();

        // Only 400 could be pulled out of A even though its target dropped
        // to 0, so only that much could be forwarded on to B (500 + 400).
        assertEq(adapterA.totalAssets(), 400e18);
        assertEq(adapterB.totalAssets(), 900e18);

        // Liquidity frees up; a second rebalance finishes the job.
        adapterA.setLiquidityCap(type(uint256).max);
        vm.prank(keeper);
        vault.rebalance();
        assertEq(adapterA.totalAssets(), 0);
    }

    // ─── EMERGENCY ───

    function test_EmergencyEvacuatePullsFundsOut() public {
        _deposit(depositor, 1_000e18);
        vm.prank(keeper);
        vault.rebalance();
        assertEq(adapterA.totalAssets(), 500e18);

        vm.prank(guardian);
        uint256 withdrawn = vault.emergencyEvacuate(IVigilProtocolAdapter(address(adapterA)));

        assertEq(withdrawn, 500e18);
        assertEq(adapterA.totalAssets(), 0);
        assertEq(weth.balanceOf(address(vault)), 500e18);
    }

    function test_EmergencyEvacuateRevertsForNonGuardian() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, vault.GUARDIAN_ROLE()
            )
        );
        vm.prank(stranger);
        vault.emergencyEvacuate(IVigilProtocolAdapter(address(adapterA)));
    }

    // ─── ERC4626 TOTALASSETS / WITHDRAW ───

    function test_TotalAssetsSumsIdleAndAdapterPositions() public {
        _deposit(depositor, 1_000e18);
        assertEq(vault.totalAssets(), 1_000e18);

        vm.prank(keeper);
        vault.rebalance();
        assertEq(vault.totalAssets(), 1_000e18);
    }

    function test_WithdrawPullsLiquidityFromAdaptersWhenIdleInsufficient() public {
        _deposit(depositor, 1_000e18);
        vm.prank(keeper);
        vault.rebalance();
        assertEq(weth.balanceOf(address(vault)), 0);

        vm.prank(depositor);
        vault.withdraw(700e18, depositor, depositor);

        assertEq(weth.balanceOf(depositor), 700e18);
        assertEq(vault.totalAssets(), 300e18);
    }

    function test_WithdrawRevertsWhenAdaptersCannotCoverShortfall() public {
        _deposit(depositor, 1_000e18);
        vm.prank(keeper);
        vault.rebalance();

        adapterA.setLiquidityCap(0);
        adapterB.setLiquidityCap(0);

        vm.prank(depositor);
        vm.expectRevert();
        vault.withdraw(1_000e18, depositor, depositor);
    }
}
