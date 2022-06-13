// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getUsdPrice() internal view returns (uint256) {
        // contract (Rinkeby): 	0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        // see contract addresses: https://docs.chain.link/docs/ethereum-addresses/
        AggregatorV3Interface priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
        (, int price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 1e10);
    }

    function getPriceFeedVersion() internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
        return priceFeed.version();
    }

    function getConversionRate(uint256 ethAmount) internal view returns (uint256) {
        uint256 ethPriceInUsd = getUsdPrice();
        return (ethAmount * ethPriceInUsd) / 1e18;
    }
}