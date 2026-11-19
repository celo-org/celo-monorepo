// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.9.0;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/ChainlinkOracleAdapter.sol";

contract MockAggregator is IChainlinkAggregator {
  uint8 public decimals;
  int256 public answer;
  uint256 public updatedAt;

  constructor(uint8 _decimals, int256 _answer) {
    decimals = _decimals;
    set(_answer, block.timestamp);
  }

  function set(int256 _answer, uint256 _updatedAt) public {
    answer = _answer;
    updatedAt = _updatedAt;
  }

  function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
    return (1, answer, updatedAt, updatedAt, 1);
  }
}

contract ChainlinkOracleAdapterBase is Test {
  uint32 constant MAX_AGE = 1 hours;

  ChainlinkOracleAdapter adapter;
  MockAggregator celoUsd;
  MockAggregator eurUsd;
  address token = address(0x1234);
  address nonOwner;

  event FeedsSet(address indexed token, ChainlinkOracleAdapter.Feed[] feeds);

  function setUp() public virtual {
    vm.warp(1_800_000_000);
    nonOwner = actor("nonOwner");
    adapter = new ChainlinkOracleAdapter();
    celoUsd = new MockAggregator(8, 6_000_000); // 0.06 USD per CELO
    eurUsd = new MockAggregator(8, 120_000_000); // 1.20 USD per EUR
  }

  function feed(
    MockAggregator aggregator,
    bool invert
  ) internal pure returns (ChainlinkOracleAdapter.Feed memory) {
    return
      ChainlinkOracleAdapter.Feed({
        aggregator: address(aggregator),
        invert: invert,
        maxAge: MAX_AGE
      });
  }

  function one(
    ChainlinkOracleAdapter.Feed memory a
  ) internal pure returns (ChainlinkOracleAdapter.Feed[] memory feeds) {
    feeds = new ChainlinkOracleAdapter.Feed[](1);
    feeds[0] = a;
  }

  function two(
    ChainlinkOracleAdapter.Feed memory a,
    ChainlinkOracleAdapter.Feed memory b
  ) internal pure returns (ChainlinkOracleAdapter.Feed[] memory feeds) {
    feeds = new ChainlinkOracleAdapter.Feed[](2);
    feeds[0] = a;
    feeds[1] = b;
  }
}

contract ChainlinkOracleAdapterTest_setFeeds is ChainlinkOracleAdapterBase {
  function test_ShouldStoreFeeds() public {
    adapter.setFeeds(token, two(feed(celoUsd, false), feed(eurUsd, true)));

    ChainlinkOracleAdapter.Feed[] memory stored = adapter.getFeeds(token);
    assertEq(stored.length, 2);
    assertEq(stored[0].aggregator, address(celoUsd));
    assertEq(stored[0].invert, false);
    assertEq(stored[1].aggregator, address(eurUsd));
    assertEq(stored[1].invert, true);
    assertEq(stored[1].maxAge, MAX_AGE);
  }

  function test_ShouldEmitFeedsSet() public {
    ChainlinkOracleAdapter.Feed[] memory feeds = one(feed(celoUsd, false));
    vm.expectEmit(true, true, true, true);
    emit FeedsSet(token, feeds);
    adapter.setFeeds(token, feeds);
  }

  function test_ShouldReplaceExistingFeeds() public {
    adapter.setFeeds(token, two(feed(celoUsd, false), feed(eurUsd, true)));
    adapter.setFeeds(token, one(feed(celoUsd, false)));

    assertEq(adapter.getFeeds(token).length, 1);
  }

  function test_ShouldRemoveToken_WhenFeedsEmpty() public {
    adapter.setFeeds(token, one(feed(celoUsd, false)));
    adapter.setFeeds(token, new ChainlinkOracleAdapter.Feed[](0));

    assertEq(adapter.getFeeds(token).length, 0);
    vm.expectRevert("Token not configured");
    adapter.getExchangeRate(token);
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    adapter.setFeeds(token, one(feed(celoUsd, false)));
  }

  function test_Reverts_WhenTooManyFeeds() public {
    ChainlinkOracleAdapter.Feed[] memory feeds = new ChainlinkOracleAdapter.Feed[](5);
    for (uint256 i = 0; i < feeds.length; i++) {
      feeds[i] = feed(celoUsd, false);
    }
    vm.expectRevert("Too many feeds");
    adapter.setFeeds(token, feeds);
  }

  function test_Reverts_WhenAggregatorIsZero() public {
    ChainlinkOracleAdapter.Feed[] memory feeds = one(feed(celoUsd, false));
    feeds[0].aggregator = address(0);
    vm.expectRevert("Aggregator cannot be zero");
    adapter.setFeeds(token, feeds);
  }

  function test_Reverts_WhenMaxAgeIsZero() public {
    ChainlinkOracleAdapter.Feed[] memory feeds = one(feed(celoUsd, false));
    feeds[0].maxAge = 0;
    vm.expectRevert("Max age cannot be zero");
    adapter.setFeeds(token, feeds);
  }

  function test_Reverts_WhenFeedDoesNotYieldRate() public {
    celoUsd.set(0, block.timestamp);
    vm.expectRevert("Invalid price");
    adapter.setFeeds(token, one(feed(celoUsd, false)));
  }

  function test_ShouldAllowRaisingMaxAge_WhenFeedIsStale() public {
    adapter.setFeeds(token, one(feed(celoUsd, false)));
    vm.warp(block.timestamp + MAX_AGE + 1);
    vm.expectRevert("Stale price");
    adapter.getExchangeRate(token);

    ChainlinkOracleAdapter.Feed[] memory feeds = one(feed(celoUsd, false));
    feeds[0].maxAge = 2 * MAX_AGE;
    adapter.setFeeds(token, feeds);

    (uint256 numerator, ) = adapter.getExchangeRate(token);
    assertEq(numerator, 0.06e24);
  }

  function test_Reverts_WhenAggregatorIsNotAContract() public {
    ChainlinkOracleAdapter.Feed[] memory feeds = one(feed(celoUsd, false));
    feeds[0].aggregator = address(0xdead);
    vm.expectRevert();
    adapter.setFeeds(token, feeds);
  }
}

contract ChainlinkOracleAdapterTest_getExchangeRate is ChainlinkOracleAdapterBase {
  function test_ShouldReturnTokenPerCelo_WhenSingleFeed() public {
    adapter.setFeeds(token, one(feed(celoUsd, false)));

    (uint256 numerator, uint256 denominator) = adapter.getExchangeRate(token);
    assertEq(numerator, 0.06e24);
    assertEq(denominator, 1e24);
  }

  function test_ShouldComposeInvertedFeed() public {
    // 0.06 USD per CELO / 1.20 USD per EUR = 0.05 EUR per CELO
    adapter.setFeeds(token, two(feed(celoUsd, false), feed(eurUsd, true)));

    (uint256 numerator, uint256 denominator) = adapter.getExchangeRate(token);
    assertEq(numerator, 0.05e24);
    assertEq(denominator, 1e24);
  }

  function test_ShouldHandleFeedsWithDifferentDecimals() public {
    MockAggregator usdJpy = new MockAggregator(18, 150e18); // 150 JPY per USD
    adapter.setFeeds(token, two(feed(celoUsd, false), feed(usdJpy, false)));

    (uint256 numerator, uint256 denominator) = adapter.getExchangeRate(token);
    assertEq(numerator, 9e24);
    assertEq(denominator, 1e24);
  }

  function test_ShouldReturnRate_WhenAgeEqualsMaxAge() public {
    adapter.setFeeds(token, one(feed(celoUsd, false)));
    vm.warp(block.timestamp + MAX_AGE);

    (uint256 numerator, ) = adapter.getExchangeRate(token);
    assertEq(numerator, 0.06e24);
  }

  function test_ShouldComposeMaxFeeds() public {
    // 0.06 * 1.2 / 1.2 * 1.2 = 0.072
    ChainlinkOracleAdapter.Feed[] memory feeds = new ChainlinkOracleAdapter.Feed[](4);
    feeds[0] = feed(celoUsd, false);
    feeds[1] = feed(eurUsd, false);
    feeds[2] = feed(eurUsd, true);
    feeds[3] = feed(eurUsd, false);
    adapter.setFeeds(token, feeds);

    (uint256 numerator, ) = adapter.getExchangeRate(token);
    assertEq(numerator, 0.072e24);
  }

  function test_ShouldNotOverflow_WhenManyHighDecimalFeeds() public {
    MockAggregator half = new MockAggregator(18, 0.5e18);
    ChainlinkOracleAdapter.Feed[] memory feeds = new ChainlinkOracleAdapter.Feed[](4);
    for (uint256 i = 0; i < feeds.length; i++) {
      feeds[i] = feed(half, false);
    }
    adapter.setFeeds(token, feeds);

    (uint256 numerator, ) = adapter.getExchangeRate(token);
    assertEq(numerator, 0.0625e24);
  }

  function test_Reverts_WhenTokenNotConfigured() public {
    vm.expectRevert("Token not configured");
    adapter.getExchangeRate(token);
  }

  function test_Reverts_WhenAnyFeedIsStale() public {
    adapter.setFeeds(token, two(feed(celoUsd, false), feed(eurUsd, true)));
    vm.warp(block.timestamp + MAX_AGE + 1);
    celoUsd.set(6_000_000, block.timestamp);

    vm.expectRevert("Stale price");
    adapter.getExchangeRate(token);
  }

  function test_Reverts_WhenPriceIsNegative() public {
    adapter.setFeeds(token, one(feed(celoUsd, false)));
    celoUsd.set(-1, block.timestamp);

    vm.expectRevert("Invalid price");
    adapter.getExchangeRate(token);
  }

  function test_Reverts_WhenRateRoundsToZero() public {
    MockAggregator huge = new MockAggregator(0, 1e30);
    adapter.setFeeds(token, one(feed(celoUsd, false)));
    celoUsd.set(1, block.timestamp);
    ChainlinkOracleAdapter.Feed[] memory feeds = two(feed(celoUsd, false), feed(huge, true));

    vm.expectRevert("Rate rounds to zero");
    adapter.setFeeds(token, feeds);
  }

  function testFuzz_ShouldMatchDirectDivision(uint64 celoPrice, uint64 quotePrice) public {
    vm.assume(celoPrice > 0 && quotePrice > 0);
    celoUsd.set(int256(uint256(celoPrice)), block.timestamp);
    eurUsd.set(int256(uint256(quotePrice)), block.timestamp);
    uint256 expected = (uint256(celoPrice) * 1e24) / uint256(quotePrice);
    vm.assume(expected > 0);

    adapter.setFeeds(token, two(feed(celoUsd, false), feed(eurUsd, true)));
    (uint256 numerator, uint256 denominator) = adapter.getExchangeRate(token);
    assertEq(numerator, expected);
    assertEq(denominator, 1e24);
  }
}
