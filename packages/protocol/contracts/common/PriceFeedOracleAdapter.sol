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
 * The rate is token per 1 CELO over 1e24; a stale or non-positive price reverts.
 */
contract PriceFeedOracleAdapter is IOracle, Ownable {
  struct Feed {
    address aggregator;
    // Use 1 / price.
    bool invert;
    // Seconds a price stays valid; set above the feed's heartbeat.
    uint32 maxAge;
  }

  uint256 public constant RATE_DENOMINATOR = 1e24;
  uint256 public constant MAX_FEEDS = 4;

  mapping(address => Feed[]) private feeds;

  event FeedsSet(address indexed token, Feed[] feeds);

  error TooManyFeeds();
  error ZeroAggregator();
  error ZeroMaxAge();
  error TokenNotConfigured(address token);
  error InvalidPrice(address aggregator);
  error StalePrice(address aggregator);
  error RateRoundsToZero();

  /// @notice Replaces the feeds pricing a token; an empty list removes it.
  function setFeeds(address token, Feed[] calldata newFeeds) external onlyOwner {
    if (newFeeds.length > MAX_FEEDS) revert TooManyFeeds();

    delete feeds[token];
    for (uint256 i = 0; i < newFeeds.length; i++) {
      if (newFeeds[i].aggregator == address(0)) revert ZeroAggregator();
      if (newFeeds[i].maxAge == 0) revert ZeroMaxAge();
      feeds[token].push(newFeeds[i]);
    }

    if (newFeeds.length > 0) {
      rate(token, false);
    }
    emit FeedsSet(token, newFeeds);
  }

  function getFeeds(address token) external view returns (Feed[] memory) {
    return feeds[token];
  }

  /// @notice Returns token per 1 CELO as numerator / RATE_DENOMINATOR.
  function getExchangeRate(
    address token
  ) external view returns (uint256 numerator, uint256 denominator) {
    return rate(token, true);
  }

  function rate(
    address token,
    bool requireFresh
  ) private view returns (uint256 numerator, uint256 denominator) {
    Feed[] memory tokenFeeds = feeds[token];
    if (tokenFeeds.length == 0) revert TokenNotConfigured(token);

    numerator = RATE_DENOMINATOR;
    for (uint256 i = 0; i < tokenFeeds.length; i++) {
      IPriceFeed aggregator = IPriceFeed(tokenFeeds[i].aggregator);
      (, int256 answer, , uint256 updatedAt, ) = aggregator.latestRoundData();
      if (answer <= 0) revert InvalidPrice(address(aggregator));
      if (requireFresh && updatedAt + tokenFeeds[i].maxAge < block.timestamp) {
        revert StalePrice(address(aggregator));
      }

      uint256 price = uint256(answer);
      uint256 unit = 10 ** uint256(aggregator.decimals());
      numerator = tokenFeeds[i].invert
        ? Math.mulDiv(numerator, unit, price)
        : Math.mulDiv(numerator, price, unit);
    }

    denominator = RATE_DENOMINATOR;
    if (numerator == 0) revert RateRoundsToZero();
  }
}
