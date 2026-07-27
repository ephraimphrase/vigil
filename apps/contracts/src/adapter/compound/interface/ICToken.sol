// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Shared by CompoundV2Adapter (mints/redeems directly) and
// MorphoCompoundAdapter (only reads underlying()/getCash() to identify and
// gauge liquidity for the Compound market Morpho is routing through) - both
// point this at the same real cToken contract.
interface ICToken is IERC20 {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function exchangeRateStored() external view returns (uint256);
    function getCash() external view returns (uint256);
    function underlying() external view returns (address);
}
