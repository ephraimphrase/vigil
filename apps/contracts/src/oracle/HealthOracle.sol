// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IHealthOracle} from "../interface/IHealthOracle.sol";

// A 0-100 health score per protocol, written by an offchain scorer.
//
// This reports an OPINION an LLM formed, not a measurable fact. There is no
// ground truth to check it against, so the design goal is not accuracy — it
// is bounding what a compromised scorer key can do:
//
//   - scores clamped to 0-100
//   - max ±MAX_DELTA per write, so no 0-to-100 swings
//   - one write per MIN_INTERVAL per protocol
//   - timestamped, so consumers treat silence as exit
//
// A fully compromised scorer produces a bad allocation across whitelisted
// adapters. It can never move funds anywhere.
contract HealthOracle is AccessControl, IHealthOracle {
    // The offchain scorer — the least-protected key in the system, and the
    // threat model every bound below is written against.
    bytes32 public constant SCORER_ROLE = keccak256("SCORER_ROLE");

    // Emergency powers point one way only: down. A guardian who could RAISE
    // a score could steer funds INTO a failing protocol.
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    uint16 public constant MAX_SCORE = 100;
    uint16 public constant MAX_DELTA = 30;
    uint256 public constant MIN_INTERVAL = 5 minutes;

    // Consumers treat scores older than this as zero.
    uint256 public immutable override stalenessWindow;

    struct Score {
        uint16 value; // 0-100
        uint40 updatedAt; // write timestamp
        bool registered; // distinguishes "score 0" from "never set"
    }

    mapping(bytes32 => Score) private _scores;

    // For enumeration by dashboards. Small set.
    bytes32[] public override protocolIds;

    event ProtocolRegistered(bytes32 indexed protocolId, uint16 initialScore);
    event ScoreUpdated(bytes32 indexed protocolId, uint16 oldScore, uint16 newScore);
    event EmergencyZeroed(bytes32 indexed protocolId, uint16 previousScore);

    error ZeroAddress();
    error NotRegistered(bytes32 protocolId);
    error AlreadyRegistered(bytes32 protocolId);
    error ScoreOutOfRange(uint16 score);
    error TooSoon(bytes32 protocolId, uint256 nextAllowed);

    constructor(address admin, address scorer, address guardian, uint256 _stalenessWindow) {
        if (admin == address(0)) revert ZeroAddress();

        stalenessWindow = _stalenessWindow == 0 ? 6 hours : _stalenessWindow;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SCORER_ROLE, scorer);
        _grantRole(GUARDIAN_ROLE, guardian);
    }

    /// @notice Current score and when it was written.
    /// @dev Unregistered returns (0, 0) rather than reverting — consumers
    ///      treat that as "exit", the correct failure direction.
    function scoreOf(bytes32 protocolId) external view override returns (uint16 score, uint40 updatedAt) {
        Score storage s = _scores[protocolId];
        return (s.value, s.updatedAt);
    }

    function protocolCount() external view override returns (uint256) {
        return protocolIds.length;
    }

    // Admin-gated, not scorer-gated. The scorer opines on protocols a human
    // already approved — it cannot introduce new ones.
    function registerProtocol(bytes32 protocolId, uint16 initialScore) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_scores[protocolId].registered) revert AlreadyRegistered(protocolId);
        if (initialScore > MAX_SCORE) revert ScoreOutOfRange(initialScore);

        _scores[protocolId] = Score({value: initialScore, updatedAt: uint40(block.timestamp), registered: true});
        protocolIds.push(protocolId);

        emit ProtocolRegistered(protocolId, initialScore);
    }

    /// @notice Write a score. Clamped to ±MAX_DELTA of the current value,
    ///         one write per MIN_INTERVAL. A leaked key needs several
    ///         spaced writes to move a score far from the middle of the
    ///         range — time enough for a human to notice and revoke.
    /// @dev Note the clamp's floor collapses to 0 once `old <= MAX_DELTA`,
    ///      so near the bottom of the range a single write CAN zero a
    ///      score outright, same as emergencyZero but scorer-gated instead
    ///      of guardian-gated.
    function setScore(bytes32 protocolId, uint16 newScore) public override onlyRole(SCORER_ROLE) {
        if (newScore > MAX_SCORE) revert ScoreOutOfRange(newScore);

        Score storage s = _scores[protocolId];
        if (!s.registered) revert NotRegistered(protocolId);

        uint256 nextAllowed = uint256(s.updatedAt) + MIN_INTERVAL;
        if (block.timestamp < nextAllowed) revert TooSoon(protocolId, nextAllowed);

        uint16 old = s.value;
        uint16 applied = _clampDelta(old, newScore);

        s.value = applied;
        s.updatedAt = uint40(block.timestamp);

        emit ScoreUpdated(protocolId, old, applied);
    }

    /// @notice Batch write. Same bounds apply per entry.
    function setScores(bytes32[] calldata ids, uint16[] calldata values) external override onlyRole(SCORER_ROLE) {
        uint256 n = ids.length;
        require(n == values.length, "length mismatch");
        for (uint256 i; i < n; ++i) {
            setScore(ids[i], values[i]);
        }
    }

    /// @notice Force a score to zero. Bypasses the clamp and the rate
    ///         limit — those exist to slow down a rogue scorer, not a
    ///         human pulling the alarm.
    function emergencyZero(bytes32 protocolId) external override onlyRole(GUARDIAN_ROLE) {
        Score storage s = _scores[protocolId];
        if (!s.registered) revert NotRegistered(protocolId);

        uint16 old = s.value;
        s.value = 0;
        s.updatedAt = uint40(block.timestamp);

        emit EmergencyZeroed(protocolId, old);
        emit ScoreUpdated(protocolId, old, 0);
    }

    // Rate limiter on the DELTA, not a bounds check on the value — newScore
    // is already guaranteed 0-100 by setScore's own check before this runs.
    function _clampDelta(uint16 old, uint16 desired) internal pure returns (uint16) {
        if (desired > old) {
            uint16 up = old + MAX_DELTA;
            if (up > MAX_SCORE) up = MAX_SCORE;
            return desired > up ? up : desired;
        }
        uint16 floorVal = old > MAX_DELTA ? old - MAX_DELTA : 0;
        return desired < floorVal ? floorVal : desired;
    }
}
