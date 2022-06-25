// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "celo-foundry/Test.sol";

import "../mocks/MockGoldToken.sol";
import "../mocks/MockStableToken.sol";
import "../utils/WithRegistry.sol";

import "contracts/stability/Exchange.sol";
import "contracts/stability/StableToken.sol";
import "contracts/stability/test/MockReserve.sol";
import "contracts/stability/test/MockSortedOracles.sol";
import "contracts/common/FixidityLib.sol";
import "contracts/common/Freezer.sol";
import "contracts/common/Registry.sol";

contract ExchangeTest is Test, WithRegistry(0x1) {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  // Declare exchange events for matching
  event Exchanged(address indexed exchanger, uint256 sellAmount, uint256 buyAmount, bool soldCelo);
  event UpdateFrequencySet(uint256 updateFrequency);
  event MinimumReportsSet(uint256 minimumReports);
  event StableTokenSet(address indexed stable);
  event SpreadSet(uint256 spread);
  event ReserveFractionSet(uint256 reserveFraction);
  event BucketsUpdated(uint256 celoBucket, uint256 stableBucket);

  address deployer;
  address rando;

  Exchange exchange;
  Freezer freezer;
  MockStableToken stableToken;
  MockGoldToken celoToken;
  MockReserve reserve;
  MockSortedOracles sortedOracles;

  uint256 constant bucketUpdateFrequency = 60 * 60;
  uint256 constant initialReserveBalance = 10000000000000000000000;
  FixidityLib.Fraction reserveFraction = FixidityLib.newFixedFraction(5, 100);
  uint256 initialCeloBucket = FixidityLib
    .newFixed(initialReserveBalance)
    .multiply(reserveFraction)
    .fromFixed();
  uint256 constant amountForRate = 1000000000000000000000000;
  uint256 constant stableAmountForRate = 2000000000000000000000000;
  uint256 initialStableBucket = initialCeloBucket * 2;
  FixidityLib.Fraction spread = FixidityLib.newFixedFraction(3, 1000);

  function setUp() public {
    deployer = vm.addr(0x1);
    vm.label(deployer, "Deployer");
    rando = vm.addr(0x2);
    vm.label(rando, "Rando");
    // Go somwehre in the future
    vm.warp(60 * 60 * 24 * 7 * 100);
    vm.startPrank(deployer);
    freezer = new Freezer(true);
    celoToken = new MockGoldToken();
    reserve = new MockReserve();
    exchange = new Exchange(true);
    stableToken = new MockStableToken();

    registry.setAddressFor("Freezer", address(freezer));
    registry.setAddressFor("GoldToken", address(celoToken));
    registry.setAddressFor("Reserve", address(reserve));
    registry.setAddressFor("StableToken", address(stableToken));
    registry.setAddressFor("GrandaMento", address(0x1));
    registry.setAddressFor("Exchange", address(exchange));
    reserve.setGoldToken(address(celoToken));
    celoToken.mint(address(reserve), initialReserveBalance);

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

  function test_initialize_setsStableTokenIdentifier() public view {
    bytes32 identifier = exchange.stableTokenRegistryId();
    assert(identifier == keccak256("StableToken"));
  }

  function test_initialize_canOnlyBeCalledOnce() public {
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

  function test_activateStable_setsTheStableStorageAddress() public {
    assert(exchange.stable() == address(0));
    vm.expectEmit(true, true, true, true, address(exchange));
    emit StableTokenSet(address(stableToken));
    exchange.activateStable();
    assert(exchange.stable() == address(stableToken));
  }

  function test_activateStable_canOnlyBeCalledByOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    changePrank(rando);
    exchange.activateStable();
  }

  function test_activateStable_canOnlyBeCalledOnce() public {
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

contract ExchangeTest_stableActivated is ExchangeTest {
  function setUp() public {
    super.setUp();
    exchange.activateStable();
  }
}

contract ExchangeTest_buyAndSellValues is ExchangeTest_stableActivated {
  function test_getBuyAndSellBuckets_returnsTheCorrectAmountOfTokens() public view {
    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == initialStableBucket);
    assert(sellBucketSize == initialCeloBucket);
  }

  function test_getBuyAndSellBuckets_afterReserveChange_isTheSameIfNotStale() public {
    celoToken.mint(address(reserve), initialReserveBalance);

    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == initialStableBucket);
    assert(sellBucketSize == initialCeloBucket);
  }

  function test_getBuyAndSellBuckets_afterReserveChange_updatesIfTimeHasPassed() public {
    celoToken.mint(address(reserve), initialReserveBalance);
    vm.warp(block.timestamp + bucketUpdateFrequency);
    sortedOracles.setMedianTimestampToNow(address(stableToken));

    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == 2 * initialStableBucket);
    assert(sellBucketSize == 2 * initialCeloBucket);
  }

  function test_getBuyAndSellBuckets_afterOracelUpdate_isTheSameIfNotStale() public {
    sortedOracles.setMedianRate(address(stableToken), amountForRate.mul(4));
    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == initialStableBucket);
    assert(sellBucketSize == initialCeloBucket);
  }

  function test_getBuyAndSellBuckets_afterOracelUpdate_updatesIfTimeHasPassed() public {
    sortedOracles.setMedianRate(address(stableToken), amountForRate.mul(4));
    vm.warp(block.timestamp + bucketUpdateFrequency);
    sortedOracles.setMedianTimestampToNow(address(stableToken));

    (uint256 buyBucketSize, uint256 sellBucketSize) = exchange.getBuyAndSellBuckets(true);
    assert(buyBucketSize == initialStableBucket * 2);
    assert(sellBucketSize == initialCeloBucket);
  }

  function test_getBuyTokenAmount_returnsCorrectNumberOfTokens(uint256 amount) public {
    vm.assume(amount < initialCeloBucket);
    uint256 buyAmount = exchange.getBuyTokenAmount(amount, true);
    uint256 expectedBuyAmount = getBuyTokenAmount(amount, initialCeloBucket, initialStableBucket);
    assertEq(buyAmount, expectedBuyAmount);
  }

  function test_getSellTokenAmount_returnsCorrectNumberOfTokens(uint256 amount) public {
    vm.assume(amount < initialCeloBucket);
    uint256 sellAmount = exchange.getSellTokenAmount(amount, true);
    uint256 expectedSellAmount = getSellTokenAmount(amount, initialCeloBucket, initialStableBucket);
    assertEq(sellAmount, expectedSellAmount);
  }
}

contract ExchangeTest_sell is ExchangeTest_stableActivated {
  address seller;
  uint256 constant sellerCeloBalance = 100000000000000000000;
  uint256 constant sellerStableBalance = 100000000000000000000;

  function setUp() public {
    super.setUp();
    seller = vm.addr(2);
    vm.label(seller, "Seller");
    celoToken.mint(seller, sellerCeloBalance);
    stableToken.mint(seller, sellerStableBalance);
  }

  // This function will be overriden to test both `sell` and `exchange` functions
  function sell(uint256 amount, uint256 minBuyAmount, bool sellCelo) internal returns (uint256) {
    changePrank(seller);
    return exchange.sell(amount, minBuyAmount, sellCelo);
  }

  function approveExchange(uint256 amount, bool sellCelo) internal {
    changePrank(seller);
    if (sellCelo) {
      celoToken.approve(address(exchange), amount);
    } else {
      stableToken.approve(address(exchange), amount);
    }
  }

  function approveAndSell(uint256 amount, bool sellCelo)
    internal
    returns (uint256 expected, uint256 received)
  {
    approveExchange(amount, sellCelo);
    if (sellCelo) {
      expected = getBuyTokenAmount(amount, initialCeloBucket, initialStableBucket);
    } else {
      expected = getBuyTokenAmount(amount, initialStableBucket, initialCeloBucket);
    }
    received = sell(amount, expected, sellCelo);
  }

  function test_celoForStables_increasesStableBalance(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance && amount > 10);
    (uint256 expected, ) = approveAndSell(amount, true);
    assertEq(stableToken.balanceOf(seller), sellerStableBalance + expected);
  }

  function test_celoForStables_decreasesCeloBalance(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance);
    approveAndSell(amount, true);
    assertEq(celoToken.balanceOf(seller), sellerCeloBalance - amount);
  }

  function test_celoForStables_removesAllowance(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance);
    approveAndSell(amount, true);
    assertEq(celoToken.allowance(seller, address(exchange)), 0);
  }

  function test_celoForStables_increasesReserveBalance(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance);
    approveAndSell(amount, true);
    assertEq(celoToken.balanceOf(address(reserve)), initialReserveBalance + amount);
  }

  function test_celoForStables_increasesStableTokenSupply(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance);
    uint256 stableSupply = stableToken.totalSupply();
    (uint256 expected, ) = approveAndSell(amount, true);
    assertEq(stableToken.totalSupply(), stableSupply + expected);
  }

  function test_celoForStables_affectsBuckets(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance);
    (uint256 expected, ) = approveAndSell(amount, true);
    (uint256 mintableStable, uint256 tradableCelo) = exchange.getBuyAndSellBuckets(true);
    assertEq(mintableStable, initialStableBucket - expected);
    assertEq(tradableCelo, initialCeloBucket + amount);
  }

  function test_celoForStables_emitsExchangedEvent(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance);
    uint256 expectedStableAmount = getBuyTokenAmount(
      amount,
      initialCeloBucket,
      initialStableBucket
    );

    vm.expectEmit(true, true, true, true, address(exchange));
    emit Exchanged(seller, amount, expectedStableAmount, true);
    approveExchange(amount, true);
    sell(amount, expectedStableAmount, true);
  }

  function test_celoForStables_revertsIfApprovalIsWrong(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance);
    approveExchange(amount, true);
    uint256 expectedStableAmount = getBuyTokenAmount(
      amount,
      initialCeloBucket,
      initialStableBucket
    );
    vm.expectRevert("transfer value exceeded sender's allowance for recipient");
    sell(amount + 1, expectedStableAmount, true);
  }

  function test_celoForStables_revertsIfMinBuyAmountUnsatisfied(uint256 amount) public {
    vm.assume(amount <= sellerCeloBalance);
    approveExchange(amount, true);
    uint256 expectedStableAmount = getBuyTokenAmount(
      amount,
      initialCeloBucket,
      initialStableBucket
    );

    vm.expectRevert("Calculated buyAmount was less than specified minBuyAmount");
    sell(amount, expectedStableAmount + 1, true);
  }

  function test_celoForStables_whenBucketsStale_whenOldestReportNotExpired_exchangeSucceeds()
    public
  {
    uint256 amount = 1000;
    (uint256 expected, ) = approveAndSell(amount, true);
    assertEq(stableToken.balanceOf(seller), sellerStableBalance + expected);
  }

  function test_stableForCelo_decreasesStableBalance(uint256 amount) public {
    vm.assume(amount < sellerStableBalance && amount > 10);
    approveAndSell(amount, false);
    assertEq(stableToken.balanceOf(seller), sellerStableBalance - amount);
  }

  function test_stableForCelo_increasesCeloBalance(uint256 amount) public {
    vm.assume(amount < sellerStableBalance && amount > 10);
    (uint256 expected, ) = approveAndSell(amount, false);
    assertEq(celoToken.balanceOf(seller), sellerCeloBalance + expected);
  }

  function test_stableForCelo_removesAllowance(uint256 amount) public {
    vm.assume(amount < sellerStableBalance && amount > 10);
    approveAndSell(amount, false);
    assertEq(stableToken.allowance(seller, address(exchange)), 0);
  }

  function test_stableForCelo_decreasesReserveBalance(uint256 amount) public {
    vm.assume(amount < sellerStableBalance);
    (uint256 expected, ) = approveAndSell(amount, false);
    assertEq(celoToken.balanceOf(address(reserve)), initialReserveBalance - expected);
  }

  function test_stableForCelo_decreasesStableTokenSupply(uint256 amount) public {
    vm.assume(amount < sellerStableBalance);
    uint256 supplyBefore = stableToken.totalSupply();
    approveAndSell(amount, false);
    assertEq(stableToken.totalSupply(), supplyBefore - amount);
  }

  function test_stableForCelo_affectsBuckets(uint256 amount) public {
    vm.assume(amount < sellerStableBalance && amount > 10000);
    (uint256 expected, ) = approveAndSell(amount, false);
    (uint256 mintableStable, uint256 tradableCelo) = exchange.getBuyAndSellBuckets(true);
    assertEq(mintableStable, initialStableBucket + amount);
    assertEq(tradableCelo, initialCeloBucket - expected);
  }

  function test_stableForCelo_emitExchangedEvent(uint256 amount) public {
    vm.assume(amount < sellerStableBalance);
    uint256 expectedCelo = getBuyTokenAmount(amount, initialStableBucket, initialCeloBucket);
    changePrank(seller);
    approveExchange(amount, false);
    vm.expectEmit(true, true, true, true, address(exchange));
    emit Exchanged(seller, amount, expectedCelo, false);
    sell(amount, expectedCelo, false);
  }

  function test_stableForCelo_revertWithoutApproval(uint256 amount) public {
    vm.assume(amount < sellerStableBalance);
    uint256 expectedCelo = getBuyTokenAmount(amount, initialStableBucket, initialCeloBucket);
    changePrank(seller);
    approveExchange(amount, false);
    vm.expectRevert("transfer value exceeded sender's allowance for recipient");
    sell(amount + 1, expectedCelo, false);
  }

  function test_stableForCelo_revertIfMinBuyAmountUnsatisfied(uint256 amount) public {
    vm.assume(amount < sellerStableBalance);
    uint256 expectedCelo = getBuyTokenAmount(amount, initialStableBucket, initialCeloBucket);
    changePrank(seller);
    approveExchange(amount, false);
    vm.expectRevert("Calculated buyAmount was less than specified minBuyAmount");
    sell(amount, expectedCelo + 1, false);
  }
}

contract ExchangeTest_exchange is ExchangeTest_sell {
  function sell(uint256 amount, uint256 minBuyAmount, bool sellCelo) internal returns (uint256) {
    changePrank(seller);
    return exchange.exchange(amount, minBuyAmount, sellCelo);
  }
}
