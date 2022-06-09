// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Token {
    string public name = "My Hardhat Token";
    string public symbol = "MHT";

    uint256 public totalSupply = 1e6;
    address public owner;
    mapping(address => uint256) balances;

    constructor() {
        balances[msg.sender] = totalSupply;
        owner = msg.sender;
    }

    function transfer(address to, uint256 amount) external {
        require(
            balances[msg.sender] >= amount,
            "Not enough tokens to transfer"
        );
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    function balanceOf(address addr) external view returns (uint256) {
        return balances[addr];
    }
}