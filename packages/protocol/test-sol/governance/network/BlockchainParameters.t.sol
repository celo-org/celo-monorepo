pragma solidity ^0.5.13;

import "@celo-contracts/governance/BlockchainParameters.sol";

import "celo-foundry/Test.sol";

import { Constants } from "@test-sol/constants.sol";
import { Utils } from "@test-sol/utils.sol";

contract BlockchainParametersTest is Test, Constants, Utils {
  // using the mainnet epoch size would not allow to test an edge case
  uint256 constant EPOCH_SIZE = 100;
  uint256 constant gasLimit = 7000000;
  uint256 constant gasForNonGoldCurrencies = 50000;
  address nonOwner;

  BlockchainParameters blockchainParameters;

  event IntrinsicGasForAlternativeFeeCurrencySet(uint256 gas);
  event BlockGasLimitSet(uint256 limit);
  event UptimeLookbackWindowSet(uint256 window, uint256 activationEpoch);
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  function setUp() public {
    nonOwner = actor("nonOwner");
    ph.setEpochSize(EPOCH_SIZE);
    blockchainParameters = new BlockchainParameters(true);
  }
}

contract BlockchainParametersTest_initialize is BlockchainParametersTest {
  uint256 constant lookbackWindow = 20;

  function test_ShouldSetTheVariables() public {
    blockchainParameters.initialize(gasForNonGoldCurrencies, gasLimit, lookbackWindow);
    assertEq(blockchainParameters.blockGasLimit(), gasLimit);
    blockTravel(EPOCH_SIZE);
    assertEq(blockchainParameters.getUptimeLookbackWindow(), lookbackWindow);
  }

  function test_Emits_IntrinsicGasForAlternativeFeeCurrencySet() public {
    vm.expectEmit(true, true, true, true);
    emit IntrinsicGasForAlternativeFeeCurrencySet(gasForNonGoldCurrencies);
    blockchainParameters.initialize(gasForNonGoldCurrencies, gasLimit, lookbackWindow);
  }

  function test_Emits_UptimeLookbackWindowSet() public {
    vm.expectEmit(true, true, true, true);
    emit UptimeLookbackWindowSet(lookbackWindow, 2);
    blockchainParameters.initialize(gasForNonGoldCurrencies, gasLimit, lookbackWindow);
  }

  function test_Emits_OwnershipTransferred() public {
    vm.expectEmit(true, true, true, true);
    emit OwnershipTransferred(address(this), address(this));
    blockchainParameters.initialize(gasForNonGoldCurrencies, gasLimit, lookbackWindow);
  }
}

contract BlockchainParametersTest_setBlockGasLimit is BlockchainParametersTest {
  function test_ShouldSetTheVariable() public {
    blockchainParameters.setBlockGasLimit(gasLimit);
    assertEq(blockchainParameters.blockGasLimit(), gasLimit);
  }

  function test_Emits_BlockGasLimitSet() public {
    vm.expectEmit(true, true, true, true);
    emit BlockGasLimitSet(gasLimit);
    blockchainParameters.setBlockGasLimit(gasLimit);
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    blockchainParameters.setBlockGasLimit(gasLimit);
  }
}

contract BlockchainParametersTestSet_intrinsicGasForAlternativeFeeCurrency is
  BlockchainParametersTest
{
  function test_ShouldSetTheVariable() public {
    blockchainParameters.setIntrinsicGasForAlternativeFeeCurrency(gasForNonGoldCurrencies);
    assertEq(blockchainParameters.intrinsicGasForAlternativeFeeCurrency(), gasForNonGoldCurrencies);
  }

  function test_Emits_intrinsicGasForAlternativeFeeCurrencySet() public {
    vm.expectEmit(true, true, true, true);
    emit IntrinsicGasForAlternativeFeeCurrencySet(gasForNonGoldCurrencies);
    blockchainParameters.setIntrinsicGasForAlternativeFeeCurrency(gasForNonGoldCurrencies);
  }

  function test_Revert_WhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    blockchainParameters.setIntrinsicGasForAlternativeFeeCurrency(gasForNonGoldCurrencies);
  }
}

contract BlockchainParametersTest_getUptimeLookbackWindow is BlockchainParametersTest {
  function test_dRevert_WhenNotSet() public {
    vm.expectRevert("UptimeLookbackWindow is not initialized");
    blockchainParameters.getUptimeLookbackWindow();
  }

  function test_Revert_WhenInitializedButOnCurrentEpoch() public {
    blockchainParameters.setUptimeLookbackWindow(20);
    vm.expectRevert("UptimeLookbackWindow is not initialized");
    blockchainParameters.getUptimeLookbackWindow();
  }
}

contract BlockchainParametersTest_setUptimeLookbackWindow is BlockchainParametersTest {
  uint256 constant newValue = 20;
  uint256 constant otherValue = 50;

  function test_ShouldSetTheValueForNextEpoch() public {
    blockchainParameters.setUptimeLookbackWindow(newValue);
    blockTravel(EPOCH_SIZE);
    assertEq(blockchainParameters.getUptimeLookbackWindow(), newValue);

  }

  function test_MultipleCallsWithinEpochOnlyAppliesLast() public {
    blockchainParameters.setUptimeLookbackWindow(newValue);
    blockchainParameters.setUptimeLookbackWindow(otherValue);
    blockTravel(EPOCH_SIZE);
    assertEq(blockchainParameters.getUptimeLookbackWindow(), otherValue);
  }

  function test_Emits_UptimeLookbackWindowSet() public {
    vm.expectEmit(true, true, true, true);
    emit UptimeLookbackWindowSet(newValue, 2);
    blockchainParameters.setUptimeLookbackWindow(newValue);
  }

  function test_Revert_WhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    blockchainParameters.setUptimeLookbackWindow(newValue);
  }

  function test_Revert_ShouldFail_WhenUsingValueLowerThanSafeMinimum() public {
    vm.expectRevert("UptimeLookbackWindow must be within safe range");
    blockchainParameters.setUptimeLookbackWindow(2);
  }

  function test_Revert_WhenUsingValueGreaterThanSafeMaximum() public {
    vm.expectRevert("UptimeLookbackWindow must be within safe range");
    blockchainParameters.setUptimeLookbackWindow(721);

  }

  function test_Revert_WhenUsingValueGreaterThanEpochsizeminus2() public {
    vm.expectRevert("UptimeLookbackWindow must be smaller or equal to epochSize - 2");
    // 720 is harcoded as maximum in the code
    blockchainParameters.setUptimeLookbackWindow(EPOCH_SIZE - 1);
  }
}
