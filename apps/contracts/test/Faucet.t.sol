// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Faucet} from "../src/token/Faucet.sol";
import {SeedTokenFactory} from "../src/token/SeedTokenFactory.sol";
import {SeedToken} from "../src/token/SeedToken.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract FaucetTest is Test {
    Faucet faucet;
    SeedToken tokenA;
    SeedToken tokenB;
    address owner = makeAddr("owner");
    address user = makeAddr("user");

    function setUp() public {
        faucet = new Faucet(owner);

        SeedTokenFactory factory = new SeedTokenFactory();
        tokenA = SeedToken(factory.deployToken("Token A", "A"));
        tokenB = SeedToken(factory.deployToken("Token B", "B"));

        address[] memory tokens = new address[](2);
        tokens[0] = address(tokenA);
        tokens[1] = address(tokenB);
        vm.prank(owner);
        faucet.setSupportedTokens(tokens, true);
    }

    function test_ClaimSendsFixedAmount() public {
        vm.prank(user);
        faucet.claim(address(tokenA));

        assertEq(tokenA.balanceOf(user), faucet.CLAIM_AMOUNT());
    }

    function test_ClaimMintsRatherThanDrainingAPool() public {
        uint256 supplyBefore = tokenA.totalSupply();

        vm.prank(user);
        faucet.claim(address(tokenA));

        // Real SeedToken.mint() creates new supply - the faucet never needs
        // (and, after this claim, still doesn't hold) a pre-funded balance.
        assertEq(tokenA.totalSupply(), supplyBefore + faucet.CLAIM_AMOUNT());
        assertEq(tokenA.balanceOf(address(faucet)), 0);
    }

    function test_RevertWhen_ClaimUnsupportedToken() public {
        MockERC20 rogue = new MockERC20("Rogue", "R");
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Faucet.UnsupportedToken.selector, address(rogue)));
        faucet.claim(address(rogue));
    }

    function test_RevertWhen_ClaimOnCooldown() public {
        vm.startPrank(user);
        faucet.claim(address(tokenA));

        vm.expectRevert(bytes("Faucet: cooldown"));
        faucet.claim(address(tokenA));
        vm.stopPrank();
    }

    function test_ClaimSucceedsAfterCooldownElapses() public {
        vm.startPrank(user);
        faucet.claim(address(tokenA));

        vm.warp(block.timestamp + faucet.COOLDOWN());
        faucet.claim(address(tokenA));
        vm.stopPrank();

        assertEq(tokenA.balanceOf(user), faucet.CLAIM_AMOUNT() * 2);
    }

    function test_ClaimManySendsEveryToken() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(tokenA);
        tokens[1] = address(tokenB);

        vm.prank(user);
        faucet.claimMany(tokens);

        assertEq(tokenA.balanceOf(user), faucet.CLAIM_AMOUNT());
        assertEq(tokenB.balanceOf(user), faucet.CLAIM_AMOUNT());
    }

    function test_ClaimManySkipsOnCooldownTokenWithoutReverting() public {
        vm.prank(user);
        faucet.claim(address(tokenA)); // A now on cooldown

        address[] memory tokens = new address[](2);
        tokens[0] = address(tokenA);
        tokens[1] = address(tokenB);

        vm.expectEmit(true, true, false, false, address(faucet));
        emit Faucet.Skipped(user, address(tokenA), 0);
        vm.expectEmit(true, true, false, true, address(faucet));
        emit Faucet.Claimed(user, address(tokenB), faucet.CLAIM_AMOUNT());

        vm.prank(user);
        faucet.claimMany(tokens);

        // Unchanged - the earlier single claim() already sent one batch.
        assertEq(tokenA.balanceOf(user), faucet.CLAIM_AMOUNT());
        assertEq(tokenB.balanceOf(user), faucet.CLAIM_AMOUNT());
    }

    function test_RevertWhen_ClaimManyIncludesUnsupportedToken() public {
        MockERC20 rogue = new MockERC20("Rogue", "R");
        address[] memory tokens = new address[](2);
        tokens[0] = address(tokenA);
        tokens[1] = address(rogue);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Faucet.UnsupportedToken.selector, address(rogue)));
        faucet.claimMany(tokens);

        // Reverts before touching the earlier, valid entry too.
        assertEq(tokenA.balanceOf(user), 0);
    }

    function test_RevertWhen_ClaimManyExceedsMaxBatch() public {
        address[] memory tokens = new address[](faucet.MAX_BATCH() + 1);
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Faucet.TooManyTokens.selector, tokens.length));
        faucet.claimMany(tokens);
    }

    function test_ClaimableAtReportsZeroForNeverClaimed() public view {
        address[] memory tokens = new address[](1);
        tokens[0] = address(tokenA);

        uint256[] memory result = faucet.claimableAt(user, tokens);
        assertEq(result[0], 0);
    }

    function test_ClaimableAtReflectsCooldownAfterClaim() public {
        vm.prank(user);
        faucet.claim(address(tokenA));

        address[] memory tokens = new address[](1);
        tokens[0] = address(tokenA);
        uint256[] memory result = faucet.claimableAt(user, tokens);

        assertEq(result[0], block.timestamp + faucet.COOLDOWN());
    }

    function test_RescueIsOwnerOnly() public {
        // Faucet shouldn't normally hold a balance (mint-and-forward nets to
        // zero) - simulate leftover dust to prove rescue can sweep it.
        vm.prank(address(faucet));
        tokenA.mint(1 ether);

        vm.prank(user);
        vm.expectRevert();
        faucet.rescue(address(tokenA), user, 1 ether);

        vm.prank(owner);
        faucet.rescue(address(tokenA), owner, 1 ether);
        assertEq(tokenA.balanceOf(owner), 1 ether);
    }

    function test_SetSupportedTokensIsOwnerOnly() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(tokenA);

        vm.prank(user);
        vm.expectRevert();
        faucet.setSupportedTokens(tokens, false);
    }
}
