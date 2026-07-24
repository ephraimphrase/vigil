// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract SeedToken is Initializable, ERC20 {
    string private _tokenName;
    string private _tokenSymbol;

    constructor() ERC20("", "") {
        _disableInitializers();
    }

    function initialize(string calldata name_, string calldata symbol_, uint256 initialSupply, address recipient)
        external
        initializer
    {
        _tokenName = name_;
        _tokenSymbol = symbol_;
        _mint(recipient, initialSupply);
    }

    function name() public view override returns (string memory) {
        return _tokenName;
    }

    function symbol() public view override returns (string memory) {
        return _tokenSymbol;
    }
}
