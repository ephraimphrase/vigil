// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {VigilZapRouter} from "../src/router/VigilZapRouter.sol";
import {ISwapRouter02} from "../src/interface/ISwapRouter02.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockPermitToken} from "./mocks/MockPermitToken.sol";
import {MockVault} from "./mocks/MockVault.sol";
import {MockSwapRouter} from "./mocks/MockSwapRouter.sol";

contract VigilZapRouterTest is Test {
    VigilZapRouter router;
    MockVault vault;
    MockSwapRouter swapRouter;
    MockERC20 weth;
    MockERC20 usdc;

    address user = makeAddr("user");
    address receiver = makeAddr("receiver");

    uint24 constant FEE = 3000;

    function setUp() public {
        weth = new MockERC20("Wrapped Ether", "WETH");
        usdc = new MockERC20("USD Coin", "USDC");
        vault = new MockVault(IERC20(address(weth)));
        swapRouter = new MockSwapRouter();

        router = new VigilZapRouter(IERC4626(address(vault)), ISwapRouter02(address(swapRouter)));
    }

    // ─── CONSTRUCTOR ───

    function test_ConstructorRevertsOnZeroVault() public {
        vm.expectRevert(VigilZapRouter.ZeroAddress.selector);
        new VigilZapRouter(IERC4626(address(0)), ISwapRouter02(address(swapRouter)));
    }

    function test_ConstructorRevertsOnZeroSwapRouter() public {
        vm.expectRevert(VigilZapRouter.ZeroAddress.selector);
        new VigilZapRouter(IERC4626(address(vault)), ISwapRouter02(address(0)));
    }

    function test_ConstructorSetsImmutables() public view {
        assertEq(address(router.vault()), address(vault));
        assertEq(address(router.weth()), address(weth));
        assertEq(address(router.swapRouter()), address(swapRouter));
    }

    // ─── ZAP IN ───

    function test_ZapInHappyPath() public {
        usdc.mint(user, 1_000e18);
        bytes memory path = _encodePath(address(usdc), FEE, address(weth));

        vm.startPrank(user);
        usdc.approve(address(router), 1_000e18);
        uint256 shares = router.zapIn(address(usdc), 1_000e18, path, 0, 0, receiver, block.timestamp);
        vm.stopPrank();

        assertEq(shares, 1_000e18);
        assertEq(vault.balanceOf(receiver), 1_000e18);
        assertEq(usdc.balanceOf(user), 0);
        assertEq(usdc.balanceOf(address(router)), 0);
        assertEq(weth.balanceOf(address(router)), 0);
    }

    function test_ZapInEmitsEvent() public {
        usdc.mint(user, 1_000e18);
        bytes memory path = _encodePath(address(usdc), FEE, address(weth));

        vm.startPrank(user);
        usdc.approve(address(router), 1_000e18);
        vm.expectEmit(true, true, true, true);
        emit VigilZapRouter.ZapIn(user, receiver, address(usdc), 1_000e18, 1_000e18, 1_000e18);
        router.zapIn(address(usdc), 1_000e18, path, 0, 0, receiver, block.timestamp);
        vm.stopPrank();
    }

    function test_ZapInSweepsDustLeftInRouter() public {
        // Simulates leftover balances from a prior, unrelated interaction —
        // _sweep should return whatever sits in the router, not just the
        // amounts this call produced.
        usdc.mint(address(router), 5e18);
        weth.mint(address(router), 3e18);

        usdc.mint(user, 1_000e18);
        bytes memory path = _encodePath(address(usdc), FEE, address(weth));

        vm.startPrank(user);
        usdc.approve(address(router), 1_000e18);
        router.zapIn(address(usdc), 1_000e18, path, 0, 0, receiver, block.timestamp);
        vm.stopPrank();

        assertEq(usdc.balanceOf(user), 5e18);
        assertEq(weth.balanceOf(user), 3e18);
        assertEq(usdc.balanceOf(address(router)), 0);
        assertEq(weth.balanceOf(address(router)), 0);
    }

    function test_ZapInRevertsOnZeroAmount() public {
        bytes memory path = _encodePath(address(usdc), FEE, address(weth));
        vm.expectRevert(VigilZapRouter.ZeroAmount.selector);
        router.zapIn(address(usdc), 0, path, 0, 0, receiver, block.timestamp);
    }

    function test_ZapInRevertsOnZeroReceiver() public {
        bytes memory path = _encodePath(address(usdc), FEE, address(weth));
        vm.expectRevert(VigilZapRouter.ZeroAddress.selector);
        router.zapIn(address(usdc), 1e18, path, 0, 0, address(0), block.timestamp);
    }

    function test_ZapInRevertsWhenExpired() public {
        bytes memory path = _encodePath(address(usdc), FEE, address(weth));
        vm.expectRevert(VigilZapRouter.Expired.selector);
        router.zapIn(address(usdc), 1e18, path, 0, 0, receiver, block.timestamp - 1);
    }

    function test_ZapInRevertsOnPathTooShort() public {
        bytes memory path = abi.encodePacked(address(usdc), uint16(0)); // 22 bytes, < 43
        vm.expectRevert(VigilZapRouter.BadPath.selector);
        router.zapIn(address(usdc), 1e18, path, 0, 0, receiver, block.timestamp);
    }

    function test_ZapInRevertsOnMisalignedPathLength() public {
        bytes memory path = abi.encodePacked(_encodePath(address(usdc), FEE, address(weth)), uint8(0));
        vm.expectRevert(VigilZapRouter.BadPath.selector);
        router.zapIn(address(usdc), 1e18, path, 0, 0, receiver, block.timestamp);
    }

    function test_ZapInRevertsWhenPathDoesNotStartWithTokenIn() public {
        bytes memory path = _encodePath(address(weth), FEE, address(weth));
        vm.expectRevert(VigilZapRouter.BadPath.selector);
        router.zapIn(address(usdc), 1e18, path, 0, 0, receiver, block.timestamp);
    }

    function test_ZapInRevertsWhenPathDoesNotEndInWeth() public {
        bytes memory path = _encodePath(address(usdc), FEE, address(usdc));
        vm.expectRevert(VigilZapRouter.PathMustEndInWeth.selector);
        router.zapIn(address(usdc), 1e18, path, 0, 0, receiver, block.timestamp);
    }

    function test_ZapInAcceptsMultiHopPath() public {
        MockERC20 mid = new MockERC20("Mid", "MID");
        usdc.mint(user, 1_000e18);
        bytes memory path = abi.encodePacked(address(usdc), FEE, address(mid), FEE, address(weth));

        vm.startPrank(user);
        usdc.approve(address(router), 1_000e18);
        uint256 shares = router.zapIn(address(usdc), 1_000e18, path, 0, 0, receiver, block.timestamp);
        vm.stopPrank();

        assertEq(shares, 1_000e18);
    }

    function test_ZapInRevertsOnInsufficientSharesEvenWhenSwapMetItsOwnMinimum() public {
        usdc.mint(user, 1_000e18);
        bytes memory path = _encodePath(address(usdc), FEE, address(weth));

        vm.startPrank(user);
        usdc.approve(address(router), 1_000e18);
        // minWethOut is satisfied (0), but shares (1:1 with wethOut) fall
        // short of a minSharesOut set above what the swap actually produced.
        vm.expectRevert(abi.encodeWithSelector(VigilZapRouter.InsufficientShares.selector, 1_000e18, 2_000e18));
        router.zapIn(address(usdc), 1_000e18, path, 0, 2_000e18, receiver, block.timestamp);
        vm.stopPrank();
    }

    // ─── ZAP IN WITH PERMIT ───

    function test_ZapInWithPermitSpendsSignedApproval() public {
        MockPermitToken token = new MockPermitToken();
        uint256 pk = 0xA11CE;
        address owner = vm.addr(pk);
        token.mint(owner, 1_000e18);

        bytes memory path = abi.encodePacked(address(token), FEE, address(weth));
        uint256 deadline = block.timestamp + 1 hours;

        (uint8 v, bytes32 r, bytes32 s) = _signPermit(token, pk, address(router), 1_000e18, deadline);

        vm.prank(owner);
        uint256 shares = router.zapInWithPermit(address(token), 1_000e18, path, 0, 0, receiver, deadline, v, r, s);

        assertEq(shares, 1_000e18);
        assertEq(token.allowance(owner, address(router)), 0);
    }

    function test_ZapInWithPermitToleratesTokenWithoutPermit() public {
        // usdc has no permit() at all; the call reverts internally and the
        // router's try/catch swallows it. The zap still succeeds because the
        // user pre-approved the normal way.
        usdc.mint(user, 1_000e18);
        bytes memory path = _encodePath(address(usdc), FEE, address(weth));

        vm.startPrank(user);
        usdc.approve(address(router), 1_000e18);
        uint256 shares = router.zapInWithPermit(
            address(usdc), 1_000e18, path, 0, 0, receiver, block.timestamp, 0, bytes32(0), bytes32(0)
        );
        vm.stopPrank();

        assertEq(shares, 1_000e18);
    }

    // ─── ZAP OUT ───

    function test_ZapOutHappyPath() public {
        uint256 shares = _giveUserShares(user, 1_000e18);
        bytes memory path = _encodePath(address(weth), FEE, address(usdc));

        vm.startPrank(user);
        vault.approve(address(router), shares);
        uint256 amountOut = router.zapOut(shares, address(usdc), path, 0, receiver, block.timestamp);
        vm.stopPrank();

        assertEq(amountOut, 1_000e18);
        assertEq(usdc.balanceOf(receiver), 1_000e18);
        assertEq(vault.balanceOf(user), 0);
        assertEq(weth.balanceOf(address(router)), 0);
    }

    function test_ZapOutEmitsEvent() public {
        uint256 shares = _giveUserShares(user, 1_000e18);
        bytes memory path = _encodePath(address(weth), FEE, address(usdc));

        vm.startPrank(user);
        vault.approve(address(router), shares);
        vm.expectEmit(true, true, true, true);
        emit VigilZapRouter.ZapOut(user, receiver, address(usdc), 1_000e18, 1_000e18, 1_000e18);
        router.zapOut(shares, address(usdc), path, 0, receiver, block.timestamp);
        vm.stopPrank();
    }

    function test_ZapOutRevertsOnZeroShares() public {
        bytes memory path = _encodePath(address(weth), FEE, address(usdc));
        vm.expectRevert(VigilZapRouter.ZeroAmount.selector);
        router.zapOut(0, address(usdc), path, 0, receiver, block.timestamp);
    }

    function test_ZapOutRevertsOnZeroReceiver() public {
        bytes memory path = _encodePath(address(weth), FEE, address(usdc));
        vm.expectRevert(VigilZapRouter.ZeroAddress.selector);
        router.zapOut(1e18, address(usdc), path, 0, address(0), block.timestamp);
    }

    function test_ZapOutRevertsWhenExpired() public {
        bytes memory path = _encodePath(address(weth), FEE, address(usdc));
        vm.expectRevert(VigilZapRouter.Expired.selector);
        router.zapOut(1e18, address(usdc), path, 0, receiver, block.timestamp - 1);
    }

    function test_ZapOutRevertsWhenPathDoesNotStartWithWeth() public {
        bytes memory path = _encodePath(address(usdc), FEE, address(usdc));
        vm.expectRevert(VigilZapRouter.PathMustStartWithWeth.selector);
        router.zapOut(1e18, address(usdc), path, 0, receiver, block.timestamp);
    }

    function test_ZapOutRevertsWhenPathDoesNotEndInTokenOut() public {
        bytes memory path = _encodePath(address(weth), FEE, address(weth));
        vm.expectRevert(VigilZapRouter.BadPath.selector);
        router.zapOut(1e18, address(usdc), path, 0, receiver, block.timestamp);
    }

    function test_ZapOutRevertsOnDishonestRouterUndershootingMinimum() public {
        // A spec-compliant swap router can never return less than
        // amountOutMinimum, so this flips the mock to "dishonest" purely to
        // exercise VigilZapRouter's own defensive post-swap check.
        swapRouter.setHonest(false);
        swapRouter.setRate(1, 2); // 1000 weth -> 500 usdc, below the 900 minimum

        uint256 shares = _giveUserShares(user, 1_000e18);
        bytes memory path = _encodePath(address(weth), FEE, address(usdc));

        vm.startPrank(user);
        vault.approve(address(router), shares);
        vm.expectRevert(abi.encodeWithSelector(VigilZapRouter.InsufficientOutput.selector, 500e18, 900e18));
        router.zapOut(shares, address(usdc), path, 900e18, receiver, block.timestamp);
        vm.stopPrank();
    }

    // ─── HELPERS ───

    function _giveUserShares(address to, uint256 amount) internal returns (uint256 shares) {
        weth.mint(address(this), amount);
        weth.approve(address(vault), amount);
        shares = vault.deposit(amount, to);
    }

    function _encodePath(address tokenA, uint24 fee, address tokenB) internal pure returns (bytes memory) {
        return abi.encodePacked(tokenA, fee, tokenB);
    }

    function _signPermit(MockPermitToken token, uint256 pk, address spender, uint256 value, uint256 deadline)
        internal
        view
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        address owner = vm.addr(pk);
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                token.nonces(owner),
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash));
        (v, r, s) = vm.sign(pk, digest);
    }
}
