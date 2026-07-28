// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVigilProtocolAdapter} from "../interface/IVigilProtocolAdapter.sol";
import {IVigilVault} from "../interface/IVigilVault.sol";
import {HealthOracle} from "../oracle/HealthOracle.sol";

// An ERC-4626 vault that splits deposits across a whitelisted set of
// protocol adapters, weighted by each adapter's HealthOracle score. Idle
// balance (not yet swept into an adapter) always counts as zero-risk weight
// in the pool, so a healthy vault gradually drains toward whichever
// protocols the scorer currently trusts most.
//
// Adapters are immutable-bound to a single vault address at construction
// (see IVigilProtocolAdapter implementations), so this vault MUST be
// deployed before any adapter that points at it - VaultFactory deploys in
// that order.
contract VigilVault is ERC4626, AccessControl, ReentrancyGuard, IVigilVault {
    using SafeERC20 for IERC20;

    // Adapter whitelisting is admin-gated, same split as HealthOracle:
    // KEEPER_ROLE runs routine rebalances, GUARDIAN_ROLE only ever pulls
    // funds OUT in an emergency. Neither can add/remove adapters or move
    // funds anywhere an admin didn't already approve by whitelisting it.
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    // Bounds the cost of rebalance()/totalAssets(), both O(adapters.length).
    uint256 public constant MAX_ADAPTERS = 12;

    HealthOracle public immutable override oracle;

    IVigilProtocolAdapter[] public override adapters;
    mapping(address => bool) public override isAdapter;

    event AdapterAdded(address indexed adapter, bytes32 indexed protocolId);
    event AdapterRemoved(address indexed adapter, bytes32 indexed protocolId, uint256 withdrawn);
    event Rebalanced(uint256 totalPool);
    event AdapterEvacuated(address indexed adapter, uint256 withdrawn);

    error ZeroAddress();
    error NotAnAdapter();
    error AdapterAlreadyAdded();
    error TooManyAdapters();
    error AssetMismatch();

    constructor(
        IERC20 _asset,
        HealthOracle _oracle,
        address admin,
        address keeper,
        address guardian,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) {
        if (address(_oracle) == address(0)) revert ZeroAddress();
        if (admin == address(0)) revert ZeroAddress();

        oracle = _oracle;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KEEPER_ROLE, keeper);
        _grantRole(GUARDIAN_ROLE, guardian);
    }

    // ─── ADAPTER MANAGEMENT ───

    function addAdapter(IVigilProtocolAdapter adapter) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(adapter) == address(0)) revert ZeroAddress();
        if (isAdapter[address(adapter)]) revert AdapterAlreadyAdded();
        if (adapters.length >= MAX_ADAPTERS) revert TooManyAdapters();
        if (adapter.asset() != asset()) revert AssetMismatch();

        isAdapter[address(adapter)] = true;
        adapters.push(adapter);

        emit AdapterAdded(address(adapter), adapter.protocolId());
    }

    // Pulls any remaining position back into the vault's idle balance before
    // dropping the adapter from rotation - otherwise those funds would be
    // stranded: no longer weighted into rebalance(), but still sitting in
    // the adapter contract with nothing left tracking them.
    function removeAdapter(IVigilProtocolAdapter adapter) external override onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (!isAdapter[address(adapter)]) revert NotAnAdapter();

        uint256 withdrawn = adapter.withdrawAll();

        isAdapter[address(adapter)] = false;
        _removeFromArray(adapter);

        emit AdapterRemoved(address(adapter), adapter.protocolId(), withdrawn);
    }

    function adapterCount() external view override returns (uint256) {
        return adapters.length;
    }

    // ─── HEALTH-WEIGHTED ALLOCATION ───

    // A stale-or-never-written score weighs 0, same convention HealthOracle
    // documents for its own consumers - silence reads as "exit".
    function _weightOf(IVigilProtocolAdapter adapter) internal view returns (uint256) {
        (uint16 score, uint40 updatedAt) = oracle.scoreOf(adapter.protocolId());
        if (updatedAt == 0) return 0;
        if (block.timestamp - updatedAt > oracle.stalenessWindow()) return 0;
        return score;
    }

    function targetWeights() public view override returns (uint256[] memory weights, uint256 totalWeight) {
        uint256 n = adapters.length;
        weights = new uint256[](n);
        for (uint256 i; i < n; ++i) {
            weights[i] = _weightOf(adapters[i]);
            totalWeight += weights[i];
        }
    }

    // Moves funds so each adapter ends up holding (pool * its weight /
    // totalWeight), where pool is idle balance plus everything currently
    // out at adapters. Withdraws every overweight position first so the
    // vault has idle balance on hand to fund the underweight ones after -
    // otherwise the deposit phase would be starved by the withdraw phase
    // still being in flight.
    //
    // If totalWeight is 0 (every adapter stale/unregistered) every target
    // collapses to 0, which just pulls the whole pool back to idle - the
    // safe default when the oracle has gone quiet.
    //
    // Protocol-side illiquidity can cap withdraw() below what was
    // requested; a stalled rebalance() is expected to converge further on
    // the next call once liquidity frees up, not to force the shortfall
    // through some other path.
    function rebalance() external override onlyRole(KEEPER_ROLE) nonReentrant {
        uint256 n = adapters.length;
        (uint256[] memory weights, uint256 totalWeight) = targetWeights();

        uint256 pool = IERC20(asset()).balanceOf(address(this));
        uint256[] memory current = new uint256[](n);
        for (uint256 i; i < n; ++i) {
            current[i] = adapters[i].totalAssets();
            pool += current[i];
        }

        if (pool == 0) return;

        uint256[] memory target = new uint256[](n);
        for (uint256 i; i < n; ++i) {
            target[i] = totalWeight == 0 ? 0 : (pool * weights[i]) / totalWeight;
        }

        for (uint256 i; i < n; ++i) {
            if (current[i] > target[i]) {
                adapters[i].withdraw(current[i] - target[i]);
            }
        }
        for (uint256 i; i < n; ++i) {
            if (target[i] > current[i]) {
                uint256 needed = target[i] - current[i];
                uint256 available = IERC20(asset()).balanceOf(address(this));
                uint256 amount = needed < available ? needed : available;
                if (amount == 0) continue;

                IERC20(asset()).safeTransfer(address(adapters[i]), amount);
                adapters[i].deposit(amount);
            }
        }

        emit Rebalanced(pool);
    }

    // ─── EMERGENCY ───

    // Guardian-gated and one-directional - pulls a position OUT immediately,
    // mirroring HealthOracle.emergencyZero. Lets a human yank funds from a
    // failing protocol without waiting for the scorer to catch up and a
    // keeper to run a full rebalance().
    function emergencyEvacuate(IVigilProtocolAdapter adapter)
        external
        override
        onlyRole(GUARDIAN_ROLE)
        nonReentrant
        returns (uint256 withdrawn)
    {
        if (!isAdapter[address(adapter)]) revert NotAnAdapter();

        withdrawn = adapter.withdrawAll();

        emit AdapterEvacuated(address(adapter), withdrawn);
    }

    // ─── ERC4626 OVERRIDES ───

    function totalAssets() public view override returns (uint256 total) {
        total = IERC20(asset()).balanceOf(address(this));
        uint256 n = adapters.length;
        for (uint256 i; i < n; ++i) {
            total += adapters[i].totalAssets();
        }
    }

    // Tops up idle balance from adapters before the base ERC4626 logic
    // transfers assets out - a plain proportional draw isn't needed here,
    // just enough liquidity to cover this one withdrawal, so adapters are
    // drained in whatever order they're stored until the shortfall is met.
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
        nonReentrant
    {
        uint256 idle = IERC20(asset()).balanceOf(address(this));
        if (idle < assets) {
            _pullLiquidity(assets - idle);
        }
        super._withdraw(caller, receiver, owner, assets, shares);
    }

    function _pullLiquidity(uint256 needed) internal {
        uint256 n = adapters.length;
        for (uint256 i; i < n && needed > 0; ++i) {
            uint256 avail = adapters[i].maxWithdraw();
            if (avail == 0) continue;

            uint256 amount = avail < needed ? avail : needed;
            uint256 withdrawn = adapters[i].withdraw(amount);
            needed -= withdrawn;
        }
    }

    function _removeFromArray(IVigilProtocolAdapter adapter) private {
        uint256 n = adapters.length;
        for (uint256 i; i < n; ++i) {
            if (adapters[i] == adapter) {
                adapters[i] = adapters[n - 1];
                adapters.pop();
                return;
            }
        }
    }
}
