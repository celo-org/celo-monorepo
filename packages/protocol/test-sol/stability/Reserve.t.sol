// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "celo-foundry/Test.sol";

import "../utils/WithRegistry.sol";
import "../utils/TokenHelpers.sol";
import "../utils/DummyErc20.sol";

import "contracts/stability/Reserve.sol";
import "contracts/stability/test/MockSortedOracles.sol";
import "contracts/stability/test/MockStableToken.sol";
import "contracts/common/FixidityLib.sol";

contract ReserveTest is Test, WithRegistry, TokenHelpers {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  event TobinTaxStalenessThresholdSet(uint256 value);
  event DailySpendingRatioSet(address[] tokenAddresses, uint256[] dailySpendingRatio);
  event TokenAdded(address indexed token);
  event TokenRemoved(address indexed token, uint256 index);
  event SpenderAdded(address indexed spender);
  event SpenderRemoved(address indexed spender);
  event OtherReserveAddressAdded(address indexed otherReserveAddress);
  event OtherReserveAddressRemoved(address indexed otherReserveAddress, uint256 index);
  event AssetAllocationSet(bytes32[] symbols, uint256[] weights);
  event ReserveGoldTransferred(address indexed spender, address indexed to, uint256 value);
  event TobinTaxSet(uint256 value);
  event TobinTaxReserveRatioSet(uint256 value);
  event ExchangeSpenderAdded(address indexed exchangeSpender);
  event ExchangeSpenderRemoved(address indexed exchangeSpender);
  event ReserveErc20TokenTransferred(
    address indexed spender,
    address indexed to,
    uint256 value,
    address token
  );

  address constant exchangeAddress = address(0xe7c45fa);
  uint256 constant tobinTaxStalenessThreshold = 600;
  uint256 constant dailySpendingRatio = 1000000000000000000000000;
  uint256 constant sortedOraclesDenominator = 1000000000000000000000000;
  uint256 tobinTax = FixidityLib.newFixedFraction(5, 1000).unwrap();
  uint256 tobinTaxReserveRatio = FixidityLib.newFixedFraction(2, 1).unwrap();
  bytes32 constant GOLD_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked("GoldToken"));
  address goldTokenAddress = registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID);

  address deployer;
  address rando;

  Reserve reserve = new Reserve(true);
  MockSortedOracles sortedOracles = new MockSortedOracles();
  DummyERC20 dummyToken1 = new DummyERC20();
  DummyERC20 dummyToken2 = new DummyERC20();

  function setUp() public {
    rando = actor("rando");
    deployer = actor("deployer");
    changePrank(deployer);

    registry.setAddressFor("SortedOracles", address(sortedOracles));
    registry.setAddressFor("Exchange", exchangeAddress);

    bytes32[] memory initialAssetAllocationSymbols = new bytes32[](1);
    initialAssetAllocationSymbols[0] = bytes32("cGLD");
    uint256[] memory initialAssetAllocationWeights = new uint256[](1);
    initialAssetAllocationWeights[0] = FixidityLib.newFixed(1).unwrap();
    uint256[] memory dailySpendingRatios = new uint256[](3);
    dailySpendingRatios[0] = 1e24;
    dailySpendingRatios[1] = 1e24;
    dailySpendingRatios[2] = 1e24;
    address[] memory tokenAddresses = new address[](3);
    tokenAddresses[0] = goldTokenAddress;
    tokenAddresses[1] = address(dummyToken1);
    tokenAddresses[2] = address(dummyToken2);

    reserve.initialize(
      address(registry),
      tobinTaxStalenessThreshold,
      dailySpendingRatios,
      tokenAddresses,
      0,
      0,
      initialAssetAllocationSymbols,
      initialAssetAllocationWeights,
      tobinTax,
      tobinTaxReserveRatio
    );
  }
}

contract ReserveTest_initAndSetters is ReserveTest {
  function test_init_setsParameters() public {
    assertEq(reserve.owner(), deployer);
    assertEq(address(reserve.registry()), address(registry));
    assertEq(reserve.tobinTaxStalenessThreshold(), tobinTaxStalenessThreshold);

    vm.expectRevert("contract already initialized");
    reserve.initialize(
      address(registry),
      0,
      new uint256[](0),
      new address[](0),
      0,
      0,
      new bytes32[](0),
      new uint256[](0),
      0,
      0
    );
  }

  function test_tobinTax() public {
    uint256 newValue = 123;
    vm.expectEmit(true, true, true, true, address(reserve));
    emit TobinTaxSet(newValue);
    reserve.setTobinTax(newValue);
    assertEq(reserve.tobinTax(), newValue);

    vm.expectRevert("tobin tax cannot be larger than 1");
    reserve.setTobinTax(FixidityLib.newFixed(1).unwrap().add(1));

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setTobinTax(100);
  }

  function test_tobinTaxReserveRation() public {
    uint256 newValue = 123;
    vm.expectEmit(true, true, true, true, address(reserve));
    emit TobinTaxReserveRatioSet(newValue);
    reserve.setTobinTaxReserveRatio(newValue);
    assertEq(reserve.tobinTaxReserveRatio(), newValue);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setTobinTaxReserveRatio(100);
  }

  function test_dailySpendingRatio() public {
    address[] memory tokenAddresses = new address[](2);
    tokenAddresses[0] = goldTokenAddress;
    tokenAddresses[1] = address(dummyToken1);
    uint256[] memory newValues = new uint256[](2);
    newValues[0] = 123;
    newValues[1] = 124;
    vm.expectEmit(true, true, true, true, address(reserve));
    emit DailySpendingRatioSet(tokenAddresses, newValues);
    reserve.setDailySpendingRatio(tokenAddresses, newValues);
    //have to pass a token address to get daily spending ratio
    //I'll change this
    assert(reserve.getDailySpendingRatio(goldTokenAddress) == newValues[0]);
    assert(reserve.getDailySpendingRatio(address(dummyToken1)) == newValues[1]);

    newValues[0] = FixidityLib.newFixed(1).unwrap().add(1);
    newValues[1] = FixidityLib.newFixed(1).unwrap().add(1);
    vm.expectRevert("spending ratio cannot be larger than 1");
    reserve.setDailySpendingRatio(tokenAddresses, newValues);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setDailySpendingRatio(tokenAddresses, newValues);
  }

  function test_registry() public {
    address newValue = address(0x1234);
    reserve.setRegistry(newValue);
    assertEq(address(reserve.registry()), newValue);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setRegistry(address(0x1234));
  }

  function test_addToken() public {
    address token = address(0x1234);
    sortedOracles.setMedianRate(token, sortedOraclesDenominator);
    vm.expectEmit(true, true, true, true, address(reserve));
    emit TokenAdded(token);
    reserve.addToken(token);
    assert(reserve.isToken(token));
    vm.expectRevert("token addr already registered");
    reserve.addToken(token);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.addToken(address(0x1234));
  }

  function test_removeToken() public {
    address token = address(0x1234);

    vm.expectRevert("token addr was never registered");
    reserve.removeToken(token, 0);

    sortedOracles.setMedianRate(token, sortedOraclesDenominator);
    reserve.addToken(token);

    vm.expectEmit(true, true, true, true, address(reserve));
    emit TokenRemoved(token, 0);
    reserve.removeToken(token, 0);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.removeToken(address(0x1234), 0);
  }

  function test_tobinTaxStalenessThreshold() public {
    uint256 newThreshold = 1;
    vm.expectEmit(true, true, true, true, address(reserve));
    emit TobinTaxStalenessThresholdSet(newThreshold);
    reserve.setTobinTaxStalenessThreshold(newThreshold);
    assertEq(reserve.tobinTaxStalenessThreshold(), newThreshold);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setTobinTaxStalenessThreshold(newThreshold);
  }

  function test_addOtherReserveAddress() public {
    address[] memory otherReserveAddresses = new address[](2);
    otherReserveAddresses[0] = address(0x1111);
    otherReserveAddresses[1] = address(0x2222);

    vm.expectEmit(true, true, true, true, address(reserve));
    emit OtherReserveAddressAdded(otherReserveAddresses[0]);
    reserve.addOtherReserveAddress(otherReserveAddresses[0]);

    vm.expectRevert("reserve addr already added");
    reserve.addOtherReserveAddress(otherReserveAddresses[0]);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.addOtherReserveAddress(otherReserveAddresses[1]);
    changePrank(deployer);

    vm.expectEmit(true, true, true, true, address(reserve));
    emit OtherReserveAddressAdded(otherReserveAddresses[1]);
    reserve.addOtherReserveAddress(otherReserveAddresses[1]);

    address[] memory recordedAddresses = reserve.getOtherReserveAddresses();
    assertEq(recordedAddresses, otherReserveAddresses);

    deal(otherReserveAddresses[0], 100000);
    deal(otherReserveAddresses[1], 100000);
    deal(address(reserve), 100000);
    assertEq(reserve.getReserveGoldBalance(), uint256(300000));
  }

  function test_removeOtherReserveAddress() public {
    address[] memory otherReserveAddresses = new address[](3);
    otherReserveAddresses[0] = address(0x1111);
    otherReserveAddresses[1] = address(0x2222);

    vm.expectRevert("reserve addr was never added");
    reserve.removeOtherReserveAddress(otherReserveAddresses[0], 0);

    reserve.addOtherReserveAddress(otherReserveAddresses[0]);
    reserve.addOtherReserveAddress(otherReserveAddresses[1]);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.removeOtherReserveAddress(otherReserveAddresses[0], 0);
    changePrank(deployer);

    vm.expectEmit(true, true, true, true, address(reserve));
    emit OtherReserveAddressRemoved(otherReserveAddresses[0], 0);
    reserve.removeOtherReserveAddress(otherReserveAddresses[0], 0);
    address[] memory recordedAddresses = reserve.getOtherReserveAddresses();
    assertEq(recordedAddresses.length, 1);
    assertEq(recordedAddresses[0], otherReserveAddresses[1]);
  }

  function test_setAssetAllocations() public {
    bytes32[] memory assetAllocationSymbols = new bytes32[](3);
    assetAllocationSymbols[0] = bytes32("cGLD");
    assetAllocationSymbols[1] = bytes32("BTC");
    assetAllocationSymbols[2] = bytes32("ETH");
    uint256[] memory assetAllocationWeights = new uint256[](3);
    assetAllocationWeights[0] = FixidityLib.newFixedFraction(1, 3).unwrap();
    assetAllocationWeights[1] = FixidityLib.newFixedFraction(1, 3).unwrap();
    assetAllocationWeights[2] = FixidityLib.newFixedFraction(1, 3).unwrap().add(1);

    vm.expectEmit(true, true, true, true, address(reserve));
    emit AssetAllocationSet(assetAllocationSymbols, assetAllocationWeights);
    reserve.setAssetAllocations(assetAllocationSymbols, assetAllocationWeights);
    assertEq(reserve.getAssetAllocationSymbols(), assetAllocationSymbols);
    assertEq(reserve.getAssetAllocationWeights(), assetAllocationWeights);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setAssetAllocations(assetAllocationSymbols, assetAllocationWeights);
    changePrank(deployer);

    assetAllocationWeights[2] = FixidityLib.newFixedFraction(1, 3).unwrap().add(100);
    vm.expectRevert("Sum of asset allocation must be 1");
    reserve.setAssetAllocations(assetAllocationSymbols, assetAllocationWeights);
    assetAllocationWeights[2] = FixidityLib.newFixedFraction(1, 3).unwrap().add(1);

    assetAllocationSymbols[2] = bytes32("BTC");
    vm.expectRevert("Cannot set weight twice");
    reserve.setAssetAllocations(assetAllocationSymbols, assetAllocationWeights);
    assetAllocationSymbols[2] = bytes32("ETH");

    assetAllocationSymbols[0] = bytes32("DAI");
    vm.expectRevert("Must set cGLD asset weight");
    reserve.setAssetAllocations(assetAllocationSymbols, assetAllocationWeights);
  }
}

contract ReserveTest_transfers is ReserveTest {
  uint256 constant reserveCeloBalance = 100000;
  address payable constant otherReserveAddress = address(0x1234);
  address spender;
  address[] tokenAddresses = [goldTokenAddress, address(dummyToken2)];
  uint256[] spendingRatios = [
    FixidityLib.newFixedFraction(2, 10).unwrap(),
    FixidityLib.newFixedFraction(1, 11).unwrap()
  ];

  function setUp() public {
    super.setUp();
    spender = actor("spender");
    deal(address(reserve), reserveCeloBalance);
    reserve.addOtherReserveAddress(otherReserveAddress);
    reserve.addSpender(spender);
    reserve.setDailySpendingRatio(tokenAddresses, spendingRatios);
    vm.warp(100 * 24 * 3600 + 445);
  }

  function test_transferGold() public {
    changePrank(spender);
    uint256 amount = reserveCeloBalance.div(10);

    reserve.transferGold(otherReserveAddress, amount);
    assertEq(otherReserveAddress.balance, amount);
    assertEq(address(reserve).balance, reserveCeloBalance - amount);

    vm.expectRevert("Exceeding spending limit");
    reserve.transferGold(otherReserveAddress, amount.mul(2));

    vm.warp(block.timestamp + 24 * 3600);
    reserve.transferGold(otherReserveAddress, amount.mul(2));
    assertEq(otherReserveAddress.balance, 3 * amount);

    vm.expectRevert("can only transfer to other reserve address");
    reserve.transferGold(address(0x234), amount);

    changePrank(deployer);
    reserve.removeSpender(spender);
    changePrank(spender);
    vm.warp(block.timestamp + 24 * 3600);
    vm.expectRevert("sender not allowed to transfer Reserve funds");
    reserve.transferGold(otherReserveAddress, amount);
  }

  function test_transferErc20Token() public {
    changePrank(spender);
    //erc20 token balance
    uint256 amount = reserveCeloBalance.div(10);
    //dummyerc20 token address
    reserve.transferErc20Token(address(dummyToken1), otherReserveAddress, amount);
    assertEq(otherReserveAddress.balance, amount);
    assertEq(address(reserve).balance, reserveCeloBalance - amount);

    vm.expectRevert("Exceeding spending limit");
    reserve.transferGold(otherReserveAddress, amount.mul(2));

    vm.warp(block.timestamp + 24 * 3600);

    vm.expectRevert("can only transfer to other reserve address");
    reserve.transferGold(address(0x234), amount);

    //test that if the spending limit was not set for the token, no limit applies

    changePrank(deployer);
    reserve.removeSpender(spender);
    changePrank(spender);
    vm.warp(block.timestamp + 24 * 3600);
    vm.expectRevert("sender not allowed to transfer Reserve funds");
    reserve.transferGold(otherReserveAddress, amount);
  }

  function test_addExchangeSpender() public {
    address exchangeSpender0 = address(0x22222);
    address exchangeSpender1 = address(0x33333);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.addExchangeSpender(exchangeSpender0);

    changePrank(deployer);
    vm.expectEmit(true, true, true, true, address(reserve));
    emit ExchangeSpenderAdded(exchangeSpender0);
    reserve.addExchangeSpender(exchangeSpender0);

    vm.expectRevert("Spender can't be null");
    reserve.addExchangeSpender(address(0x0));

    reserve.addExchangeSpender(exchangeSpender1);
    address[] memory spenders = reserve.getExchangeSpenders();
    assertEq(spenders[0], exchangeSpender0);
    assertEq(spenders[1], exchangeSpender1);
  }

  function test_removeExchangeSpender() public {
    address exchangeSpender0 = address(0x22222);
    address exchangeSpender1 = address(0x33333);
    reserve.addExchangeSpender(exchangeSpender0);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.removeExchangeSpender(exchangeSpender0, 0);

    changePrank(deployer);
    vm.expectEmit(true, true, true, true, address(reserve));
    emit ExchangeSpenderRemoved(exchangeSpender0);
    reserve.removeExchangeSpender(exchangeSpender0, 0);

    vm.expectRevert("Index is invalid");
    reserve.removeExchangeSpender(exchangeSpender0, 0);

    reserve.addExchangeSpender(exchangeSpender0);
    reserve.addExchangeSpender(exchangeSpender1);

    vm.expectRevert("Index is invalid");
    reserve.removeExchangeSpender(exchangeSpender0, 3);
    vm.expectRevert("Index does not match spender");
    reserve.removeExchangeSpender(exchangeSpender1, 0);

    reserve.removeExchangeSpender(exchangeSpender0, 0);
    address[] memory spenders = reserve.getExchangeSpenders();
    assertEq(spenders[0], exchangeSpender1);
  }

  function test_addSpender() public {
    address _spender = address(0x4444);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.addSpender(_spender);

    changePrank(deployer);
    vm.expectEmit(true, true, true, true, address(reserve));
    emit SpenderAdded(_spender);
    reserve.addSpender(_spender);

    vm.expectRevert("Spender can't be null");
    reserve.addSpender(address(0x0));
  }

  function test_removeSpender() public {
    address _spender = address(0x4444);

    reserve.addSpender(_spender);

    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.removeSpender(_spender);

    changePrank(deployer);
    vm.expectEmit(true, true, true, true, address(reserve));
    emit SpenderRemoved(_spender);
    reserve.removeSpender(_spender);
  }

  function test_transferExchangeGold_asExchangeFromRegistry() public {
    transferExchangeGoldSpecs(exchangeAddress);
  }

  function test_transferExchangeGold_asRegisteredExchange() public {
    address additionalExchange = address(0x6666);
    reserve.addExchangeSpender(additionalExchange);
    transferExchangeGoldSpecs(exchangeAddress);

    changePrank(deployer);
    reserve.removeExchangeSpender(additionalExchange, 0);

    changePrank(additionalExchange);
    vm.expectRevert("Address not allowed to spend");
    reserve.transferExchangeGold(address(0x1111), 1000);
  }

  function transferExchangeGoldSpecs(address caller) public {
    changePrank(caller);
    address payable dest = address(0x1111);
    reserve.transferExchangeGold(dest, 1000);
    assertEq(dest.balance, 1000);

    changePrank(spender);
    vm.expectRevert("Address not allowed to spend");
    reserve.transferExchangeGold(dest, 1000);

    changePrank(rando);
    vm.expectRevert("Address not allowed to spend");
    reserve.transferExchangeGold(dest, 1000);
  }

  function test_frozenGold() public {
    address[] memory tokenAddresses = new address[](1);
    tokenAddresses[0] = goldTokenAddress;
    uint256[] memory dailySpendingRatios = new uint256[](1);
    dailySpendingRatios[0] = FixidityLib.fixed1().unwrap();
    reserve.setDailySpendingRatio(tokenAddresses, dailySpendingRatios);
    vm.expectRevert("Cannot freeze more than balance");
    reserve.setFrozenGold(reserveCeloBalance + 1, 1);
    uint256 dailyUnlock = reserveCeloBalance.div(3);

    reserve.setFrozenGold(reserveCeloBalance, 3);
    changePrank(spender);
    vm.expectRevert("Exceeding spending limit");
    reserve.transferGold(otherReserveAddress, 1);
    vm.warp(block.timestamp + 3600 * 24);
    assertEq(reserve.getUnfrozenBalance(), dailyUnlock);
    reserve.transferGold(otherReserveAddress, dailyUnlock);
    vm.warp(block.timestamp + 3600 * 24);
    assertEq(reserve.getUnfrozenBalance(), dailyUnlock);
    reserve.transferGold(otherReserveAddress, dailyUnlock);
    vm.warp(block.timestamp + 3600 * 24);
    assertEq(reserve.getUnfrozenBalance(), dailyUnlock + 1);
    reserve.transferGold(otherReserveAddress, dailyUnlock);
  }
}

contract ReserveTest_tobinTax is ReserveTest {
  MockStableToken stableToken0;
  MockStableToken stableToken1;

  function setUp() public {
    super.setUp();

    bytes32[] memory assetAllocationSymbols = new bytes32[](2);
    assetAllocationSymbols[0] = bytes32("cGLD");
    assetAllocationSymbols[1] = bytes32("BTC");
    uint256[] memory assetAllocationWeights = new uint256[](2);
    assetAllocationWeights[0] = FixidityLib.newFixedFraction(1, 2).unwrap();
    assetAllocationWeights[1] = FixidityLib.newFixedFraction(1, 2).unwrap();

    reserve.setAssetAllocations(assetAllocationSymbols, assetAllocationWeights);

    stableToken0 = new MockStableToken();
    sortedOracles.setMedianRate(address(stableToken0), sortedOraclesDenominator.mul(10));

    stableToken1 = new MockStableToken();
    sortedOracles.setMedianRate(address(stableToken1), sortedOraclesDenominator.mul(10));

    reserve.addToken(address(stableToken0));
    reserve.addToken(address(stableToken1));
  }

  function setValues(uint256 reserveBalance, uint256 stableToken0Supply, uint256 stableToken1Supply)
    internal
  {
    deal(address(reserve), reserveBalance);
    stableToken0.setTotalSupply(stableToken0Supply);
    stableToken1.setTotalSupply(stableToken1Supply);
  }

  function getOrComputeTobinTaxFraction() internal returns (uint256) {
    (uint256 num, uint256 den) = reserve.getOrComputeTobinTax();
    return FixidityLib.newFixedFraction(num, den).unwrap();
  }

  function test_getReserveRatio() public {
    uint256 expected;

    setValues(1000000, 10000, 0);
    expected = FixidityLib.newFixed(2000000).divide(FixidityLib.newFixed(1000)).unwrap();
    assertEq(reserve.getReserveRatio(), expected);

    setValues(1000000, 10000, 30000);
    expected = FixidityLib.newFixed(2000000).divide(FixidityLib.newFixed(4000)).unwrap();
    assertEq(reserve.getReserveRatio(), expected);
  }

  function test_tobinTax() public {
    setValues(1000000, 400000, 500000);
    assertEq(getOrComputeTobinTaxFraction(), 0);
    setValues(1000000, 50000000, 50000000);
    // Is the same unless threshold passed
    assertEq(getOrComputeTobinTaxFraction(), 0);
    // Changes
    vm.warp(block.timestamp + tobinTaxStalenessThreshold);
    assertEq(getOrComputeTobinTaxFraction(), tobinTax);
  }
}
