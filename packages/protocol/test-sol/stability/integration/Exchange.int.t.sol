// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test, console2 as console } from "celo-foundry/Test.sol";
import { TokenHelpers } from "../../utils/TokenHelpers.sol";

import { MedianDeltaBreaker } from "contracts/stability/MedianDeltaBreaker.sol";
import { BreakerBox } from "contracts/stability/BreakerBox.sol";

import { IRegistry } from "contracts/common/interfaces/IRegistry.sol";
import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { ISortedOracles } from "contracts/stability/interfaces/ISortedOracles.sol";

import { Exchange } from "contracts/stability/Exchange.sol";
import { SortedOracles } from "contracts/stability/SortedOracles.sol";
import { Proxy } from "contracts/common/Proxy.sol";
import { GoldToken } from "contracts/common/GoldToken.sol";
import { StableToken } from "contracts/stability/StableToken.sol";

// TODO: Remove after merge https://github.com/bowd/forge-std/pull/1
interface Cheats {
  function createFork(string calldata) external returns (uint256);

  function selectFork(uint256) external;

  function rpcUrl(string calldata) external returns (string memory);
}

contract ExchangeIntegrationTest is Test, TokenHelpers {
  // TODO: Remove after merge https://github.com/bowd/forge-std/pull/1
  Cheats constant cheats = Cheats(address(vm));

  IRegistry registry = IRegistry(0x000000000000000000000000000000000000ce10);

  // Events
  event ImplementationSet(address indexed implementation);
  event BreakerBoxUpdated(address indexed newBreakerBox);

  // New implementation contracts
  Exchange newExchange;
  SortedOracles newSortedOracles;

  // New CB contracts
  BreakerBox breakerBox;
  MedianDeltaBreaker breaker;
  uint256 threshold = 0.15 * 10**24; // 15%
  uint256 coolDownTime = 0;

  address alice;
  address governance;

  SortedOracles sortedOracles;
  GoldToken celoToken;
  StableToken cUSD;

  Exchange testee;

  function setUp() public {
    // Setup fork
    cheats.selectFork(cheats.createFork(cheats.rpcUrl("celo_mainnet")));

    // Setup addresses
    alice = actor("alice");
    governance = registry.getAddressForOrDie(keccak256(abi.encodePacked("Governance")));
    changePrank(governance);

    deployAndInit();
    updateProxyImplementations();

    celoToken = GoldToken(registry.getAddressForOrDie(keccak256(abi.encodePacked("GoldToken"))));
    cUSD = StableToken(testee.stable());

    // Setup Breaker Box
    breakerBox.addBreaker(address(breaker), 1);
    breakerBox.addExchange(address(testee));

    vm.expectEmit(true, false, false, false);
    emit BreakerBoxUpdated(address(breakerBox));
    testee.setBreakerBox(breakerBox);

    vm.expectEmit(true, false, false, false);
    emit BreakerBoxUpdated(address(breakerBox));
    sortedOracles.setBreakerBox(breakerBox);

    // Get tokens
    uint256 oneK = 1000 * 10**18;
    mint(celoToken, alice, oneK);
    mint(StableToken(testee.stable()), alice, oneK);

    changePrank(alice);
    celoToken.approve(address(testee), oneK);
    cUSD.approve(address(testee), oneK);
  }

  function toPayable(address inputAddress) public pure returns (address payable) {
    return address(uint160(inputAddress));
  }

  /**
   * @notice Helper function to deploy new & updated contracts.
   */
  function deployAndInit() public {
    // Deploy new contracts
    breaker = new MedianDeltaBreaker(address(registry), coolDownTime, threshold);
    breakerBox = new BreakerBox(true);
    newExchange = new Exchange(true);
    newSortedOracles = new SortedOracles(true);

    // Initilize contracts
    breakerBox.initilize(new address[](0), address(registry));
  }

  /**
   * @notice Helper function to set proxy implementations to newly deployed contracta
   */
  function updateProxyImplementations() public {
    // Proxies
    Proxy exchangeProxy;
    Proxy sortedOraclesProxy;

    // Get references to existing proxies
    address payable exchangeProxyAddress = toPayable(
      registry.getAddressForOrDie(keccak256(abi.encodePacked("Exchange")))
    );
    exchangeProxy = Proxy(exchangeProxyAddress);

    address payable sortedOraclesProxyAddress = toPayable(
      registry.getAddressForOrDie(keccak256(abi.encodePacked("SortedOracles")))
    );
    sortedOraclesProxy = Proxy(sortedOraclesProxyAddress);

    //Change implementations
    vm.expectEmit(true, false, false, false);
    emit ImplementationSet(address(newExchange));
    exchangeProxy._setImplementation(address(newExchange));
    testee = Exchange(exchangeProxyAddress);

    vm.expectEmit(true, false, false, false);
    emit ImplementationSet(address(newSortedOracles));
    sortedOraclesProxy._setImplementation(address(newSortedOracles));
    sortedOracles = SortedOracles(sortedOraclesProxyAddress);
  }

  function getLesserAndGreaterKeys(address stable, uint256 reportValue, address oracle)
    public
    view
    returns (address lesser, address greater)
  {
    (address[] memory oracles, uint256[] memory oracleRates, ) = sortedOracles.getRates(stable);

    for (uint256 i = 0; i < oracleRates.length; i++) {
      if (oracles[i] != oracle) {
        if (oracleRates[i] <= reportValue) {
          lesser = oracles[i];
          break;
        }
        greater = oracles[i];
      }
    }
  }

  /**
   * @notice This function will submit reports from all oracles to move the median up or down by the given percentage
   * @dev percent is multiplied by 10 ** 24
   */
  function moveMedianWithOracleReports(uint256 percent, bool increase) public {
    uint256 percentChange;

    if (increase) {
      percentChange = ((1 * 10**24) + percent);
    } else {
      percentChange = ((1 * 10**24) - percent);
    }

    (uint256 currentMedian, ) = sortedOracles.medianRate(address(cUSD));
    uint256 newMedian = (currentMedian * percentChange) / 10**24;

    address[] memory oracles = sortedOracles.getOracles(address(cUSD));

    for (uint256 i = 0; i < oracles.length; i++) {
      address thisOracle = oracles[i];
      changePrank(thisOracle);

      (address lesser, address greater) = getLesserAndGreaterKeys(
        address(cUSD),
        newMedian,
        thisOracle
      );

      sortedOracles.report(address(cUSD), newMedian, lesser, greater);
    }
  }

  function sell(bool sellCelo) public {
    uint256 sellAmount = 500 * 10**18;
    uint256 expectedOut = testee.getBuyTokenAmount(sellAmount, sellCelo);

    uint256 celoBalanceBefore = celoToken.balanceOf(alice);
    uint256 cUSDBalanceBefore = cUSD.balanceOf(alice);

    testee.sell(sellAmount, expectedOut, sellCelo);

    uint256 celoBalanceAfter = celoToken.balanceOf(alice);
    uint256 cUSDBalanceAfter = cUSD.balanceOf(alice);

    if (sellCelo) {
      assertTrue(celoBalanceBefore - celoBalanceAfter == sellAmount);
      assertTrue(cUSDBalanceAfter - cUSDBalanceBefore >= expectedOut);
    } else {
      assertTrue(cUSDBalanceBefore - cUSDBalanceAfter == sellAmount);
      assertTrue(celoBalanceAfter - celoBalanceBefore >= expectedOut);
    }
  }

  function buy(bool buyCelo) public {
    uint256 celoBalanceBefore = celoToken.balanceOf(alice);
    uint256 cUSDBalanceBefore = cUSD.balanceOf(alice);

    uint256 sellAmount = 500 * 10**18;
    uint256 expectedOut = testee.getBuyTokenAmount(sellAmount, !buyCelo);

    testee.buy(expectedOut, sellAmount, buyCelo);

    uint256 cUSDBalanceAfter = cUSD.balanceOf(alice);
    uint256 celoBalanceAfter = celoToken.balanceOf(alice);

    if (buyCelo) {
      assertTrue(celoBalanceAfter - celoBalanceBefore == expectedOut);
      assertTrue(cUSDBalanceBefore - cUSDBalanceAfter <= sellAmount);
    } else {
      assertTrue(cUSDBalanceAfter - cUSDBalanceBefore == expectedOut);
      assertTrue(celoBalanceBefore - celoBalanceAfter <= sellAmount);
    }
  }
}

/* ---------- When breaker box is not set for exchange ---------- */
contract ExchangeIntegrationTest_BreakerBoxNotSet is ExchangeIntegrationTest {
  function setUp() public {
    super.setUp();

    changePrank(governance);
    vm.expectEmit(true, false, false, false);
    emit BreakerBoxUpdated(address(0));
    testee.setBreakerBox(BreakerBox(address(0)));
    changePrank(alice);

    // Mock this call to the actual breaker box
    // so if for some reason it does recieve the call we'll get a revert
    vm.mockCall(
      address(breakerBox),
      abi.encodeWithSelector(breakerBox.getTradingMode.selector),
      abi.encode(1)
    );
  }

  function test_sellCelo_whenBreakerBoxNotSetForExchange_shouldSellAsNormal() public {
    sell(true);
  }

  function test_sellStable_whenBreakerBoxNotSetForExchange_shouldSellAsNormal() public {
    sell(false);
  }

  function test_buyCelo_whenBreakerBoxNotSetForExchange_shouldBuyAsNormal() public {
    buy(true);
  }

  function test_buyStable_whenBreakerBoxNotSetForExchange_shouldBuyAsNormal() public {
    buy(false);
  }
}

/* ---------- When breaker box is set and exchange is in default mode(Bidirectional trading)  ---------- */
contract ExchangeIntegrationTest_DefaultMode is ExchangeIntegrationTest {
  function test_sellCelo_whenExchageIsInDefaultMode_shouldSellAsNormal() public {
    vm.expectCall(
      address(breakerBox),
      abi.encodeWithSelector(breakerBox.getTradingMode.selector, address(testee))
    );

    sell(true);
  }

  function test_sellStable_whenExchageIsInDefaultMode_shouldSellAsNormal() public {
    vm.expectCall(
      address(breakerBox),
      abi.encodeWithSelector(breakerBox.getTradingMode.selector, address(testee))
    );

    sell(false);
  }

  function test_buyCelo_whenExchangeIsInDefaultMode_shouldBuyAsNormal() public {
    vm.expectCall(
      address(breakerBox),
      abi.encodeWithSelector(breakerBox.getTradingMode.selector, address(testee))
    );

    buy(true);
  }

  function test_buyStable_whenExchangeIsInDefaultMode_shouldBuyAsNormal() public {
    vm.expectCall(
      address(breakerBox),
      abi.encodeWithSelector(breakerBox.getTradingMode.selector, address(testee))
    );

    buy(false);
  }
}

/* ---------- When median has moved GT threshold so median delta breaker has tripped == no trading  ---------- */
contract ExchangeIntegrationTest_MedianMovedGtThreshold is ExchangeIntegrationTest {
  function setUp() public {
    super.setUp();
    // Threshold is 15% so 16% should trigger
    moveMedianWithOracleReports(0.16 * 10**24, true);
    changePrank(alice);
  }

  function moveMedianWithinNormalRangeThenSell() public {
    //Now move the median down within threshold.
    moveMedianWithOracleReports(0.10 * 10**24, false);

    // Should still revert as we require manual reset
    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);
  }

  function moveMedianWithinNormalRangeThenBuy() public {
    //Now move the median down within threshold.
    moveMedianWithOracleReports(0.10 * 10**24, false);

    // Should still revert as we require manual reset
    vm.expectRevert("Trading is suspended for this exchange");
    testee.buy(99999, 99999, true);
  }

  function test_sell_whenBreakerHasTripped_shouldRevert() public {
    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);
  }

  function test_buy_whenBreakerHasTripped_shouldRevert() public {
    vm.expectRevert("Trading is suspended for this exchange");
    testee.buy(99999, 99999, true);
  }

  function test_sell_whenBreakerHasTrippedThenMedianMovesWithinThreshold_shouldRevert() public {
    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);

    moveMedianWithinNormalRangeThenSell();
  }

  function test_buy_whenBreakerHasTrippedThenMedianMovesWithinThreshold_shouldRevert() public {
    vm.expectRevert("Trading is suspended for this exchange");
    testee.buy(99999, 99999, true);

    moveMedianWithinNormalRangeThenBuy();
  }

  function test_sellCelo_whenBreakerHasTrippedThenResetAndMedianChangeIsNormal_shouldSellAsNormal()
    public
  {
    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);

    moveMedianWithinNormalRangeThenSell();

    // Reset the trading mode.
    changePrank(governance);
    breakerBox.setExchangeTradingMode(address(testee), 0);

    // Try to sell again.
    changePrank(alice);
    sell(true);
  }

  function test_sellStable_whenBreakerHasTrippedThenResetAndMedianChangeIsNormal_shouldSellAsNormal()
    public
  {
    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, false);

    moveMedianWithinNormalRangeThenSell();

    // Reset the trading mode.
    changePrank(governance);
    breakerBox.setExchangeTradingMode(address(testee), 0);

    // Try to sell again.
    changePrank(alice);
    sell(false);
  }

  function test_buyStable_whenBreakerHasTrippedThenResetAndMedianChangeIsNormal_shouldSellAsNormal()
    public
  {
    vm.expectRevert("Trading is suspended for this exchange");
    testee.buy(99999, 99999, false);

    moveMedianWithinNormalRangeThenBuy();

    // Reset the trading mode.
    changePrank(governance);
    breakerBox.setExchangeTradingMode(address(testee), 0);

    // Try to buy again.
    changePrank(alice);
    buy(false);
  }

  function test_buyCelo_whenBreakerHasTrippedThenResetAndMedianChangeIsNormal_shouldSellAsNormal()
    public
  {
    vm.expectRevert("Trading is suspended for this exchange");
    testee.buy(99999, 99999, true);

    moveMedianWithinNormalRangeThenBuy();

    // Reset the trading mode.
    changePrank(governance);
    breakerBox.setExchangeTradingMode(address(testee), 0);

    // Try to buy again.
    changePrank(alice);
    buy(true);
  }
}
