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

// TODO:
interface Cheats {
  function createFork(string calldata) external returns (uint256);

  function selectFork(uint256) external;

  function rpcUrl(string calldata) external returns (string memory);
}

contract ExchangeIntegrationTest is Test, TokenHelpers {
  // TODO: Remove
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
    // TODO: Default to fork for integration tests profile & remove
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
    Proxy exchangeBRLProxy;
    Proxy exchangeEURProxy;
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

  function test_sell_whenExchageIsInDefaultMode_shouldSellAsNormal() public {
    uint256 sellAmount = 500 * 10**18;
    uint256 celoBalanceBefore = celoToken.balanceOf(alice);

    vm.expectCall(
      address(breakerBox),
      abi.encodeWithSelector(breakerBox.getTradingMode.selector, address(testee))
    );

    testee.sell(sellAmount, testee.getBuyTokenAmount(sellAmount, true), true);
    uint256 celoBalanceAfter = celoToken.balanceOf(alice);

    assertTrue(celoBalanceBefore - celoBalanceAfter == sellAmount);
  }

  function test_sell_whenMedianMovesUpGtThanThreshold_shouldRevert() public {
    // Threshold is 15% so 16% should trigger
    moveMedianWithOracleReports(0.16 * 10**24, true);
    changePrank(alice);

    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);
  }

  function test_sell_whenMedianMovesDownGtThanThreshold_shouldRevert() public {
    // Threshold is 15% so 16% should trigger
    moveMedianWithOracleReports(0.16 * 10**24, false);
    changePrank(alice);

    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);
  }

  function test_sell_whenBreakerHasTrippedButMedianChangeIsNormal_shouldRevert() public {
    // Threshold is 15% so 16% should trigger
    moveMedianWithOracleReports(0.16 * 10**24, false);
    changePrank(alice);

    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);

    //Now move the median down within threshold.
    moveMedianWithOracleReports(0.10 * 10**24, false);

    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);
  }

  function test_sell_whenBreakerHasTrippedThenResetAndMedianChangeIsNormal_shouldSellAsNormal()
    public
  {
    // Threshold is 15% so 16% should trigger.
    moveMedianWithOracleReports(0.16 * 10**24, false);
    changePrank(alice);

    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);

    // Now move the median down within threshold.
    moveMedianWithOracleReports(0.10 * 10**24, false);

    // Whilst the median change is normal, this breaker requires a manual reset.
    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);

    // Reset the trading mode.
    changePrank(governance);
    breakerBox.setExchangeTradingMode(address(testee), 0);

    // Try to sell again.
    changePrank(alice);
    uint256 sellAmount = 500 * 10**18;
    uint256 celoBalanceBefore = celoToken.balanceOf(alice);

    testee.sell(sellAmount, testee.getBuyTokenAmount(sellAmount, true), true);
    uint256 celoBalanceAfter = celoToken.balanceOf(alice);

    assertTrue(celoBalanceBefore - celoBalanceAfter == sellAmount);
  }

  function test_sell_whenBreakerHasTrippedThenResetAndNewMedianChangeNotNormal_shouldRevert()
    public
  {
    // Threshold is 15% so 16% should trigger.
    moveMedianWithOracleReports(0.16 * 10**24, false);
    changePrank(alice);

    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);

    // Reset the trading mode.
    changePrank(governance);
    breakerBox.setExchangeTradingMode(address(testee), 0);

    // Confirm trading should be allowed
    assertEq(breakerBox.getTradingMode(address(testee)), 0);

    // Now move the median down gt threshold.
    moveMedianWithOracleReports(0.17 * 10**24, false);

    vm.expectRevert("Trading is suspended for this exchange");
    testee.sell(99999, 99999, true);
  }
}
