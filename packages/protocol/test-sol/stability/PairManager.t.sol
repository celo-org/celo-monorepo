// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test } from "celo-foundry/Test.sol";

import { IMentoExchange } from "contracts/stability/interfaces/IMentoExchange.sol";
import { PairManager } from "contracts/stability/PairManager.sol";
import { WithRegistry } from "../utils/WithRegistry.sol";

import { MockReserve } from "contracts/stability/test/MockReserve.sol";
import { MockERC20 } from "contracts/stability/test/MockERC20.sol";
import { MockMentoExchange } from "contracts/stability/test/MockMentoExchange.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";

// forge test --match-contract PairManager -vvv
contract PairManagerTest is Test, WithRegistry {
  struct UpdatedBuckets {
    uint256 stableBucket;
    uint256 collateralBucket;
  }

  address deployer;
  address notDeployer;
  address broker;

  MockERC20 testStableAsset;
  MockERC20 anotherTestStableAsset;
  MockERC20 testCollateralAsset;
  MockMentoExchange testMentoExchange;

  MockReserve mockReserve;
  PairManager testee;

  event BrokerUpdated(address indexed newBroker);
  event PairCreated(
    address indexed stableAsset,
    address indexed collateralAsset,
    address indexed mentoExchange
  );

  function setUp() public {
    deployer = actor("deployer");
    notDeployer = actor("notDeployer");
    broker = actor("broker");

    testStableAsset = new MockERC20("Test Stable Asset", "TSA");
    anotherTestStableAsset = new MockERC20("Another Test Stable Asset", "ATSA");
    testCollateralAsset = new MockERC20("Test Collateral Asset", "TCA");
    testMentoExchange = new MockMentoExchange("TestExchange");

    mockReserve = new MockReserve();
    testee = new PairManager(true);

    UpdatedBuckets memory testBuckets = UpdatedBuckets(250000000000, 250000000000);

    vm.mockCall(
      address(testMentoExchange),
      abi.encodeWithSelector(testMentoExchange.getUpdatedBuckets.selector),
      abi.encode(testBuckets)
    );

    vm.mockCall(
      address(mockReserve),
      abi.encodeWithSelector(mockReserve.isStableAsset.selector, address(anotherTestStableAsset)),
      abi.encode(true)
    );

    changePrank(deployer);

    registry.setAddressFor("Reserve", address(mockReserve));

    testee.initilize(broker, address(registry));

    initPairs();
  }

  function initPairs() public {
    vm.mockCall(
      address(mockReserve),
      abi.encodeWithSelector(mockReserve.isStableAsset.selector, address(testStableAsset)),
      abi.encode(true)
    );

    vm.mockCall(
      address(mockReserve),
      abi.encodeWithSelector(mockReserve.isCollateralAsset.selector, address(testCollateralAsset)),
      abi.encode(true)
    );

    PairManager.Pair memory newPair;
    newPair.stableAsset = address(testStableAsset);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(address(testMentoExchange));
    newPair.collateralBucketFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.stableBucketMaxFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.spread = FixidityLib.wrap(0.1 * 10**24);

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
  function test_createPair_whenNotCalledByOwner_shouldRevert() public {
    PairManager.Pair memory newPair;
    changePrank(notDeployer);

    vm.expectRevert("Ownable: caller is not the owner");
    testee.createPair(newPair);
  }

  function test_createPair_whenPairWithIdExists_shouldRevert() public {
    vm.expectRevert("A pair with the specified assets and exchange exists");

    PairManager.Pair memory newPair;
    newPair.stableAsset = address(testStableAsset);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(address(testMentoExchange));
    newPair.collateralBucketFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.stableBucketMaxFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.spread = FixidityLib.wrap(0.1 * 10**24);

    testee.createPair(newPair);
  }

  function test_createPair_whenStableAssetIsNotRegistered_shouldRevert() public {
    MockERC20 nonReserveStable = new MockERC20("Non Reserve Stable Asset", "NRSA");

    PairManager.Pair memory newPair;
    newPair.stableAsset = address(nonReserveStable);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(address(testMentoExchange));

    vm.expectRevert("Stable asset specified is not registered with reserve");
    testee.createPair(newPair);
  }

  function test_createPair_whenCollateralAssetIsNotRegistered_shouldRevert() public {
    MockERC20 nonReserveCollateral = new MockERC20("Non Reserve Collateral Asset", "NRCA");

    PairManager.Pair memory newPair;
    newPair.stableAsset = address(testStableAsset);
    newPair.collateralAsset = address(nonReserveCollateral);
    newPair.mentoExchange = IMentoExchange(address(testMentoExchange));

    vm.expectRevert("Collateral asset specified is not registered with reserve");
    testee.createPair(newPair);
  }

  function test_createPair_whenCollateralBucketFractionIsOne_shouldRevert() public {
    PairManager.Pair memory newPair;
    newPair.stableAsset = address(anotherTestStableAsset);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(address(testMentoExchange));
    newPair.collateralBucketFraction = FixidityLib.fixed1();

    vm.expectRevert("Collateral asset fraction must be smaller than 1");
    testee.createPair(newPair);
  }

  function test_createPair_whenMentoExchangeIsNotSet_shouldRevert() public {
    PairManager.Pair memory newPair;
    newPair.stableAsset = address(testStableAsset);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(address(0));
    newPair.collateralBucketFraction = FixidityLib.fixed1();

    vm.expectRevert("Mento exchange must be set");
    testee.createPair(newPair);
  }

  function test_createPair_whenStableAssetIsNotSet_shouldRevert() public {
    PairManager.Pair memory newPair;
    newPair.stableAsset = address(0);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(testMentoExchange);
    newPair.collateralBucketFraction = FixidityLib.fixed1();

    vm.expectRevert("Stable asset must be set");
    testee.createPair(newPair);
  }

  function test_createPair_whenCollateralAssetIsNotSet_shouldRevert() public {
    PairManager.Pair memory newPair;
    newPair.stableAsset = address(testStableAsset);
    newPair.collateralAsset = address(0);
    newPair.mentoExchange = IMentoExchange(testMentoExchange);
    newPair.collateralBucketFraction = FixidityLib.fixed1();

    vm.expectRevert("Collateral asset must be set");
    testee.createPair(newPair);
  }

  function test_createPair_whenStableBucketFractionNotGTZero_shouldRevert() public {
    PairManager.Pair memory newPair;
    newPair.stableAsset = address(anotherTestStableAsset);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(testMentoExchange);
    newPair.collateralBucketFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.stableBucketMaxFraction = FixidityLib.wrap(0);

    vm.expectRevert("Stable bucket fraction must be greater than 0");
    testee.createPair(newPair);
  }

  function test_createPair_whenStableBucketFractionNotLTOne_shouldRevert() public {
    PairManager.Pair memory newPair;
    newPair.stableAsset = address(anotherTestStableAsset);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(testMentoExchange);
    newPair.collateralBucketFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.stableBucketMaxFraction = FixidityLib.fixed1();

    vm.expectRevert("Stable bucket fraction must be smaller than 1");
    testee.createPair(newPair);
  }

  function test_createPair_whenSpreadNotLTEOne_shouldRevert() public {
    PairManager.Pair memory newPair;
    newPair.stableAsset = address(anotherTestStableAsset);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(testMentoExchange);
    newPair.collateralBucketFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.stableBucketMaxFraction = FixidityLib.wrap(0.123 * 10**24);
    newPair.spread = FixidityLib.wrap(2 * 10**24);

    vm.expectRevert("Spread must be less than or equal to 1");
    testee.createPair(newPair);
  }

  function test_createPair_whenInfoIsValid_shouldUpdateMappingAndEmit() public {
    bytes32 pairId = keccak256(
      abi.encodePacked(
        anotherTestStableAsset.symbol(),
        testCollateralAsset.symbol(),
        testMentoExchange.name()
      )
    );

    // Create pair
    PairManager.Pair memory newPair;
    newPair.stableAsset = address(anotherTestStableAsset);
    newPair.collateralAsset = address(testCollateralAsset);
    newPair.mentoExchange = IMentoExchange(testMentoExchange);
    newPair.collateralBucketFraction = FixidityLib.wrap(0.1 * 10**24);
    newPair.stableBucketMaxFraction = FixidityLib.wrap(0.123 * 10**24);
    newPair.spread = FixidityLib.wrap(0.4 * 10**24);

    vm.expectEmit(true, true, true, false);
    emit PairCreated(
      address(anotherTestStableAsset),
      address(testCollateralAsset),
      address(testMentoExchange)
    );
    testee.createPair(newPair);

    // Verify pair exists

  }
}
