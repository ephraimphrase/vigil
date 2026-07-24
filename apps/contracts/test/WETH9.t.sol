// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {WETH9} from "../src/WETH9.sol";

contract WETH9Test is Test {
    WETH9 weth;
    address alice = makeAddr("alice");

    function setUp() public {
        weth = new WETH9();
        vm.deal(alice, 10 ether);
    }

    function test_DepositMintsWETH() public {
        vm.prank(alice);
        weth.deposit{value: 1 ether}();

        assertEq(weth.balanceOf(alice), 1 ether);
        assertEq(address(weth).balance, 1 ether);
    }

    function test_ReceiveAutoWraps() public {
        vm.prank(alice);
        (bool success,) = address(weth).call{value: 2 ether}("");
        assertTrue(success);

        assertEq(weth.balanceOf(alice), 2 ether);
    }

    function test_WithdrawBurnsAndReturnsETH() public {
        vm.startPrank(alice);
        weth.deposit{value: 3 ether}();
        uint256 balBefore = alice.balance;

        weth.withdraw(1 ether);
        vm.stopPrank();

        assertEq(weth.balanceOf(alice), 2 ether);
        assertEq(alice.balance, balBefore + 1 ether);
    }

    function test_RevertWhen_WithdrawExceedsBalance() public {
        vm.prank(alice);
        vm.expectRevert();
        weth.withdraw(1 ether);
    }

    function test_TotalSupplyTracksDeposits() public {
        vm.prank(alice);
        weth.deposit{value: 5 ether}();
        assertEq(weth.totalSupply(), 5 ether);
    }
}
