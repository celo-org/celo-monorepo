// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { IMentoExchange } from "contracts/stability/interfaces/deprecate/IMentoExchange.sol";
import { PairManager } from "contracts/stability/PairManager.old.sol";

import { MockReserve } from "contracts/stability/test/MockReserve.sol";
import { MockERC20 } from "contracts/stability/test/MockERC20.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";

// forge test --match-contract PairManager -vvv
contract PairManagerTest is Test {
  using FixidityLib for FixidityLib.Fraction;
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
  IMentoExchange testMentoExchange;

  MockReserve mockReserve;
  PairManager testee;

  event BucketsUpdated(bytes32 pairId, uint256 collateralBucket, uint256 stableBucket);
  event BrokerUpdated(address indexed newBroker);
  event PairCreated(
    address indexed stableAsset,
    address indexed collateralAsset,
    address indexed mentoExchange,
    bytes32 pairId
  );
  event PairDestroyed(
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
    testMentoExchange = IMentoExchange(actor("MockExchange"));

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

    testee.initialize(broker, address(mockReserve));

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

contract PairManagerTest_initilizerSettersGetters is PairManagerTest {
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

  function test_updateBuckets_whenSenderIsNotBroker_shouldRevert() public {
    bytes32 pairId = keccak256(
      abi.encodePacked(
        testStableAsset.symbol(),
        testCollateralAsset.symbol(),
        testMentoExchange.name()
      )
    );

    vm.expectRevert("Caller is not the Broker");
    testee.updateBuckets(pairId, 45000000000, 45000000000);
  }

  function test_updateBuckets_whenPairDoesNotExist_shouldRevert() public {
    changePrank(broker);

    bytes32 pairId = keccak256(
      abi.encodePacked(
        anotherTestStableAsset.symbol(),
        testCollateralAsset.symbol(),
        testMentoExchange.name()
      )
    );

    vm.expectRevert("A pair with the specified id does not exist");
    testee.updateBuckets(pairId, 45000000000, 45000000000);
  }

  function test_updateBuckets_whenSenderIsBroker_shouldUpdateAndEmit() public {
    changePrank(broker);

    bytes32 pairId = keccak256(
      abi.encodePacked(
        testStableAsset.symbol(),
        testCollateralAsset.symbol(),
        testMentoExchange.name()
      )
    );

    PairManager.Pair memory pairBeforeUpdate = testee.getPair(pairId);
    assert(pairBeforeUpdate.stableBucket == 250000000000);
    assert(pairBeforeUpdate.collateralBucket == 250000000000);

    vm.expectEmit(true, true, true, true);
    emit BucketsUpdated(pairId, 45000000000, 45000000000);
    testee.updateBuckets(pairId, 45000000000, 45000000000);

    PairManager.Pair memory pairAfterUpdate = testee.getPair(pairId);
    assert(pairAfterUpdate.stableBucket == 45000000000);
    assert(pairAfterUpdate.collateralBucket == 45000000000);
  }

  /* ---------- Getters ---------- */

  function testFail_getPair_whenPairDoesNotExist_shouldRevert() public view {
    bytes32 pairId = keccak256(
      abi.encodePacked(
        anotherTestStableAsset.symbol(),
        testCollateralAsset.symbol(),
        testMentoExchange.name()
      )
    );

    // vm.expectRevert("A pair with the specified id does not exist");
    testee.getPair(pairId);
  }

  function test_getPair_whenPairExists_shouldReturnPair() public view {
    bytes32 pairId = keccak256(
      abi.encodePacked(
        testStableAsset.symbol(),
        testCollateralAsset.symbol(),
        testMentoExchange.name()
      )
    );

    PairManager.Pair memory existingPair = testee.getPair(pairId);
    assert(existingPair.stableAsset == address(testStableAsset));
    assert(existingPair.collateralAsset == address(testCollateralAsset));
    assert(existingPair.mentoExchange == testMentoExchange);
    assert(existingPair.collateralBucketFraction.equals(FixidityLib.wrap(0.1 * 10**24)));
    assert(existingPair.stableBucketMaxFraction.equals(FixidityLib.wrap(0.1 * 10**24)));
    assert(existingPair.spread.equals(FixidityLib.wrap(0.1 * 10**24)));
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
      address(testMentoExchange),
      pairId
    );
    testee.createPair(newPair);
  }
}

contract PairManagerTest_destroyPair is PairManagerTest {
  function test_destroyPair_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    testee.destroyPair(address(testStableAsset), address(testCollateralAsset), testMentoExchange);
  }

  function test_destroyPair_whenStableAddressIsZero_shouldRevert() public {
    vm.expectRevert("Stable asset address must be specified");
    testee.destroyPair(address(0), address(testCollateralAsset), testMentoExchange);
  }

  function test_destroyPair_whenCollateralAddressIsZero_shouldRevert() public {
    vm.expectRevert("Collateral asset address must be specified");
    testee.destroyPair(address(testStableAsset), address(0), testMentoExchange);
  }

  function test_destroyPair_whenPairDoesNotExist_shouldRevert() public {
    vm.expectRevert("A pair with the specified assets and exchange does not exist");
    testee.destroyPair(
      address(anotherTestStableAsset),
      address(testCollateralAsset),
      testMentoExchange
    );
  }

  function test_destroyPair_whenPairExists_shouldUpdateAndEmit() public {
    vm.expectEmit(true, true, true, false);
    emit PairDestroyed(
      address(testStableAsset),
      address(testCollateralAsset),
      address(testMentoExchange)
    );
    testee.destroyPair(address(testStableAsset), address(testCollateralAsset), testMentoExchange);
  }
}
