// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MockERC20} from "./MockERC20.sol";

// Minimal stand-in for a Common/ strategy's IBeefyStrategyLike surface -
// holds `want` 1:1 with no external venue. `want()` returns address(0) until
// initialize() runs, mirroring how a real BaseAllToNativeFactoryStrat/
// StratFeeManagerInitializable strategy's `want` stays unset until its own
// initializer executes.
contract MockBeefyStrategy {
    using SafeERC20 for IERC20;

    IERC20 public wantToken;
    bool public initialized;
    uint256 public retireStratCalls;
    uint256 public gainOnHarvest;
    uint256 public lossOnHarvest;

    function initialize(MockERC20 _want) external {
        wantToken = IERC20(address(_want));
        initialized = true;
    }

    function want() external view returns (address) {
        return initialized ? address(wantToken) : address(0);
    }

    function balanceOf() external view returns (uint256) {
        return wantToken.balanceOf(address(this));
    }

    function deposit() external {}

    function withdraw(uint256 amount) external {
        wantToken.safeTransfer(msg.sender, amount);
    }

    function retireStrat() external {
        retireStratCalls++;
        wantToken.safeTransfer(msg.sender, wantToken.balanceOf(address(this)));
    }

    // Materializes a reward mid-harvest() (rather than being pre-funded by
    // the test) so the adapter's before/after totalAssets() snapshot around
    // _strategy.harvest() actually observes a delta - the real adapter code
    // takes its "before" snapshot after any prior transfer has already
    // landed, so a gain has to happen during the call to be measurable.
    function setGainOnHarvest(uint256 amount) external {
        gainOnHarvest = amount;
    }

    function setLossOnHarvest(uint256 amount) external {
        lossOnHarvest = amount;
    }

    function harvest() external {
        if (gainOnHarvest > 0) {
            MockERC20(address(wantToken)).mint(address(this), gainOnHarvest);
            gainOnHarvest = 0;
        }
        if (lossOnHarvest > 0) {
            wantToken.safeTransfer(address(0xdead), lossOnHarvest);
            lossOnHarvest = 0;
        }
    }
}
