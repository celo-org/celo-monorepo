// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test } from "celo-foundry/Test.sol";

import { IMentoExchange } from "contracts/stability/interfaces/IMentoExchange.sol";
import { PairManager } from "contracts/stability/PairManager.sol";
import { WithRegistry } from "../utils/WithRegistry.sol";
import { MockReserve } from "contracts/stability/test/MockReserve.sol";
import { FixidityLib } from "contracts/common/FixidityLib.sol";

// forge test --match-contract PairManager -vvv
contract PairManagerTest is Test, WithRegistry {
  address deployer;
  address notDeployer;
  address broker;

  address testStableAsset;
  address testCollateralAsset;
  address fakeMentoExchange;

  MockReserve mockReserve;
  PairManager testee;

  event BrokerUpdated(address indexed newBroker);

  function setUp() public {
    deployer = actor("deployer");
    notDeployer = actor("notDeployer");
    broker = actor("broker");
    testStableAsset = actor("testStableAsset");
    testCollateralAsset = actor("testCollateralAsset");
    fakeMentoExchange = actor("fakeMentoExchange");

    changePrank(deployer);

    mockReserve = new MockReserve();
    testee = new PairManager(true);

    registry.setAddressFor("Reserve", address(mockReserve));

    testee.initilize(broker, address(registry));
  }

  function initPairs() public {
    // Mock reserve is stable asset & isCollateral asset
    // vm.mockCall(
    //     address(mockReserve),
    //     abi.encodeWithSelector(mockReserve.isStableAsset.selector)
    //     abi.encode(true)
    // );

    PairManager.Pair memory newPair;
    newPair.stableAsset = testStableAsset;
    newPair.collateralAsset = testCollateralAsset;
    newPair.mentoExchange = IMentoExchange(fakeMentoExchange);
    newPair.collateralBucketFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.stableBucketMaxFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.spread = FixidityLib.wrap(0.1 * 10**24);

    vm.expectEmit(true, false, false, false);

    testee.createPair(newPair);
  }
}

contract PairManagerTest_initilizerAndSetters is PairManagerTest {
  /* ---------- Initilizer ---------- */

  function test_initilize_shouldSetOwner() public view {
    assert(testee.owner() == deployer);
  }

  function test_initilize_shouldSetBroker() public view {
    assert(testee.broker() == broker);
  }

  /* ---------- Setters ---------- */

  function test_setBroker_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    testee.setBroker(address(0));
  }

  function test_setBroker_whenAddressIsZero_shouldRevert() public {
    vm.expectRevert("Broker address must be set");
    testee.setBroker(address(0));
  }

  function test_setBroker_whenSenderIsOwner_shouldUpdateAndEmit() public {
    address newBroker = actor("newBroker");
    vm.expectEmit(true, false, false, false);
    emit BrokerUpdated(newBroker);

    testee.setBroker(newBroker);

    assert(testee.broker() == newBroker);
  }
}

contract PairManagerTest_createPair is PairManagerTest {
  function test_createPair_whenPairWithIdExists_shouldRevert() public {
    vm.expectRevert("A pair with the specified assets and exchange exists");
  }
}
