// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { FakeBreaker } from "../fakes/FakeBreaker.sol";
import { MockReserve } from "contracts/stability/test/MockReserve.sol";

import { WithRegistry } from "../utils/WithRegistry.sol";

import { IBreakerBox } from "contracts/stability/interfaces/IBreakerBox.sol";
import { BreakerBox } from "contracts/stability/BreakerBox.sol";

contract BreakerBoxTest is Test, WithRegistry {
  address deployer;
  address exchangeA;
  address exchangeB;
  address exchangeC;

  FakeBreaker fakeBreakerA;
  FakeBreaker fakeBreakerB;
  FakeBreaker fakeBreakerC;
  FakeBreaker fakeBreakerD;
  MockReserve mockReserve;
  BreakerBox breakerBox;

  event BreakerAdded(address indexed breaker);
  event BreakerRemoved(address indexed breaker);
  event ExchangeAdded(address indexed exchange);
  event ExchangeRemoved(address indexed exchange);
  event TradingModeUpdated(address indexed exchange, uint256 tradingMode);

  function setUp() public {
    deployer = actor("deployer");
    exchangeA = actor("exchangeA");
    exchangeB = actor("exchangeB");
    exchangeC = actor("exchangeC");

    address[] memory testExchanges = new address[](2);
    testExchanges[0] = exchangeA;
    testExchanges[1] = exchangeB;

    changePrank(deployer);
    fakeBreakerA = new FakeBreaker(0, 1, false, false);
    fakeBreakerB = new FakeBreaker(0, 1, false, false);
    fakeBreakerC = new FakeBreaker(0, 1, false, false);
    fakeBreakerD = new FakeBreaker(0, 1, false, false);
    mockReserve = new MockReserve();

    mockReserve.setReserveSpender(true);

    registry.setAddressFor("Reserve", address(mockReserve));
    registry.setAddressFor("Exchange", address(exchangeA));

    breakerBox = new BreakerBox(true);
    breakerBox.initilize(fakeBreakerA, testExchanges, address(registry));
  }
}

contract BreakerBox_constructorAndSetters is BreakerBoxTest {
  /* ---------- Initilizer ---------- */

  function test_initilize_shouldSetOwner() public {
    assert(breakerBox.owner() == deployer);
  }

  function test_initilize_shouldSetInitialBreaker() public {
    assert(breakerBox.tradingModeBreaker(1) == address(fakeBreakerA));
    assert(breakerBox.isBreaker(address(fakeBreakerA)));
  }

  function test_initilize_shouldAddExchangesWithDefaultMode() public {
    (uint256 tradingModeA, uint256 lastUpdatedA, uint256 lastUpdatedBlockA) = breakerBox
      .exchangeTradingModes(exchangeA);
    assert(tradingModeA == 0);
    assert(lastUpdatedA > 0);
    assert(lastUpdatedBlockA > 0);

    (uint256 tradingModeB, uint256 lastUpdatedB, uint256 lastUpdatedBlockB) = breakerBox
      .exchangeTradingModes(exchangeB);
    assert(tradingModeB == 0);
    assert(lastUpdatedB > 0);
    assert(lastUpdatedBlockB > 0);
  }

  /* ---------- Breakers ---------- */

  function test_addBreaker_whenAddingBreakerWithDuplicateTradingMode_shouldRevert() public {
    vm.expectRevert("There is already a breaker added with the same trading mode");
    breakerBox.addBreaker(fakeBreakerB);
  }

  function test_addBreaker_whenAddingDuplicateBreaker_shouldRevert() public {
    fakeBreakerA.setTradingMode(3);
    vm.expectRevert("This breaker has already been added");
    breakerBox.addBreaker(fakeBreakerA);
  }

  function test_addBreaker_shouldUpdateMappingAndEmit() public {
    vm.expectEmit(true, false, false, false);
    emit BreakerAdded(address(fakeBreakerB));
    fakeBreakerB.setTradingMode(2);

    breakerBox.addBreaker(fakeBreakerB);

    assert(breakerBox.tradingModeBreaker(2) == address(fakeBreakerB));
    assert(breakerBox.isBreaker(address(fakeBreakerB)));
  }

  function test_removeBreaker_whenBreakerHasntBeenAdded_shouldRevert() public {
    vm.expectRevert("This breaker has not been added");
    breakerBox.removeBreaker(fakeBreakerB);
  }

  // TODO:  It's possible for the trading mode of a breaker to be changed after it has been added to the breaker box.
  //        This could cause issues when removing a breaker, as we need to switch exchanges to the default mode to cleanup as part of the removal function.
  //        If a breaker is added, then it's trading mode changed, an exchange could be stuck in a trading mode or potentially be reset under the wrong conditions.
  //        To mitigate this we could remove knowledge of trading modes from the breakers and instead only store this in the breaker box
  //        So a trading mode is only set when it's added to the breaker box and can only be changed upon removal, which will be cleaner.
  function test_removeBreaker_whenBreakerTradingModeDoesNotMatch_shouldRevert() public {
    fakeBreakerA.setTradingMode(3);
    vm.expectRevert("This breaker does not match stored trading mode");

    breakerBox.removeBreaker(fakeBreakerA);
  }

  function test_removeBreaker_shouldUpdateStorageAndEmit() public {
    vm.expectEmit(true, false, false, false);
    emit BreakerRemoved(address(fakeBreakerA));

    assert(breakerBox.tradingModeBreaker(1) == address(fakeBreakerA));
    assert(breakerBox.isBreaker(address(fakeBreakerA)));

    breakerBox.removeBreaker(fakeBreakerA);

    assert(breakerBox.tradingModeBreaker(1) == address(0));
    assert(!breakerBox.isBreaker(address(fakeBreakerA)));
  }

  function test_insertBreaker_whenBreakerHasAlreadyBeenAdded_shouldRevert() public {
    vm.expectRevert("This breaker has already been added");
    breakerBox.insertBreaker(fakeBreakerA, address(0), address(0));
  }

  function test_insertBreaker_whenAddingBreakerWithDuplicateTradingMode_shouldRevert() public {
    vm.expectRevert("There is already a breaker added with the same trading mode");
    breakerBox.insertBreaker(fakeBreakerB, address(0), address(0));
  }

  function test_insertBreaker_shouldInsertBreakerAtCorrectPositionAndEmit() public {
    assert(breakerBox.getBreakers().length == 1);
    fakeBreakerB.setTradingMode(2);
    fakeBreakerC.setTradingMode(3);
    breakerBox.addBreaker(fakeBreakerB);
    breakerBox.addBreaker(fakeBreakerC);

    address[] memory breakersBefore = breakerBox.getBreakers();
    assert(breakersBefore.length == 3);
    assert(breakersBefore[0] == address(fakeBreakerA));
    assert(breakersBefore[1] == address(fakeBreakerB));
    assert(breakersBefore[2] == address(fakeBreakerC));

    vm.expectEmit(true, false, false, false);
    emit BreakerAdded(address(fakeBreakerD));

    fakeBreakerD.setTradingMode(4);
    breakerBox.insertBreaker(fakeBreakerD, address(fakeBreakerB), address(fakeBreakerA));

    address[] memory breakersAfter = breakerBox.getBreakers();
    assert(breakersAfter.length == 4);
    assert(breakersAfter[0] == address(fakeBreakerA));
    assert(breakersAfter[1] == address(fakeBreakerD));
    assert(breakersAfter[2] == address(fakeBreakerB));
    assert(breakersAfter[3] == address(fakeBreakerC));

    assert(breakerBox.tradingModeBreaker(4) == address(fakeBreakerD));
    assert(breakerBox.tradingModeBreaker(3) == address(fakeBreakerC));
    assert(breakerBox.tradingModeBreaker(2) == address(fakeBreakerB));
    assert(breakerBox.tradingModeBreaker(1) == address(fakeBreakerA));
  }

  /* ---------- Exchanges ---------- */

  function test_addExchange_whenExchangeHasAlreadyBeenAdded_shouldRevert() public {
    vm.expectRevert("Exchange has already been added");
    breakerBox.addExchange(exchangeA);
  }

  function test_addExchange_whenExchangeIsNotReserveSpender_shouldRevert() public {
    mockReserve.setReserveSpender(false);

    vm.expectRevert("Exchange is not a reserve spender");
    breakerBox.addExchange(exchangeC);
  }

  function test_addExchange_whenExchangeIsReserveSpender_shouldSetDefaultModeAndEmit() public {
    mockReserve.setReserveSpender(true);
    vm.expectEmit(true, false, false, false);
    emit ExchangeAdded(exchangeC);

    (uint256 tradingModeBefore, uint256 lastUpdatedTimeBefore, uint256 lastUpdatedBlockBefore) = breakerBox
      .exchangeTradingModes(exchangeC);

    assert(tradingModeBefore == 0);
    assert(lastUpdatedTimeBefore == 0);
    assert(lastUpdatedBlockBefore == 0);

    skip(5);
    vm.roll(block.number + 1);
    breakerBox.addExchange(exchangeC);

    (uint256 tradingModeAfter, uint256 lastUpdatedTimeAfter, uint256 lastUpdatedBlockAfter) = breakerBox
      .exchangeTradingModes(exchangeC);

    assert(tradingModeAfter == 0);
    assert(lastUpdatedTimeAfter > lastUpdatedTimeBefore);
    assert(lastUpdatedBlockAfter > lastUpdatedBlockBefore);
  }

  function test_removeExchange_shouldResetTradingModeInfoAndEmit() public {
    breakerBox.setExchangeTradingMode(exchangeA, 1);
    vm.expectEmit(true, false, false, false);
    emit ExchangeRemoved(exchangeA);

    (uint256 tradingModeBefore, uint256 lastUpdatedTimeBefore, uint256 lastUpdatedBlockBefore) = breakerBox
      .exchangeTradingModes(exchangeA);
    assert(tradingModeBefore == 1);
    assert(lastUpdatedTimeBefore > 0);
    assert(lastUpdatedBlockBefore > 0);

    breakerBox.removeExchange(exchangeA);

    (uint256 tradingModeAfter, uint256 lastUpdatedTimeAfter, uint256 lastUpdatedBlockAfter) = breakerBox
      .exchangeTradingModes(exchangeA);
    assert(tradingModeAfter == 0);
    assert(lastUpdatedTimeAfter == 0);
    assert(lastUpdatedBlockAfter == 0);
  }

  function test_setExchangeTradingMode_whenExchangeHasNotBeenAdded_ShouldRevert() public {
    vm.expectRevert("Exchange has not been added");
    breakerBox.setExchangeTradingMode(exchangeC, 1);
  }

  function test_setExchangeTradingMode_whenSpecifiedTradingModeHasNoBreaker_ShouldRevert() public {
    vm.expectRevert("Trading mode must be default or have a breaker set");
    breakerBox.setExchangeTradingMode(exchangeA, 9);
  }

  function test_setExchangeTradingMode_whenUsingDefaultTradingMode_ShouldUpdateAndEmit() public {
    (uint256 tradingModeBefore, uint256 lastUpdatedTimeBefore, uint256 lastUpdatedBlockBefore) = breakerBox
      .exchangeTradingModes(exchangeA);
    assert(tradingModeBefore == 0);
    assert(lastUpdatedTimeBefore > 0);
    assert(lastUpdatedBlockBefore > 0);

    //Fake time skip
    skip(5 * 60);
    vm.roll(5);
    vm.expectEmit(true, false, false, true);
    emit TradingModeUpdated(exchangeA, 1);

    breakerBox.setExchangeTradingMode(exchangeA, 1);
    (uint256 tradingModeAfter, uint256 lastUpdatedTimeAfter, uint256 lastUpdatedBlockAfter) = breakerBox
      .exchangeTradingModes(exchangeA);
    assert(tradingModeAfter == 1);
    assert(lastUpdatedTimeAfter > lastUpdatedTimeBefore);
    assert(lastUpdatedBlockAfter > lastUpdatedBlockBefore);
  }
}
