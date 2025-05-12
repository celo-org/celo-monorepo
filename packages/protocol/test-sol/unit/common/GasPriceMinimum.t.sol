// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { WhenL2, WhenL2NoInitialization } from "@test-sol/utils/WhenL2-08.sol";

import "@celo-contracts/common/FixidityLib.sol";

import "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts-8/common/GasPriceMinimum.sol";

contract GasPriceMinimumTest is TestWithUtils08 {
  using FixidityLib for FixidityLib.Fraction;

  GasPriceMinimum public gasPriceMinimum;
  MockSortedOracles sortedOracles;
  address owner;
  address nonOwner;

  uint256 gasPriceMinimumFloor = 100;
  uint256 initialGasPriceMinimum = gasPriceMinimumFloor;
  uint256 targetDensity = FixidityLib.newFixedFraction(5, 10).unwrap();
  FixidityLib.Fraction targetDensityFraction = FixidityLib.newFixedFraction(5, 10);
  uint256 adjustmentSpeed = FixidityLib.newFixedFraction(5, 10).unwrap();
  FixidityLib.Fraction adjustmentSpeedFraction = FixidityLib.newFixedFraction(5, 10);

  event TargetDensitySet(uint256 targetDensity);
  event GasPriceMinimumFloorSet(uint256 gasPriceMinimumFloor);
  event AdjustmentSpeedSet(uint256 adjustmentSpeed);
  event GasPriceMinimumUpdated(uint256 gasPriceMinimum);
  event BaseFeeOpCodeActivationBlockSet(uint256 baseFeeOpCodeActivationBlock);

  function setUp() public virtual override {
    super.setUp();
    owner = address(this);
    nonOwner = actor("nonOwner");

    // fails with `data did not match any variant of untagged enum Bytecode at line 822 column 3]`
    sortedOracles = new MockSortedOracles();

    gasPriceMinimum = new GasPriceMinimum(true);

    registry.setAddressFor("GasPriceMinimum", address(gasPriceMinimum));
    registry.setAddressFor("SortedOracles", address(sortedOracles));
    registry.setAddressFor("GoldToken", address(celoToken));

    gasPriceMinimum.initialize(
      REGISTRY_ADDRESS,
      gasPriceMinimumFloor,
      targetDensity,
      adjustmentSpeed,
      0
    );
    whenL2WithEpochManagerInitialization();
  }
}

contract GasPriceMinimumTest_initialize is GasPriceMinimumTest {
  function test_shouldHaveSetOwner() public {
    assertEq(gasPriceMinimum.owner(), owner);
  }

  function test_shouldRevertWhenCalledAgain() public {
    vm.expectRevert("contract already initialized");
    gasPriceMinimum.initialize(
      REGISTRY_ADDRESS,
      gasPriceMinimumFloor,
      targetDensity,
      adjustmentSpeed,
      0
    );
  }
}

contract GasPriceMinimumTest_setAdjustmentSpeed is GasPriceMinimumTest {
  uint256 newAdjustmentSpeed = 5;

  function test_Reverts_WhenL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.setAdjustmentSpeed(newAdjustmentSpeed);
  }
}

contract GasPriceMinimumTest_setTargetDensity is GasPriceMinimumTest {
  function test_Reverts_WhenL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.setTargetDensity(5);
  }
}

contract GasPriceMinimumTest_setGasPriceMinimumFloor is GasPriceMinimumTest {
  function test_Reverts_WhenL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.setGasPriceMinimumFloor(5);
  }
}

contract GasPriceMinimumTest_getUpdatedGasPriceMinimum is GasPriceMinimumTest {
  function test_shouldRevert_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.getUpdatedGasPriceMinimum(0, 1);
  }
}

contract GasPriceMinimumTest_gasPriceMinimumFloor is GasPriceMinimumTest {
  function test_shouldRevert_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.gasPriceMinimumFloor();
  }
}

contract GasPriceMinimumTest_targetDensity is GasPriceMinimumTest {
  function test_shouldRevert_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.targetDensity();
  }
}

contract GasPriceMinimumTest_adjustmentSpeed is GasPriceMinimumTest {
  function test_shouldRevert_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.adjustmentSpeed();
  }
}

contract GasPriceMinimumTest_baseFeeOpCodeActivationBlock is GasPriceMinimumTest {
  function test_shouldRevert_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.baseFeeOpCodeActivationBlock();
  }
}

contract GasPriceMinimumTest_gasPriceMinimum is GasPriceMinimumTest {
  function test_shouldRevert_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.gasPriceMinimum();
  }
}

contract GasPriceMinimumTest_getGasPriceMinimum is GasPriceMinimumTest {
  function test_shouldRevert_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.getGasPriceMinimum(address(0));
  }
}
