// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// The subset of the strategy surface every Common/ strategy exposes
// identically, regardless of protocol - both StratFeeManagerInitializable-
// based and BaseAllToNativeFactoryStrat-based strategies satisfy this
// without modification. BeefyStrategyAdapter only ever calls through this,
// so it never needs to know which protocol a given strategy targets.
interface IBeefyStrategyLike {
    function want() external view returns (address);
    function balanceOf() external view returns (uint256);
    function deposit() external;
    function withdraw(uint256 amount) external;
    function retireStrat() external;
    // Permissionless on every Common/ strategy - anyone can trigger a
    // compound, which is what funds the `call` fee incentive. No special
    // trust needed for the adapter to call this on the strategy's behalf.
    function harvest() external;
}
