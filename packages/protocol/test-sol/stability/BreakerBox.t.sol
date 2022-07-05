// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { FakeBreaker } from "../fakes/FakeBreaker.sol";

import { WithRegistry } from "../utils/WithRegistry.sol";

import { IBreakerBox } from "contracts/stability/interfaces/IBreakerBox.sol";
import { BreakerBox } from "contracts/stability/BreakerBox.sol";

contract BreakerBoxTest is Test, WithRegistry {
  address deployer;
  address exchangeA;
  address exchangeB;

  FakeBreaker fakeBreakerA;
  FakeBreaker fakeBreakerB;
  FakeBreaker fakeBreakerC;
  FakeBreaker fakeBreakerD;
  BreakerBox breakerBox;

  event BreakerAdded(address indexed breaker);
  event BreakerRemoved(address indexed breaker);
  event ExchangeAdded(address indexed exchange);
  event ExchangeRemoved(address indexed exchange);

  function setUp() public {
    deployer = actor("deployer");
    exchangeA = actor("exchangeA");
    exchangeB = actor("exchangeB");

    address[] memory testExchanges = new address[](2);
    testExchanges[0] = exchangeA;
    testExchanges[1] = exchangeB;

    changePrank(deployer);
    fakeBreakerA = new FakeBreaker(0, 1, false, false);
    fakeBreakerB = new FakeBreaker(0, 1, false, false);
    fakeBreakerC = new FakeBreaker(0, 1, false, false);
    fakeBreakerD = new FakeBreaker(0, 1, false, false);
    breakerBox = new BreakerBox(fakeBreakerA, testExchanges);
  }
}

contract BreakerBox_constructorAndSetters is BreakerBoxTest {
  /* ---------- Constructor ---------- */

  function test_constructor_shouldSetOwner() public {
    assert(breakerBox.owner() == deployer);
  }

  function test_constructor_shouldSetInitialBreaker() public {
    assert(breakerBox.tradingModeBreaker(1) == address(fakeBreakerA));
    assert(breakerBox.isBreaker(address(fakeBreakerA)));
  }

  function test_constructor_shouldAddExchangesWithDefaultMode() public {
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
  //        This could cause issues when removing a breaker, as we need to switch exchanges to the default mode as part of the removal function.
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

}
