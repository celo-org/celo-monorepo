// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7 <0.9.0;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/utils/math/Math.sol";

import "./interfaces/IOracle.sol";

// Chainlink's AggregatorV3Interface.
interface IPriceFeed {
  function decimals() external view returns (uint8);

  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
}

/**
 * @title PriceFeedOracleAdapter
 * @notice IOracle pricing a token against CELO as the product of Chainlink-style feeds.
 * The rate is token per 1 CELO over 1e24. Like SortedOracles it serves the latest price
 * however old, and returns (0, 0) for an unknown token and a zero rate for a non-positive price.
 */
contract PriceFeedOracleAdapter is IOracle, Ownable {
  struct Feed {
    address aggregator;
    // Use 1 / price.
    bool invert;
    // The aggregator's decimals, read when the feed is set; any value passed in is ignored.
    uint8 decimals;
  }

  uint256 public constant RATE_DENOMINATOR = 1e24;
  uint256 public constant MAX_FEEDS = 4;

  mapping(address => Feed[]) private feeds;

  event FeedsSet(address indexed token, Feed[] feeds);

  error TooManyFeeds();
  error ZeroAggregator();
  error ZeroRate();

  /// @notice Replaces the feeds pricing a token; an empty list removes it.
  function setFeeds(address token, Feed[] calldata newFeeds) external onlyOwner {
    if (newFeeds.length > MAX_FEEDS) revert TooManyFeeds();

    delete feeds[token];
    for (uint256 i = 0; i < newFeeds.length; i++) {
      if (newFeeds[i].aggregator == address(0)) revert ZeroAggregator();
      Feed memory newFeed = newFeeds[i];
      newFeed.decimals = IPriceFeed(newFeed.aggregator).decimals();
      feeds[token].push(newFeed);
    }

    if (newFeeds.length > 0) {
      (uint256 numerator, ) = getExchangeRate(token);
      if (numerator == 0) revert ZeroRate();
    }
    emit FeedsSet(token, feeds[token]);
  }

  function getFeeds(address token) external view returns (Feed[] memory) {
    return feeds[token];
  }

  /// @notice Returns token per 1 CELO as numerator / RATE_DENOMINATOR.
  function getExchangeRate(
    address token
  ) public view returns (uint256 numerator, uint256 denominator) {
    Feed[] memory tokenFeeds = feeds[token];
    if (tokenFeeds.length == 0) return (0, 0);

    numerator = RATE_DENOMINATOR;
    for (uint256 i = 0; i < tokenFeeds.length; i++) {
      (, int256 answer, , , ) = IPriceFeed(tokenFeeds[i].aggregator).latestRoundData();
      if (answer <= 0) return (0, RATE_DENOMINATOR);

      uint256 price = uint256(answer);
      uint256 unit = 10 ** uint256(tokenFeeds[i].decimals);
      numerator = tokenFeeds[i].invert
        ? Math.mulDiv(numerator, unit, price)
        : Math.mulDiv(numerator, price, unit);
    }

    denominator = RATE_DENOMINATOR;
  }
}
