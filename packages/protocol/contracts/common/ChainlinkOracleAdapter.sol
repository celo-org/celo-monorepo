// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7 <0.9.0;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/utils/math/Math.sol";

import "./interfaces/IOracle.sol";

interface IChainlinkAggregator {
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
 * @title ChainlinkOracleAdapter
 * @notice IOracle that prices a token against CELO straight from Chainlink aggregators,
 * with no relayer or keeper in between.
 *
 * The rate for a token is the product of its configured feeds, each optionally inverted.
 * The product must come out as "token units per 1 CELO", the same meaning as
 * SortedOracles.medianRate(token), and it is returned over the same 1e24 denominator,
 * so the adapter is a drop-in oracle for FeeCurrencyDirectory and EpochManager.
 *
 * Examples:
 *   USD stable: [CELO/USD]
 *   EUR stable: [CELO/USD, EUR/USD inverted]
 *
 * Like SortedOracles, the rate is a price ratio between whole units: it is not rescaled
 * for token decimals, so tokens that are not 18-decimal go through their fee adapter.
 *
 * Unlike SortedOracles, a stale or non-positive price reverts instead of being served.
 */
contract ChainlinkOracleAdapter is IOracle, Ownable {
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

  mapping(address => Feed[]) private feeds;

  event FeedsSet(address indexed token, Feed[] feeds);

  /**
   * @notice Replaces the feeds used to price a token. An empty list removes the token.
   * @dev Reverts unless the new feeds yield a rate, which rejects addresses that are not
   * aggregators. Freshness is not checked here, so that a larger maxAge can still be
   * set while a feed is stale and getExchangeRate is reverting.
   * @param token The token to price, as passed to getExchangeRate.
   * @param newFeeds Feeds whose product is the amount of token per 1 CELO.
   */
  function setFeeds(address token, Feed[] calldata newFeeds) external onlyOwner {
    require(newFeeds.length <= MAX_FEEDS, "Too many feeds");

    delete feeds[token];
    for (uint256 i = 0; i < newFeeds.length; i++) {
      require(newFeeds[i].aggregator != address(0), "Aggregator cannot be zero");
      require(newFeeds[i].maxAge > 0, "Max age cannot be zero");
      feeds[token].push(newFeeds[i]);
    }

    if (newFeeds.length > 0) {
      rate(token, false);
    }
    emit FeedsSet(token, newFeeds);
  }

  /**
   * @notice Returns the feeds configured for a token.
   */
  function getFeeds(address token) external view returns (Feed[] memory) {
    return feeds[token];
  }

  /**
   * @notice Returns the amount of token per 1 CELO as numerator / denominator.
   * @dev Reverts if the token is not configured or any feed is stale or non-positive.
   * Each feed is folded in at 1e24 precision with a full-width multiply, so the running
   * rate never needs more room than the rate itself.
   * @param token The token to price.
   * @return numerator The rate scaled by RATE_DENOMINATOR.
   * @return denominator Always RATE_DENOMINATOR.
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
    require(tokenFeeds.length > 0, "Token not configured");

    numerator = RATE_DENOMINATOR;
    for (uint256 i = 0; i < tokenFeeds.length; i++) {
      IChainlinkAggregator aggregator = IChainlinkAggregator(tokenFeeds[i].aggregator);
      (, int256 answer, , uint256 updatedAt, ) = aggregator.latestRoundData();
      require(answer > 0, "Invalid price");
      require(!requireFresh || updatedAt + tokenFeeds[i].maxAge >= block.timestamp, "Stale price");

      uint256 price = uint256(answer);
      uint256 unit = 10 ** uint256(aggregator.decimals());
      numerator = tokenFeeds[i].invert
        ? Math.mulDiv(numerator, unit, price)
        : Math.mulDiv(numerator, price, unit);
    }

    denominator = RATE_DENOMINATOR;
    require(numerator > 0, "Rate rounds to zero");
  }
}
