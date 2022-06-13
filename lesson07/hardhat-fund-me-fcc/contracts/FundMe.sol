// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error FundMe__Unauthorized();

/**
 @title A contract for crown funding
 @notice This contract is to demo a sample funding contract
 @dev This implements price feeds as our library
 */
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address private immutable i_owner;
    address[] public s_funders;
    mapping(address => uint256) private s_addressToDonations;
    AggregatorV3Interface public s_priceFeed;

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__Unauthorized();
        }
        _;
    }

    constructor(address priceConverterContract) {
        s_priceFeed = AggregatorV3Interface(priceConverterContract);
        i_owner = msg.sender;
    }

    receive() external payable {
        //fund();
        require(3 == 4, "You called receive");
    }

    fallback() external payable {
        //fund();
        require(1 == 2, "You called fallback");
    }

    function funders(uint256 i) public view returns (address) {
        return s_funders[i];
    }

    function priceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function fund() public payable {
        if (!(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD)) {
            revert("Must send at least $50 in ETH");
        }

        if (s_addressToDonations[msg.sender] == 0) {
            s_funders.push(msg.sender);
        }
        s_addressToDonations[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (uint256 i = 0; i < s_funders.length; i++) {
            s_addressToDonations[s_funders[i]] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory m_funders = s_funders;
        uint256 length = m_funders.length;
        for (uint256 i = 0; i < length; i++) {
            s_addressToDonations[m_funders[i]] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getAddressToDonations(address addr) public view returns (uint256) {
        return s_addressToDonations[addr];
    }
}
