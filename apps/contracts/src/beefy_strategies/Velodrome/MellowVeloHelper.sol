// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interface/common/ISolidlyGauge.sol";
import "./IMellow.sol";

contract MellowVeloHelper {
    ISolidlyGauge public reward = ISolidlyGauge(0x940181a94A35A4569E4529A3CDfB74e38FD98631);

    function rewardRate(address[] calldata lps) public view returns (uint256[] memory) {
        uint256[] memory rates = new uint256[](lps.length);
        for (uint256 j = 0; j < lps.length; j++) {
            IMellowLpWrapper lp = IMellowLpWrapper(lps[j]);
            IMellowCore core = IMellowCore(lp.core());
            IMellowCore.ManagedPositionInfo memory pos = core.managedPositionAt(lp.positionId());
            ISolidlyGauge gauge = ISolidlyGauge(ICLPool(lp.pool()).gauge());

            uint256 rate;
            for (uint256 i = 0; i < pos.ammPositionIds.length; i++) {
                uint256 tokenId = pos.ammPositionIds[i];
                uint256 earned = gauge.earned(address(core), tokenId);
                uint256 prevTime = gauge.lastUpdateTime(tokenId);
                rate += earned / (block.timestamp - prevTime);
            }
            rates[j] = rate;
        }
        return rates;
    }

    function rewardRateNew(address[] calldata lps) public returns (uint256[] memory rates, uint256[] memory periods) {
        rates = new uint256[](lps.length);
        periods = new uint256[](lps.length);
        for (uint256 j = 0; j < lps.length; j++) {
            IMellowLpWrapper lp = IMellowLpWrapper(lps[j]);

            uint256 before = reward.balanceOf(address(lp));
            lp.collectRewards();
            uint256 earned = reward.balanceOf(address(lp)) - before;

            uint256 lastIndex = lp.timestampToRewardRatesIndex(block.timestamp);
            (uint256 prevTime,) = lp.rewardRates(lastIndex - 1);
            periods[j] = block.timestamp - prevTime;

            rates[j] = earned / (block.timestamp - prevTime);
        }
    }
}
