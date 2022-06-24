// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";

import "../mocks/MockGoldToken.sol";
import "../mocks/MockStableToken.sol";

import "contracts/stability/Exchange.sol";
import "contracts/stability/StableToken.sol";
import "contracts/stability/test/MockReserve.sol";
import "contracts/stability/test/MockSortedOracles.sol";
import "contracts/common/FixidityLib.sol";
import "contracts/common/Freezer.sol";
import "contracts/common/Registry.sol";

// is Exchange to have events in scope
contract ExchangeTest is Test, Exchange(true) {
  address deployer;
  address rando;

  Exchange exchange;
  Freezer freezer;
  Registry registry;
  MockStableToken stableToken;
  MockGoldToken goldToken;
  MockReserve reserve;
  MockSortedOracles sortedOracles;

  uint256 constant bucketUpdateFrequency = 60 * 60;
  uint256 constant initialReserveBalance = 10000000000000000000000;
  FixidityLib.Fraction reserveFraction = FixidityLib.newFixedFraction(5, 100);
  uint256 initialGoldBucket = FixidityLib
    .newFixed(initialReserveBalance)
    .multiply(reserveFraction)
    .fromFixed();
  uint256 constant goldAmountForRate = 1000000000000000000000000;
  uint256 constant stableAmountForRate = 2000000000000000000000000;
  uint256 initialStableBucket = initialGoldBucket * 2;
  FixidityLib.Fraction spread = FixidityLib.newFixedFraction(3, 1000);

  function setUp() public {
    deployer = vm.addr(1);
    rando = vm.addr(2);
    // Go somwehre in the future
    vm.warp(60 * 60 * 24 * 7 * 100);
    vm.startPrank(deployer);
    freezer = new Freezer(true);
    goldToken = new MockGoldToken();
    reserve = new MockReserve();
    registry = new Registry(true);
    exchange = new Exchange(true);
    stableToken = new MockStableToken();

    registry.setAddressFor("Freezer", address(freezer));
    registry.setAddressFor("GoldToken", address(goldToken));
    registry.setAddressFor("Reserve", address(reserve));
    registry.setAddressFor("StableToken", address(stableToken));
    reserve.setGoldToken(address(goldToken));
    goldToken.mint(address(reserve), initialReserveBalance);

    address[] memory initialAddresses = new address[](0);
    uint256[] memory initialBalances = new uint256[](0);
    stableToken.initialize(
      "Celo Dollar",
      "cUSD",
      18,
      address(registry),
      FixidityLib.unwrap(FixidityLib.fixed1()),
      60 * 60 * 24 * 7,
      initialAddresses,
      initialBalances,
      "Exchange"
    );

    sortedOracles = new MockSortedOracles();
    registry.setAddressFor("SortedOracles", address(sortedOracles));
    sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);
    sortedOracles.setMedianTimestampToNow(address(stableToken));
    sortedOracles.setNumRates(address(stableToken), 2);

    exchange.initialize(
      address(registry),
      "StableToken",
      FixidityLib.unwrap(spread),
      FixidityLib.unwrap(reserveFraction),
      bucketUpdateFrequency,
      2
    );
  }

  function getBuyTokenAmount(uint256 sellAmount, uint256 sellSupply, uint256 buySupply)
    public
    view
    returns (uint256)
  {
    return getBuyTokenAmount(sellAmount, sellSupply, buySupply, spread);
  }

  function getBuyTokenAmount(
    uint256 sellAmount,
    uint256 sellSupply,
    uint256 buySupply,
    FixidityLib.Fraction memory spread_
  ) public pure returns (uint256) {
    FixidityLib.Fraction memory reducedSellAmount = FixidityLib.newFixed(sellAmount).multiply(
      FixidityLib.fixed1().subtract(spread_)
    );
    FixidityLib.Fraction memory numerator = reducedSellAmount.multiply(
      FixidityLib.newFixed(buySupply)
    );
    FixidityLib.Fraction memory denominator = FixidityLib.newFixed(sellSupply).add(
      reducedSellAmount
    );
    return numerator.unwrap().div(denominator.unwrap());
  }

  function getSellTokenAmount(uint256 buyAmount, uint256 sellSupply, uint256 buySupply)
    public
    view
    returns (uint256)
  {
    return getSellTokenAmount(buyAmount, sellSupply, buySupply, spread);
  }

  function getSellTokenAmount(
    uint256 buyAmount,
    uint256 sellSupply,
    uint256 buySupply,
    FixidityLib.Fraction memory spread_
  ) public pure returns (uint256) {
    FixidityLib.Fraction memory numerator = FixidityLib.newFixed(buyAmount.mul(sellSupply));
    FixidityLib.Fraction memory denominator = FixidityLib
      .newFixed(buySupply.sub(buyAmount))
      .multiply(FixidityLib.fixed1().subtract(spread_));
    return numerator.unwrap().div(denominator.unwrap());
  }
}

contract Exchange_initializeAndSetters is ExchangeTest {
  function test_initialize_shouldHaveSetOwner() public view {
    assert(exchange.owner() == deployer);
  }

  function test_initialize_shouldSetStableTokenIdentifier() public view {
    bytes32 identifier = exchange.stableTokenRegistryId();
    assert(identifier == keccak256("StableToken"));
  }

  function test_initialize_shouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    exchange.initialize(
      address(registry),
      "StableToken",
      FixidityLib.unwrap(FixidityLib.newFixedFraction(3, 1000)),
      FixidityLib.unwrap(FixidityLib.newFixedFraction(5, 100)),
      60 * 60,
      2
    );
  }

  function test_activateStable_shouldSetTheStableStorageAddress() public {
    assert(exchange.stable() == address(0));
    vm.expectEmit(true, true, true, true, address(exchange));
    emit StableTokenSet(address(stableToken));
    exchange.activateStable();
    assert(exchange.stable() == address(stableToken));
  }

  function test_activateStable_shouldNotAllowANonOwnerToActivate() public {
    vm.expectRevert("Ownable: caller is not the owner");
    changePrank(rando);
    exchange.activateStable();
  }

  function test_activateStable_shouldNotBeCallableAgain() public {
    exchange.activateStable();
    vm.expectRevert("StableToken address already activated");
    exchange.activateStable();
  }

  function test_setUpdateFrequency_setsTheValueAndEmits() public {
    vm.expectEmit(true, true, true, true, address(exchange));
    emit UpdateFrequencySet(60 * 3);
    exchange.setUpdateFrequency(60 * 3);
    assert(exchange.updateFrequency() == 60 * 3);
  }

  function test_setUpdateFrequency_isOnlyCallableByOwner() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    exchange.setUpdateFrequency(60 * 4);
  }

  function test_setMinimumReports_setsTheValueAndEmits() public {
    vm.expectEmit(true, true, true, true, address(exchange));
    emit MinimumReportsSet(10);
    exchange.setMinimumReports(10);
    assert(exchange.minimumReports() == 10);
  }

  function test_setMinimumReports_isOnlyCallableByOwner() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    exchange.setMinimumReports(10);
  }

  function test_setStableToken_setsTheValueAndEmits() public {
    vm.expectEmit(true, true, true, true, address(exchange));
    emit StableTokenSet(address(11));
    exchange.setStableToken(address(11));
    assert(exchange.stable() == address(11));
  }

  function test_setStableToken_isOnlyCallableByOwner() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    exchange.setStableToken(address(11));
  }

  function test_setSpread_setsTheValueAndEmits() public {
    uint256 newSpread = FixidityLib.unwrap(FixidityLib.newFixedFraction(5, 100));
    vm.expectEmit(true, true, true, true, address(exchange));
    emit SpreadSet(newSpread);
    exchange.setSpread(newSpread);
    assert(exchange.spread() == newSpread);
  }

  function test_setSpread_isOnlyCallableByOwner() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    exchange.setSpread(0);
  }

  function test_setReserveFraction_setsTheValueAndEmits() public {
    uint256 newReserveFraction = FixidityLib.unwrap(FixidityLib.newFixedFraction(5, 100));
    vm.expectEmit(true, true, true, true, address(exchange));
    emit ReserveFractionSet(newReserveFraction);
    exchange.setReserveFraction(newReserveFraction);
    assert(exchange.reserveFraction() == newReserveFraction);
  }

  function test_setReserveFraction_cantBeOne() public {
    uint256 newReserveFraction = FixidityLib.unwrap(FixidityLib.fixed1());
    vm.expectRevert("reserve fraction must be smaller than 1");
    exchange.setReserveFraction(newReserveFraction);
  }

  function test_setReserveFraction_isOnlyCallableByOwner() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    exchange.setReserveFraction(0);
  }
}

contract Exchange_stableActivated is ExchangeTest {
  function setUp() public {
    super.setUp();
    exchange.activateStable();
  }
}

contract Exchange_buyAndSellValues is Exchange_stableActivated {
  function test_getBuyAndSellBuckets_shouldReturnTheCorrectAmountOfTokens() public view {
    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == initialStableBucket);
    assert(sellBucketSize == initialGoldBucket);
  }

  function test_getBuyAndSellBuckets_afterReserveChange_shouldBeTheSameIfNotStale() public {
    goldToken.mint(address(reserve), initialReserveBalance);

    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == initialStableBucket);
    assert(sellBucketSize == initialGoldBucket);
  }

  function test_getBuyAndSellBuckets_afterReserveChange_shouldUpdateIfTimeHasPassed() public {
    goldToken.mint(address(reserve), initialReserveBalance);
    vm.warp(block.timestamp + bucketUpdateFrequency);
    sortedOracles.setMedianTimestampToNow(address(stableToken));

    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == 2 * initialStableBucket);
    assert(sellBucketSize == 2 * initialGoldBucket);
  }

  function test_getBuyAndSellBuckets_afterOracelUpdate_shouldBeTheSameIfNotStale() public {
    sortedOracles.setMedianRate(address(stableToken), goldAmountForRate.mul(4));
    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == initialStableBucket);
    assert(sellBucketSize == initialGoldBucket);
  }

  function test_getBuyAndSellBuckets_afterOracelUpdate_shouldUpdateIfTimeHasPassed() public {
    sortedOracles.setMedianRate(address(stableToken), goldAmountForRate.mul(4));
    vm.warp(block.timestamp + bucketUpdateFrequency);
    sortedOracles.setMedianTimestampToNow(address(stableToken));

    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == initialStableBucket * 2);
    assert(sellBucketSize == initialGoldBucket);
  }

  function test_getBuyTokenAmount_shouldReturnCorrectNumberOfTokens(uint256 amount) public {
    vm.assume(amount < initialGoldBucket);
    uint256 buyAmount = exchange.getBuyTokenAmount(amount, true);
    uint256 expectedBuyAmount = getBuyTokenAmount(amount, initialGoldBucket, initialStableBucket);
    assertEq(buyAmount, expectedBuyAmount);
  }

  function test_getSellTokenAmount_shouldReturnCorrectNumberOfTokens(uint256 amount) public {
    vm.assume(amount < initialGoldBucket);
    uint256 sellAmount = exchange.getSellTokenAmount(amount, true);
    uint256 expectedSellAmount = getSellTokenAmount(amount, initialGoldBucket, initialStableBucket);
    assertEq(sellAmount, expectedSellAmount);
  }
}

contract Exchange_sell is Exchange_stableActivated {
  address seller;
  uint256 constant sellerGoldBalance = 100000000000000000000;
  uint256 constant sellerStableBalance = 100000000000000000000;

  function setUp() public {
    super.setUp();
    seller = vm.addr(2);
    goldToken.mint(seller, sellerGoldBalance);
    stableToken.mint(seller, sellerStableBalance);
  }

  function approveExchange(uint256 amount, bool isCelo) internal {
    changePrank(seller);
    if (isCelo) {
      goldToken.approve(address(exchange), amount);
    } else {
      stableToken.approve(address(exchange), amount);
    }
  }

  function __sell(uint256 amount, uint256 minBuyAmount, bool sellGold) internal returns (uint256) {
    changePrank(seller);
    return exchange.sell(amount, minBuyAmount, sellGold);
  }

  function test_goldForStables_shouldIncreaseStableBalance(uint256 goldAmount) public {
    vm.assume(goldAmount <= sellerGoldBalance);
    approveExchange(goldAmount, true);
    uint256 stableBalanceBefore = stableToken.balanceOf(seller);
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );
    __sell(goldAmount, expectedStableAmount, true);
    assertEq(stableToken.balanceOf(seller), stableBalanceBefore + expectedStableAmount);
  }

  function test_goldForStables_shouldDecreaseGoldBalance(uint256 goldAmount) public {
    vm.assume(goldAmount <= sellerGoldBalance);
    approveExchange(goldAmount, true);
    uint256 goldBalanceBefore = stableToken.balanceOf(seller);
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );
    __sell(goldAmount, expectedStableAmount, true);
    assertEq(goldToken.balanceOf(seller), goldBalanceBefore - goldAmount);
  }

  function test_goldForStables_shouldRemoveAllowance(uint256 goldAmount) public {
    vm.assume(goldAmount <= sellerGoldBalance);
    approveExchange(goldAmount, true);
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );
    __sell(goldAmount, expectedStableAmount, true);
    assertEq(goldToken.allowance(seller, address(exchange)), 0);
  }

  function test_goldForStables_shouldIncreaseReserveBalance(uint256 goldAmount) public {
    vm.assume(goldAmount > 10);
    vm.assume(goldAmount <= sellerGoldBalance);
    uint256 reserveBalance = goldToken.balanceOf(address(reserve));
    approveExchange(goldAmount, true);
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );
    __sell(goldAmount, expectedStableAmount, true);
    assertEq(goldToken.balanceOf(address(reserve)), reserveBalance + goldAmount);
  }

  function test_goldForStables_shouldIncreaseStableTokenSupply(uint256 goldAmount) public {
    vm.assume(goldAmount <= sellerGoldBalance);
    approveExchange(goldAmount, true);
    uint256 stableSupply = stableToken.totalSupply();
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );
    __sell(goldAmount, expectedStableAmount, true);
    assertEq(stableToken.totalSupply(), stableSupply + expectedStableAmount);
  }

  function test_goldForStables_shouldAffectBuckets(uint256 goldAmount) public {
    vm.assume(goldAmount <= sellerGoldBalance);
    approveExchange(goldAmount, true);
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );
    __sell(goldAmount, expectedStableAmount, true);
    (uint256 mintableStable, uint256 tradableGold) = exchange.getBuyAndSellBuckets(true);
    assertEq(mintableStable, initialStableBucket - expectedStableAmount);
    assertEq(tradableGold, initialGoldBucket + goldAmount);
  }

  function test_goldForStables_shouldEmitExchangedEvent(uint256 goldAmount) public {
    vm.assume(goldAmount <= sellerGoldBalance);
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );

    vm.expectEmit(true, true, true, true, address(exchange));
    emit Exchanged(seller, goldAmount, expectedStableAmount, true);
    approveExchange(goldAmount, true);
    __sell(goldAmount, expectedStableAmount, true);
  }

  function test_goldForStables_revertsIfApprovalIsWrong(uint256 goldAmount) public {
    vm.assume(goldAmount <= sellerGoldBalance);
    approveExchange(goldAmount, true);
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );

    vm.expectRevert("transfer value exceeded sender's allowance for recipient");
    __sell(goldAmount + 1, expectedStableAmount, true);
  }

  function test_goldForStables_revertsIfMinBuyAmountUnsatisfied(uint256 goldAmount) public {
    vm.assume(goldAmount <= sellerGoldBalance);
    approveExchange(goldAmount, true);
    uint256 expectedStableAmount = getBuyTokenAmount(
      goldAmount,
      initialGoldBucket,
      initialStableBucket
    );

    vm.expectRevert("Calculated buyAmount was less than specified minBuyAmount");
    __sell(goldAmount, expectedStableAmount + 1, true);
  }
}

contract Exchange_exchange is Exchange_sell {
  function __sell(uint256 amount, uint256 minBuyAmount, bool sellGold) internal returns (uint256) {
    changePrank(seller);
    return exchange.exchange(amount, minBuyAmount, sellGold);
  }
}
