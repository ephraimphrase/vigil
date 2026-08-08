// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {HealthOracle} from "../src/oracle/HealthOracle.sol";

contract HealthOracleTest is Test {
    HealthOracle oracle;

    address admin = makeAddr("admin");
    address scorer = makeAddr("scorer");
    address guardian = makeAddr("guardian");
    address stranger = makeAddr("stranger");

    bytes32 constant PROTOCOL = keccak256("AAVE_V3_BASE");

    function setUp() public {
        oracle = new HealthOracle(admin, scorer, guardian, 0);
    }

    function test_ConstructorRevertsOnZeroAdmin() public {
        vm.expectRevert(HealthOracle.ZeroAddress.selector);
        new HealthOracle(address(0), scorer, guardian, 0);
    }

    function test_ConstructorDefaultsStalenessWindowWhenZero() public view {
        assertEq(oracle.stalenessWindow(), 6 hours);
    }

    function test_ConstructorKeepsExplicitStalenessWindow() public {
        HealthOracle o = new HealthOracle(admin, scorer, guardian, 2 hours);
        assertEq(o.stalenessWindow(), 2 hours);
    }

    function test_ConstructorGrantsRoles() public view {
        assertTrue(oracle.hasRole(oracle.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(oracle.hasRole(oracle.SCORER_ROLE(), scorer));
        assertTrue(oracle.hasRole(oracle.GUARDIAN_ROLE(), guardian));
    }

    function test_ScoreOfUnregisteredReturnsZero() public view {
        (uint16 score, uint40 updatedAt) = oracle.scoreOf(PROTOCOL);
        assertEq(score, 0);
        assertEq(updatedAt, 0);
    }

    function test_RegisterProtocolSetsInitialScore() public {
        vm.prank(admin);
        oracle.registerProtocol(PROTOCOL, 80);

        (uint16 score, uint40 updatedAt) = oracle.scoreOf(PROTOCOL);
        assertEq(score, 80);
        assertEq(updatedAt, block.timestamp);
        assertEq(oracle.protocolCount(), 1);
        assertEq(oracle.protocolIds(0), PROTOCOL);
    }

    function test_RegisterProtocolEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit HealthOracle.ProtocolRegistered(PROTOCOL, 80);

        vm.prank(admin);
        oracle.registerProtocol(PROTOCOL, 80);
    }

    function test_RegisterProtocolRevertsForNonAdmin() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, oracle.DEFAULT_ADMIN_ROLE()
            )
        );
        vm.prank(stranger);
        oracle.registerProtocol(PROTOCOL, 80);
    }

    function test_RegisterProtocolRevertsIfAlreadyRegistered() public {
        vm.startPrank(admin);
        oracle.registerProtocol(PROTOCOL, 80);

        vm.expectRevert(abi.encodeWithSelector(HealthOracle.AlreadyRegistered.selector, PROTOCOL));
        oracle.registerProtocol(PROTOCOL, 50);
        vm.stopPrank();
    }

    function test_RegisterProtocolRevertsAboveMaxScore() public {
        vm.expectRevert(abi.encodeWithSelector(HealthOracle.ScoreOutOfRange.selector, 101));
        vm.prank(admin);
        oracle.registerProtocol(PROTOCOL, 101);
    }

    function _register(uint16 initialScore) internal {
        vm.prank(admin);
        oracle.registerProtocol(PROTOCOL, initialScore);
        // registerProtocol also stamps updatedAt, so MIN_INTERVAL applies
        // from registration too — clear it before the first setScore call.
        skip(oracle.MIN_INTERVAL());
    }

    function test_SetScoreRevertsForNonScorer() public {
        _register(50);

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, oracle.SCORER_ROLE()
            )
        );
        vm.prank(stranger);
        oracle.setScore(PROTOCOL, 60);
    }

    function test_SetScoreRevertsIfNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(HealthOracle.NotRegistered.selector, PROTOCOL));
        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 60);
    }

    function test_SetScoreRevertsAboveMaxScore() public {
        _register(50);

        vm.expectRevert(abi.encodeWithSelector(HealthOracle.ScoreOutOfRange.selector, 101));
        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 101);
    }

    function test_SetScoreRevertsBeforeMinInterval() public {
        _register(50);

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 60);

        vm.expectRevert(
            abi.encodeWithSelector(HealthOracle.TooSoon.selector, PROTOCOL, block.timestamp + oracle.MIN_INTERVAL())
        );
        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 70);
    }

    function test_SetScoreAllowsWriteAfterMinInterval() public {
        _register(50);

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 60);

        skip(oracle.MIN_INTERVAL());

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 70);

        (uint16 score,) = oracle.scoreOf(PROTOCOL);
        assertEq(score, 70);
    }

    function test_SetScoreClampsUpwardDelta() public {
        _register(50);

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 100);

        (uint16 score,) = oracle.scoreOf(PROTOCOL);
        assertEq(score, 80); // 50 + MAX_DELTA(30)
    }

    function test_SetScoreClampsDownwardDeltaAboveThreshold() public {
        _register(80);

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 0);

        (uint16 score,) = oracle.scoreOf(PROTOCOL);
        assertEq(score, 50); // 80 - MAX_DELTA(30), floor never reaches 0 here
    }

    function test_SetScoreCanZeroOutInOneWriteNearBottomOfRange() public {
        // Documents the floor collapsing to 0 once old <= MAX_DELTA(30) —
        // a scorer can zero a low score in a single call, same power as
        // emergencyZero but under SCORER_ROLE instead of GUARDIAN_ROLE.
        _register(30);

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 0);

        (uint16 score,) = oracle.scoreOf(PROTOCOL);
        assertEq(score, 0);
    }

    function test_SetScoreUnclampedWithinDelta() public {
        _register(50);

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 65);

        (uint16 score,) = oracle.scoreOf(PROTOCOL);
        assertEq(score, 65);
    }

    function test_SetScoreEmitsEvent() public {
        _register(50);

        vm.expectEmit(true, false, false, true);
        emit HealthOracle.ScoreUpdated(PROTOCOL, 50, 65);

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 65);
    }

    function test_SetScoresRevertsOnLengthMismatch() public {
        bytes32[] memory ids = new bytes32[](2);
        uint16[] memory values = new uint16[](1);

        vm.expectRevert("length mismatch");
        vm.prank(scorer);
        oracle.setScores(ids, values);
    }

    function test_SetScoresAppliesBoundsPerEntry() public {
        bytes32 protocolB = keccak256("COMPOUND_V2");

        vm.startPrank(admin);
        oracle.registerProtocol(PROTOCOL, 50);
        oracle.registerProtocol(protocolB, 90);
        vm.stopPrank();
        skip(oracle.MIN_INTERVAL());

        bytes32[] memory ids = new bytes32[](2);
        ids[0] = PROTOCOL;
        ids[1] = protocolB;
        uint16[] memory values = new uint16[](2);
        values[0] = 100;
        values[1] = 10;

        vm.prank(scorer);
        oracle.setScores(ids, values);

        (uint16 scoreA,) = oracle.scoreOf(PROTOCOL);
        (uint16 scoreB,) = oracle.scoreOf(protocolB);
        assertEq(scoreA, 80); // 50 + MAX_DELTA(30)
        assertEq(scoreB, 60); // 90 - MAX_DELTA(30)
    }

    function test_EmergencyZeroRevertsForNonGuardian() public {
        _register(50);

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, oracle.GUARDIAN_ROLE()
            )
        );
        vm.prank(stranger);
        oracle.emergencyZero(PROTOCOL);
    }

    function test_EmergencyZeroRevertsIfNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(HealthOracle.NotRegistered.selector, PROTOCOL));
        vm.prank(guardian);
        oracle.emergencyZero(PROTOCOL);
    }

    function test_EmergencyZeroBypassesRateLimitAndClamp() public {
        _register(90);

        vm.prank(scorer);
        oracle.setScore(PROTOCOL, 95);

        // Would revert on setScore due to MIN_INTERVAL; guardian is unaffected.
        vm.prank(guardian);
        oracle.emergencyZero(PROTOCOL);

        (uint16 score,) = oracle.scoreOf(PROTOCOL);
        assertEq(score, 0);
    }

    function test_EmergencyZeroEmitsEvents() public {
        _register(90);

        vm.expectEmit(true, false, false, true);
        emit HealthOracle.EmergencyZeroed(PROTOCOL, 90);
        vm.expectEmit(true, false, false, true);
        emit HealthOracle.ScoreUpdated(PROTOCOL, 90, 0);

        vm.prank(guardian);
        oracle.emergencyZero(PROTOCOL);
    }
}
