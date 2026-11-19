// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7 <0.9.0;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/utils/math/Math.sol";

import "./interfaces/IOracle.sol";

// The price feed interface published by Chainlink (AggregatorV3Interface), which other
// providers such as RedStone implement as well.
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
 * @notice IOracle that prices a token against CELO straight from on-chain price feeds
 * (Chainlink aggregators or any feed with the same interface), with no relayer or
 * keeper in between.
 *
 * The rate for a token is the product of its configured feeds, each optionally inverted.
 * The product must come out as "whole tokens per 1 CELO", the same meaning as
 * SortedOracles.medianRate(token). For an 18-decimal token it is returned over the same
 * 1e24 denominator, so the adapter is a drop-in oracle for FeeCurrencyDirectory and
 * EpochManager.
 *
 * Examples:
 *   USD stable: [CELO/USD]
 *   EUR stable: [CELO/USD, EUR/USD inverted]
 *
 * The returned rate converts base units: tokenUnits = celoWei * numerator / denominator.
 * Each token is configured with its decimals, and a token that is not 18-decimal has
 * the difference folded into the rate. SortedOracles cannot do this, which is why such
 * tokens are priced there through an 18-decimal fee adapter.
 *
 * Unlike SortedOracles, a stale or non-positive price reverts instead of being served.
 */
contract PriceFeedOracleAdapter is IOracle, Ownable {
  struct Feed {
    address aggregator;
    // When true the feed contributes 1 / price instead of price.
    bool invert;
    // Seconds after its last update during which the feed's price is accepted. Set it
    // above the feed's heartbeat; FX feeds stop updating while their market is closed.
    uint32 maxAge;
  }

  uint256 public constant RATE_DENOMINATOR = 1e24;
  uint256 public constant MAX_FEEDS = 4;
  uint8 public constant CELO_DECIMALS = 18;
  uint8 public constant MAX_TOKEN_DECIMALS = 36;

  mapping(address => Feed[]) private feeds;
  mapping(address => uint8) private tokenDecimals;

  event FeedsSet(address indexed token, uint8 tokenDecimals, Feed[] feeds);

  error TooManyFeeds();
  error TokenDecimalsTooHigh();
  error ZeroAggregator();
  error ZeroMaxAge();
  error TokenNotConfigured(address token);
  error InvalidPrice(address aggregator);
  error StalePrice(address aggregator);
  error RateRoundsToZero();

  /**
   * @notice Replaces the decimals and feeds used to price a token. An empty feed list
   * removes the token.
   * @dev Reverts unless the new feeds yield a rate, which rejects addresses that are not
   * aggregators. Freshness is not checked here, so that a larger maxAge can still be
   * set while a feed is stale and getExchangeRate is reverting.
   * @param token The token to price, as passed to getExchangeRate.
   * @param newTokenDecimals Decimals of the token's base unit. Use 18 for a token that is
   * registered through an 18-decimal fee adapter.
   * @param newFeeds Feeds whose product is the amount of whole tokens per 1 CELO.
   */
  function setFeeds(
    address token,
    uint8 newTokenDecimals,
    Feed[] calldata newFeeds
  ) external onlyOwner {
    if (newFeeds.length > MAX_FEEDS) revert TooManyFeeds();
    if (newTokenDecimals > MAX_TOKEN_DECIMALS) revert TokenDecimalsTooHigh();

    delete feeds[token];
    tokenDecimals[token] = newFeeds.length > 0 ? newTokenDecimals : 0;
    for (uint256 i = 0; i < newFeeds.length; i++) {
      if (newFeeds[i].aggregator == address(0)) revert ZeroAggregator();
      if (newFeeds[i].maxAge == 0) revert ZeroMaxAge();
      feeds[token].push(newFeeds[i]);
    }

    if (newFeeds.length > 0) {
      rate(token, false);
    }
    emit FeedsSet(token, newTokenDecimals, newFeeds);
  }

  /**
   * @notice Returns the feeds configured for a token.
   */
  function getFeeds(address token) external view returns (Feed[] memory) {
    return feeds[token];
  }

  /**
   * @notice Returns the decimals configured for a token.
   */
  function getTokenDecimals(address token) external view returns (uint8) {
    return tokenDecimals[token];
  }

  /**
   * @notice Returns the rate from CELO to a token as numerator / denominator, in base
   * units of both: tokenUnits = celoWei * numerator / denominator.
   * @dev Reverts if the token is not configured or any feed is stale or non-positive.
   * Each feed is folded in at 1e24 precision with a full-width multiply, so the running
   * rate never needs more room than the rate itself.
   * @param token The token to price.
   * @return numerator The rate numerator.
   * @return denominator RATE_DENOMINATOR for an 18-decimal token.
   */
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

    if (numerator == 0) revert RateRoundsToZero();
    denominator = RATE_DENOMINATOR;

    // Scale whichever side keeps the result exact.
    uint8 decimals = tokenDecimals[token];
    if (decimals < CELO_DECIMALS) {
      denominator *= 10 ** uint256(CELO_DECIMALS - decimals);
    } else {
      numerator *= 10 ** uint256(decimals - CELO_DECIMALS);
    }
  }
}
