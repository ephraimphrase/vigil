// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title WETH9
/// @notice Canonical wrapped-ETH pattern: 1:1 backed, deposit ETH to mint WETH,
/// burn WETH to withdraw ETH. For local/testnet deployment only — mainnet and
/// most L2s already have a canonical WETH deployed; this won't be recognized as
/// "the" WETH by any existing protocol, so don't use it to replace that.
contract WETH9 is ERC20 {
    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed sender, uint256 amount);

    constructor() ERC20("Wrapped Ether", "WETH") {}

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "WETH9: ETH transfer failed");
    }
}
