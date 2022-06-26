// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "celo-foundry/Test.sol";

import "../utils/WithRegistry.sol";
import "../utils/TokenHelpers.sol";

import "contracts/stability/Reserve.sol";
import "contracts/stability/test/MockSortedOracles.sol";
import "contracts/common/FixidityLib.sol";

contract ReserveTest is Test, WithRegistry, TokenHelpers {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  event TobinTaxStalenessThresholdSet(uint256 value);
  event DailySpendingRatioSet(uint256 ratio);
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

  address constant exchangeAddress = address(0xe7c45fa);
  uint256 constant tobinTaxStalenessThreshold = 600;
  uint256 constant dailySpendingRatio = 1000000000000000000000000;
  uint256 constant sortedOraclesDenominator = 1000000000000000000000000;
  uint256 tobinTax = FixidityLib.newFixedFraction(5, 1000).unwrap();
  uint256 tobinTaxReserveRatio = FixidityLib.newFixedFraction(2, 1).unwrap();

  address deployer;
  address rando;

  Reserve reserve;
  MockSortedOracles sortedOracles;

  function setUp() public {
    deployer = actor("deployer");
    changePrank(deployer);
    reserve = new Reserve(true);
    sortedOracles = new MockSortedOracles();

    changePrank(registryOwner);
    registry.setAddressFor("SortedOracles", address(sortedOracles));
    registry.setAddressFor("Exchange", exchangeAddress);
    changePrank(deployer);

    bytes32[] memory initialAssetAllocationSymbols = new bytes32[](1);
    initialAssetAllocationSymbols[0] = bytes32("cGLD");
    uint256[] memory initialAssetAllocationWeights = new uint256[](1);
    initialAssetAllocationWeights[0] = FixidityLib.newFixed(1).unwrap();

    reserve.initialize(
      address(registry),
      tobinTaxStalenessThreshold,
      dailySpendingRatio,
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
  }

  function test_init_onlyCallableOnce() public {
    vm.expectRevert("contract already initialized");
    reserve.initialize(address(registry), 0, 0, 0, 0, new bytes32[](0), new uint256[](0), 0, 0);
  }

  function test_tobinTax_canBeSetByOwner() public {
    uint256 newValue = 123;
    vm.expectEmit(true, true, true, true, address(reserve));
    emit TobinTaxSet(newValue);
    reserve.setTobinTax(newValue);
    assertEq(reserve.tobinTax(), newValue);
  }

  function test_tobinTax_canNotBeSetByRando() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setTobinTax(100);
  }

  function test_tobinTax_canNotBeGt1() public {
    vm.expectRevert("tobin tax cannot be larger than 1");
    reserve.setTobinTax(FixidityLib.newFixed(1).unwrap().add(1));
  }

  function test_tobinTaxReserveRation_canBeSetByOwner() public {
    uint256 newValue = 123;
    vm.expectEmit(true, true, true, true, address(reserve));
    emit TobinTaxReserveRatioSet(newValue);
    reserve.setTobinTaxReserveRatio(newValue);
    assertEq(reserve.tobinTaxReserveRatio(), newValue);
  }

  function test_tobinTaxReserveRatio_canNotBeSetByRando() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setTobinTaxReserveRatio(100);
  }

  function test_dailySpendingRatio_canBeSetByOwner() public {
    uint256 newValue = 123;
    vm.expectEmit(true, true, true, true, address(reserve));
    emit DailySpendingRatioSet(newValue);
    reserve.setDailySpendingRatio(newValue);
    assertEq(reserve.getDailySpendingRatio(), newValue);
  }

  function test_dailySpendingRatio_canNotBeSetByRando() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setDailySpendingRatio(100);
  }

  function test_dailySpendingRatio_canNotBeGt1() public {
    vm.expectRevert("spending ratio cannot be larger than 1");
    reserve.setDailySpendingRatio(FixidityLib.newFixed(1).unwrap().add(1));
  }

  function test_registry_canBeSetByOwner() public {
    address newValue = address(0x1234);
    reserve.setRegistry(newValue);
    assertEq(address(reserve.registry()), newValue);
  }

  function test_registry_canNotBeSetByRando() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.setRegistry(address(0x1234));
  }

  function test_addToken_addsATokenOnce() public {
    address token = address(0x1234);
    sortedOracles.setMedianRate(token, sortedOraclesDenominator);
    vm.expectEmit(true, true, true, true, address(reserve));
    emit TokenAdded(token);
    reserve.addToken(token);
    assert(reserve.isToken(token));
    vm.expectRevert("token addr already registered");
    reserve.addToken(token);
  }

  function test_addToken_canNotBeCalledByRando() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.addToken(address(0x1234));
  }

  function test_removeToken_removesTokenIfExists() public {
    address token = address(0x1234);

    vm.expectRevert("token addr was never registered");
    reserve.removeToken(token, 0);

    sortedOracles.setMedianRate(token, sortedOraclesDenominator);
    reserve.addToken(token);

    vm.expectEmit(true, true, true, true, address(reserve));
    emit TokenRemoved(token, 0);
    reserve.removeToken(token, 0);
  }

  function test_removeToken_canNotBeCalledByRando() public {
    changePrank(rando);
    vm.expectRevert("Ownable: caller is not the owner");
    reserve.removeToken(address(0x1234), 0);
  }
}

// contract ReserveTest_transferAndSpenders is ReserveTest {
//   uint256 constant reserveCeloBalance = 100000;
//   address constant otherReserveAddress = address(0x1234);
//   address spender;
//
//   function setUp() public {
//     spender = vm.addr(0x3);
//     vm.deal(address(reserve), reserveCeloBalance);
//     reserve.addOtherReserveAddress(otherReserveAddress);
//   }
// }

