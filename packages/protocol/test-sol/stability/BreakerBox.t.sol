// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { BreakerMock } from "../mocks/BreakerMock.sol";

import { WithRegistry } from "../utils/WithRegistry.sol";

import { IBreakerBox } from "contracts/stability/interfaces/IBreakerBox.sol";
import { BreakerBox } from "contracts/stability/BreakerBox.sol";

contract BreakerBoxTest is Test, WithRegistry {
  address deployer;
  address exchangeA;
  address exchangeB;

  BreakerMock breakerMockA;
  BreakerMock breakerMockB;
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
    breakerMockA = new BreakerMock(0, 0, false, false);
    breakerMockB = new BreakerMock(0, 0, false, false);
    breakerBox = new BreakerBox(breakerMockA, testExchanges);
  }
}

contract BreakerBox_constructorAndSetters is BreakerBoxTest {
  function test_constructor_shouldSetOwner() public {
    assert(breakerBox.owner() == deployer);
  }

  function test_constructor_shouldSetInitialBreaker() public {
    assert(breakerBox.tradingModeBreaker(0) == address(breakerMockA));
    assert(breakerBox.isBreaker(address(breakerMockA)));
  }

  function test_constructor_shouldAddExchangesWithDefaultMode() public {
    (uint256 tradingModeA, uint256 lastUpdatedA) = breakerBox.exchangeTradingModes(exchangeA);
    assert(tradingModeA == 0);
    assert(lastUpdatedA > 0);

    (uint256 tradingModeB, uint256 lastUpdatedB) = breakerBox.exchangeTradingModes(exchangeB);
    assert(tradingModeB == 0);
    assert(lastUpdatedB > 0);
  }

  function test_addBreaker_shouldRevertWhenAddingBreakerWithDuplicateTradingMode() public {
    vm.expectRevert("There is already a breaker added with the same trading mode");
    breakerBox.addBreaker(breakerMockB);
  }

  function test_addBreaker_shouldRevertWhenAddingDuplicateBreaker() public {
    breakerMockA.setTradingMode(3);
    vm.expectRevert("This breaker has already been added");
    breakerBox.addBreaker(breakerMockA);
  }

  function test_addBreaker_shouldUpdateMappingAndEmit() public {
    vm.expectEmit(true, false, false, false);
    emit BreakerAdded(address(breakerMockB));
    breakerMockB.setTradingMode(1);
    breakerBox.addBreaker(breakerMockB);
    assert(breakerBox.tradingModeBreaker(1) == address(breakerMockB));
    assert(breakerBox.isBreaker(address(breakerMockB)));
  }
}
