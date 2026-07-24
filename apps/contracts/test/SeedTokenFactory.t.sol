// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SeedTokenFactory} from "../src/token/SeedTokenFactory.sol";
import {SeedToken} from "../src/token/SeedToken.sol";

contract SeedTokenFactoryTest is Test {
    SeedTokenFactory factory;
    address deployer = makeAddr("deployer");

    function setUp() public {
        factory = new SeedTokenFactory();
    }

    function test_DeployTokenMintsSupplyToCaller() public {
        vm.prank(deployer);
        address token = factory.deployToken("Uniswap", "UNI");

        SeedToken uni = SeedToken(token);
        assertEq(uni.name(), "Uniswap");
        assertEq(uni.symbol(), "UNI");
        assertEq(uni.balanceOf(deployer), factory.INITIAL_SUPPLY());
        assertEq(uni.totalSupply(), factory.INITIAL_SUPPLY());
    }

    function test_DeployTokenRegistersInFactory() public {
        address token = factory.deployToken("Aave", "AAVE");

        assertEq(factory.tokenBySymbol("AAVE"), token);
        assertEq(factory.tokenCount(), 1);

        SeedTokenFactory.TokenInfo[] memory all = factory.allTokens();
        assertEq(all.length, 1);
        assertEq(all[0].token, token);
        assertEq(all[0].symbol, "AAVE");
        assertEq(all[0].name, "Aave");
    }

    function test_EachTokenIsIndependent() public {
        address uni = factory.deployToken("Uniswap", "UNI");
        address aave = factory.deployToken("Aave", "AAVE");

        assertTrue(uni != aave);
        assertEq(factory.tokenCount(), 2);

        SeedToken(uni).transfer(address(0xBEEF), 1 ether);
        assertEq(SeedToken(aave).balanceOf(address(0xBEEF)), 0);
    }

    function test_RevertWhen_SymbolAlreadyDeployed() public {
        factory.deployToken("Uniswap", "UNI");

        vm.expectRevert("symbol already deployed");
        factory.deployToken("Uniswap V2", "UNI");
    }

    function test_ImplementationCannotBeReinitialized() public {
        SeedToken impl = SeedToken(factory.implementation());

        vm.expectRevert();
        impl.initialize("Fake", "FAKE", 1 ether, address(this));
    }
}
