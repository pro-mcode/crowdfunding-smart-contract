// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    // Price feed safeguards
    uint256 internal constant STALE_PRICE_DELAY = 1 days;

    error PriceConverter__InvalidPrice();
    error PriceConverter__StalePrice(uint256 updatedAt);

    /// @notice Returns the latest ETH/USD price with 18 decimals
    /// @dev Normalizes feed decimals to 18 and validates for freshness
    function getPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        (, int256 answer,, uint256 updatedAt,) = priceFeed.latestRoundData();
        if (answer <= 0) revert PriceConverter__InvalidPrice();
        if (updatedAt == 0) revert PriceConverter__InvalidPrice();
        if (updatedAt > block.timestamp) revert PriceConverter__InvalidPrice();
        if (block.timestamp - updatedAt > STALE_PRICE_DELAY) revert PriceConverter__StalePrice(updatedAt);

        uint256 price = uint256(answer);
        uint8 decimals = priceFeed.decimals();
        if (decimals == 18) return price;
        if (decimals < 18) return price * (10 ** (18 - decimals));
        return price / (10 ** (decimals - 18));
    }

    /// @notice Converts an ETH amount to USD (18 decimals)
    /// @dev Assumes the feed is ETH/USD
    function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1000000000000000000;
        return ethAmountInUsd;
    }
}
