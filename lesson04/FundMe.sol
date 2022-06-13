// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error Unauthorized();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address public immutable i_owner;
    address[] public funders;
    mapping(address => uint256) public addressToDonations;

    constructor() {
        i_owner = msg.sender;
    }

    modifier onlyOwner {
        if (msg.sender != i_owner) {
            revert Unauthorized();
        }
        _;
    }

    function fund() public payable {
        require(msg.value.getConversionRate() >= MINIMUM_USD, "Must send at least $50 in ETH");
        if (addressToDonations[msg.sender] == 0) {
            funders.push(msg.sender);
        }
        addressToDonations[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (uint i = 0; i < funders.length; i++) {
            addressToDonations[funders[i]] = 0;
        }
        funders = new address[](0);
        (bool callSuccess,) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}