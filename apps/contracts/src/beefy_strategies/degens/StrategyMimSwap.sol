// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interface/common/IRewardPool.sol";
import "../interface/common/IERC20Extended.sol";
import "../Common/BaseAllToNativeFactoryStrat.sol";

interface IMimLp {
    function _BASE_TOKEN_() external view returns (address);
    function _QUOTE_TOKEN_() external view returns (address);
    function getReserves() external view returns (uint256 baseReserve, uint256 quoteReserve);
}

interface IMimRouter {
    function addLiquidity(
        address lp,
        address to,
        uint256 baseInAmount,
        uint256 quoteInAmount,
        uint256 minimumShares,
        uint256 deadline
    ) external returns (uint256, uint256, uint256);
}

contract StrategyMimSwap is BaseAllToNativeFactoryStrat {
    using SafeERC20 for IERC20;

    IRewardPool public gauge;
    address public mimRouter;
    address public lpToken0;
    address public lpToken1;

    function initialize(IRewardPool _gauge, address _router, address[] calldata _rewards, Addresses calldata _addresses)
        public
        initializer
    {
        __BaseStrategy_init(_addresses, _rewards);
        lpToken0 = IMimLp(want)._BASE_TOKEN_();
        lpToken1 = IMimLp(want)._QUOTE_TOKEN_();
        gauge = _gauge;
        mimRouter = _router;
        setHarvestOnDeposit(true);
    }

    function stratName() public pure override returns (string memory) {
        return "MimSwap";
    }

    function balanceOfPool() public view override returns (uint256) {
        return gauge.balanceOf(address(this));
    }

    function _deposit(uint256 amount) internal override {
        IERC20(want).forceApprove(address(gauge), amount);
        gauge.stake(amount);
    }

    function _withdraw(uint256 amount) internal override {
        gauge.withdraw(amount);
    }

    function _emergencyWithdraw() internal override {
        uint256 amount = balanceOfPool();
        if (amount > 0) {
            gauge.withdraw(amount);
        }
    }

    function _claim() internal override {
        gauge.getRewards();
    }

    function _verifyRewardToken(address token) internal view override {}

    function _swapNativeToWant() internal override {
        (uint256 toLp0, uint256 toLp1) = quoteAddLiquidity();

        if (lpToken0 != native) {
            _swap(native, lpToken0, toLp0);
        }
        if (lpToken1 != native) {
            _swap(native, lpToken1, toLp1);
        }

        uint256 lp0Bal = IERC20(lpToken0).balanceOf(address(this));
        uint256 lp1Bal = IERC20(lpToken1).balanceOf(address(this));
        IERC20(lpToken0).forceApprove(mimRouter, lp0Bal);
        IERC20(lpToken1).forceApprove(mimRouter, lp1Bal);
        IMimRouter(mimRouter).addLiquidity(want, address(this), lp0Bal, lp1Bal, 0, type(uint256).max);
    }

    function quoteAddLiquidity() internal view returns (uint256 toLp0, uint256 toLp1) {
        uint256 decimals0 = 10 ** IERC20Extended(lpToken0).decimals();
        uint256 decimals1 = 10 ** IERC20Extended(lpToken1).decimals();
        (uint256 reserve0, uint256 reserve1) = IMimLp(want).getReserves();
        reserve0 = reserve0 * 1e18 / decimals0;
        reserve1 = reserve1 * 1e18 / decimals1;

        uint256 nativeBal = IERC20(native).balanceOf(address(this));
        toLp0 = nativeBal * reserve0 / (reserve0 + reserve1);
        toLp1 = nativeBal - toLp0;
    }
}
