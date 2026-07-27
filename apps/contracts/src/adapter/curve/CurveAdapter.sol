// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVigilProtocolAdapter} from "../IVigilProtocolAdapter.sol";

// SKELETON - Curve Finance stable pools. Primary: USDC, USDT, DAI.
// TODO: depositing a single stablecoin means one-sided add_liquidity into a
// multi-asset pool (slippage/imbalance risk the lending-style adapters
// don't have), and the position is held as a Curve LP token, then usually
// staked in a gauge for CRV emissions on top of trading fees. protocolPool
// should be the specific stable pool address; a gauge address will likely
// be needed too once staking/reward-claiming is implemented.
contract CurveAdapter is IVigilProtocolAdapter {
    address public immutable vault;
    IERC20  public immutable underlying;
    bytes32 public immutable override protocolId;

    address public immutable protocolPool;

    error OnlyVault();
    error ZeroAddress();
    error NotImplemented();

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    constructor(address _vault, IERC20 _underlying, address _protocolPool, bytes32 _protocolId) {
        if (_vault == address(0)) revert ZeroAddress();
        if (address(_underlying) == address(0)) revert ZeroAddress();
        if (_protocolPool == address(0)) revert ZeroAddress();

        vault        = _vault;
        underlying   = _underlying;
        protocolPool = _protocolPool;
        protocolId   = _protocolId;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }

    function totalAssets() external view override returns (uint256) {
        revert NotImplemented();
    }

    function maxWithdraw() external view override returns (uint256) {
        revert NotImplemented();
    }

    function deposit(uint256 amount) external override onlyVault returns (uint256 supplied) {
        revert NotImplemented();
    }

    function withdraw(uint256 amount) external override onlyVault returns (uint256 withdrawn) {
        revert NotImplemented();
    }

    function withdrawAll() external override onlyVault returns (uint256 withdrawn) {
        revert NotImplemented();
    }
}
