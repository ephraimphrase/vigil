// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVigilProtocolAdapter} from "../IVigilProtocolAdapter.sol";

// SKELETON - Gamma concentrated-liquidity vault optimization. Assets: USDC
// pairs (e.g. USDC/ETH).
// TODO: Gamma manages Uniswap V3 LP ranges - depositing a single stablecoin
// means it gets paired against a second asset inside the vault's range,
// which introduces impermanent loss the single-asset lending adapters here
// don't have to model. protocolPool should be the specific Gamma
// Hypervisor address for the chosen pair.
contract GammaAdapter is IVigilProtocolAdapter {
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
