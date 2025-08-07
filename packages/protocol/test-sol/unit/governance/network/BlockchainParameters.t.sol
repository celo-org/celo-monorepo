pragma solidity ^0.5.13;

import "@celo-contracts/governance/BlockchainParameters.sol";

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

contract BlockchainParametersTest is TestWithUtils {
  uint256 constant gasLimit = 7000000;
  uint256 constant gasForNonGoldCurrencies = 50000;
  address nonOwner;

  BlockchainParameters blockchainParameters;

  event IntrinsicGasForAlternativeFeeCurrencySet(uint256 gas);
  event BlockGasLimitSet(uint256 limit);
  event UptimeLookbackWindowSet(uint256 window, uint256 activationEpoch);
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  function setUp() public {
    super.setUp();
    nonOwner = actor("nonOwner");
    ph.setEpochSize(DAY / 5);
    blockchainParameters = new BlockchainParameters(true);
    whenL2WithEpochManagerInitialization();
  }
}

contract BlockchainParametersTest_initialize is BlockchainParametersTest {
  uint256 constant lookbackWindow = 20;

  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    blockchainParameters.initialize(gasForNonGoldCurrencies, gasLimit, lookbackWindow);
  }
}

contract BlockchainParametersTest_setBlockGasLimit is BlockchainParametersTest {
  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    blockchainParameters.setBlockGasLimit(gasLimit);
  }
}

contract BlockchainParametersTest_setIntrinsicGasForAlternativeFeeCurrency is
  BlockchainParametersTest
{
  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    blockchainParameters.setIntrinsicGasForAlternativeFeeCurrency(gasForNonGoldCurrencies);
  }
}

contract BlockchainParametersTest_getUptimeLookbackWindow is BlockchainParametersTest {
  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    blockchainParameters.getUptimeLookbackWindow();
  }
}

contract BlockchainParametersTest_setUptimeLookbackWindow is BlockchainParametersTest {
  uint256 constant newValue = 20;
  uint256 constant otherValue = 50;

  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    blockchainParameters.setUptimeLookbackWindow(100);
  }
}

contract BlockchainParametersTest_blockGasLimit is BlockchainParametersTest {
  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    blockchainParameters.blockGasLimit();
  }
}

contract BlockchainParametersTest_intrinsicGasForAlternativeFeeCurrency is
  BlockchainParametersTest
{
  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    blockchainParameters.intrinsicGasForAlternativeFeeCurrency();
  }
}
