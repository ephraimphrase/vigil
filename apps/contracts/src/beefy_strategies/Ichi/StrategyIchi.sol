// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ichi.sol";
import "../interface/common/IRewardPool.sol";
import "../Common/BaseAllToNativeFactoryStrat.sol";
import {IMerklClaimer} from "../interface/merkl/IMerklClaimer.sol";

contract StrategyIchi is BaseAllToNativeFactoryStrat {
    using SafeERC20 for IERC20;

    IRewardPool public gauge;
    address public lpToken0;
    address public lpToken1;

    function initialize(
        address _gauge,
        bool _harvestOnDeposit,
        address[] calldata _rewards,
        Addresses calldata _addresses
    ) public initializer {
        __BaseStrategy_init(_addresses, _rewards);
        gauge = IRewardPool(_gauge);
        if (_harvestOnDeposit) setHarvestOnDeposit(true);

        lpToken0 = IchiVault(want).token0();
        lpToken1 = IchiVault(want).token1();
    }

    function stratName() public pure override returns (string memory) {
        return "Ichi";
    }

    function balanceOfPool() public view override returns (uint256) {
        return gauge.balanceOf(address(this));
    }

    function _deposit(uint256 amount) internal override {
        IERC20(want).forceApprove(address(gauge), amount);
        gauge.deposit(amount);
    }

    function _withdraw(uint256 amount) internal override {
        if (amount > 0) {
            gauge.withdraw(amount);
        }
    }

    function _emergencyWithdraw() internal override {
        uint256 amount = balanceOfPool();
        if (amount > 0) {
            if (gauge.emergency()) gauge.emergencyWithdraw();
            else gauge.withdraw(amount);
        }
    }

    function _claim() internal override {
        gauge.getReward();
    }

    function _verifyRewardToken(address token) internal view override {}

    function _swapNativeToWant() internal override {
        if (depositToken != native) {
            _swap(native, depositToken);
        }
        uint256 depositBal = IERC20(depositToken).balanceOf(address(this));

        uint256 amount0 = depositToken == lpToken0 ? depositBal : 0;
        uint256 amount1 = depositToken == lpToken1 ? depositBal : 0;

        IERC20(depositToken).forceApprove(want, depositBal);
        IchiVault(want).deposit(amount0, amount1, address(this));
    }

    function merklClaim(
        address claimer,
        address[] calldata users,
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes32[][] calldata proofs
    ) external {
        IMerklClaimer(claimer).claim(users, tokens, amounts, proofs);
    }
}
