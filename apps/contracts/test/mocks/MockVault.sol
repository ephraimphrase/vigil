// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// 1:1 share vault — deposits/redeems move the underlying asset and mint/burn
// shares at parity, so expected amounts in tests are exact round numbers.
contract MockVault is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable assetToken;

    constructor(IERC20 _asset) ERC20("Vigil Vault Shares", "vgWETH") {
        assetToken = _asset;
    }

    function asset() external view returns (address) {
        return address(assetToken);
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        assetToken.safeTransferFrom(msg.sender, address(this), assets);
        shares = assets;
        _mint(receiver, shares);
    }

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets) {
        if (owner != msg.sender) _spendAllowance(owner, msg.sender, shares);
        _burn(owner, shares);
        assets = shares;
        assetToken.safeTransfer(receiver, assets);
    }
}
