// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts/common/FixidityLib.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts-8/common/GasPriceMinimum.sol";

contract GasPriceMinimumTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  IRegistry registry;
  GasPriceMinimum public gasPriceMinimum;
  MockSortedOracles sortedOracles;
  address owner;
  address nonOwner;
  address celoToken;

  uint256 gasPriceMinimumFloor = 100;
  uint256 initialGasPriceMinimum = gasPriceMinimumFloor;
  uint256 targetDensity = FixidityLib.newFixedFraction(5, 10).unwrap();
  FixidityLib.Fraction targetDensityFraction = FixidityLib.newFixedFraction(5, 10);
  uint256 adjustmentSpeed = FixidityLib.newFixedFraction(5, 10).unwrap();
  FixidityLib.Fraction adjustmentSpeedFraction = FixidityLib.newFixedFraction(5, 10);
  address registryAddress = 0x000000000000000000000000000000000000ce10;
  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  event TargetDensitySet(uint256 targetDensity);
  event GasPriceMinimumFloorSet(uint256 gasPriceMinimumFloor);
  event AdjustmentSpeedSet(uint256 adjustmentSpeed);
  event GasPriceMinimumUpdated(uint256 gasPriceMinimum);
  event BaseFeeOpCodeActivationBlockSet(uint256 baseFeeOpCodeActivationBlock);

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");
    celoToken = actor("CeloToken");

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    // deployCodeTo("SortedOracles.sol", abi.encode(true), sortedOracleAddress);
    // fails with `data did not match any variant of untagged enum Bytecode at line 822 column 3]`
    sortedOracles = new MockSortedOracles();

    gasPriceMinimum = new GasPriceMinimum(true);

    registry = IRegistry(registryAddress);

    registry.setAddressFor("GasPriceMinimum", address(gasPriceMinimum));
    registry.setAddressFor("SortedOracles", address(sortedOracles));
    registry.setAddressFor("GoldToken", celoToken);

    gasPriceMinimum.initialize(
      registryAddress,
      gasPriceMinimumFloor,
      targetDensity,
      adjustmentSpeed,
      0
    );
  }

  function _whenL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
  }
}

contract GasPriceMinimumTest_initialize is GasPriceMinimumTest {
  function test_shouldHaveSetOwner() public {
    assertEq(gasPriceMinimum.owner(), owner);
  }

  function test_shouldHaveTargetDensity() public {
    assertEq(gasPriceMinimum.targetDensity(), targetDensity);
  }

  function test_shouldHaveAdjustmentSpeed() public {
    assertEq(gasPriceMinimum.adjustmentSpeed(), adjustmentSpeed);
  }

  function test_shouldHaveGasPriceMinimumFloor() public {
    assertEq(gasPriceMinimum.gasPriceMinimumFloor(), gasPriceMinimumFloor);
  }

  function test_shouldRevertWhenCalledAgain() public {
    vm.expectRevert("contract already initialized");
    gasPriceMinimum.initialize(
      registryAddress,
      gasPriceMinimumFloor,
      targetDensity,
      adjustmentSpeed,
      0
    );
  }
}

contract GasPriceMinimumTest_setAdjustmentSpeed is GasPriceMinimumTest {
  using FixidityLib for FixidityLib.Fraction;

  uint256 newAdjustmentSpeed = FixidityLib.newFixedFraction(1, 3).unwrap();

  function test_shouldSetTheAdjustmentSpeed() public {
    gasPriceMinimum.setAdjustmentSpeed(newAdjustmentSpeed);

    assertEq(gasPriceMinimum.adjustmentSpeed(), newAdjustmentSpeed);
  }

  function test_Emits_AdjustmentSpeedSetEvent() public {
    vm.expectEmit(true, false, false, false);
    emit AdjustmentSpeedSet(newAdjustmentSpeed);
    gasPriceMinimum.setAdjustmentSpeed(newAdjustmentSpeed);
  }

  function test_shouldRevertWhenTheProvidedFractionIsGreaterThanOne() public {
    vm.expectRevert("adjustment speed must be smaller than 1");
    gasPriceMinimum.setAdjustmentSpeed(FixidityLib.newFixedFraction(3, 2).unwrap());
  }

  function test_shouldRevertWhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    gasPriceMinimum.setAdjustmentSpeed(newAdjustmentSpeed);
  }

  function test_shouldRevertWhenL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.setAdjustmentSpeed(newAdjustmentSpeed);
  }
}

contract GasPriceMinimumTest_setTargetDensity is GasPriceMinimumTest {
  using FixidityLib for FixidityLib.Fraction;

  uint256 newTargetDensity = FixidityLib.newFixedFraction(1, 3).unwrap();

  function test_shouldSetTargetDensity() public {
    gasPriceMinimum.setTargetDensity(newTargetDensity);
    assertEq(gasPriceMinimum.targetDensity(), newTargetDensity);
  }

  function test_Emits_TargetDensitySetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit TargetDensitySet(newTargetDensity);
    gasPriceMinimum.setTargetDensity(newTargetDensity);
  }

  function test_ShouldRevertWhenProvidedFractionIsGreaterThanOne() public {
    vm.expectRevert("target density must be smaller than 1");
    gasPriceMinimum.setTargetDensity(FixidityLib.newFixedFraction(3, 2).unwrap());
  }

  function test_ShouldRevertWhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    gasPriceMinimum.setTargetDensity(newTargetDensity);
  }

  function test_ShouldRevertWhenL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.setTargetDensity(newTargetDensity);
  }
}

contract GasPriceMinimumTest_setGasPriceMinimumFloor is GasPriceMinimumTest {
  uint256 newGasPriceMinimumFloor = 150;

  function test_ShouldSetGasPriceMinimumFloor() public {
    gasPriceMinimum.setGasPriceMinimumFloor(newGasPriceMinimumFloor);

    assertEq(gasPriceMinimum.gasPriceMinimumFloor(), newGasPriceMinimumFloor);
  }

  function test_Emits_GasPriceMinimumFloorSet() public {
    vm.expectEmit(true, true, true, true);
    emit GasPriceMinimumFloorSet(newGasPriceMinimumFloor);
    gasPriceMinimum.setGasPriceMinimumFloor(newGasPriceMinimumFloor);
  }

  function test_shouldRevertWhenProvidedFloorIsZero() public {
    vm.expectRevert("gas price minimum floor must be greater than zero");
    gasPriceMinimum.setGasPriceMinimumFloor(0);
  }

  function test_shouldRevertWhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    gasPriceMinimum.setGasPriceMinimumFloor(newGasPriceMinimumFloor);
  }

  function test_shouldRevertWhenL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    gasPriceMinimum.setGasPriceMinimumFloor(newGasPriceMinimumFloor);
  }
}

contract GasPriceMinimumTest_setUpdatedGasPriceMinimum is GasPriceMinimumTest {
  using FixidityLib for FixidityLib.Fraction;
  uint256 nonce = 0;

  function getExpectedUpdatedGasPriceMinimum(
    uint256 gasPriceMinFloor,
    uint256 previousGasPriceMinimum,
    FixidityLib.Fraction memory density,
    FixidityLib.Fraction memory _targetDensity,
    FixidityLib.Fraction memory _adjustmentSpeed
  ) public pure returns (uint256) {
    uint256 one = 1;
    uint256 newGasPriceMin = previousGasPriceMinimum *
      one +
      FixidityLib.fromFixed(_adjustmentSpeed) *
      FixidityLib.fromFixed(density) -
      FixidityLib.fromFixed(_targetDensity);

    return newGasPriceMin < gasPriceMinFloor ? gasPriceMinFloor : newGasPriceMin;
  }

  function random(uint256 minNumber, uint256 maxNumber) public returns (uint256) {
    nonce += 1;
    if (minNumber > 0) {
      return
        (uint256(keccak256(abi.encodePacked(nonce, msg.sender, blockhash(block.number - 1)))) %
          (maxNumber - 1)) + 1;
    }
    return (uint256(keccak256(abi.encodePacked(nonce, msg.sender, blockhash(block.number - 1)))) %
      maxNumber);
  }

  function test_shouldReturn25PercentMoreThanInitialMinimumAndShouldNotBeLimitedByGasPriceMinimumFloorAsAWhole_WhenTheBlockIsFull()
    public
  {
    uint256 currentGasPriceMinimum = gasPriceMinimum.gasPriceMinimum();

    gasPriceMinimum.setGasPriceMinimumFloor(currentGasPriceMinimum);

    uint256 expectedUpdatedGasPriceMinimum = (currentGasPriceMinimum * 5) / 4 + 1;

    assertEq(gasPriceMinimum.getUpdatedGasPriceMinimum(1, 1), expectedUpdatedGasPriceMinimum);
  }

  function test_shouldReturn25PercentLessThanInitialMinimumButShouldBeLimitedByGasPriceMinimumFloorIfNewGasLiesBelowMinimum_WhenTheBlockIsEmtpy()
    public
  {
    uint256 currentGasPriceMinimum = gasPriceMinimum.gasPriceMinimum();

    gasPriceMinimum.setGasPriceMinimumFloor(currentGasPriceMinimum);

    uint256 expectedCappedUpdatedGasPriceMinimum = gasPriceMinimum.gasPriceMinimumFloor();

    assertEq(gasPriceMinimum.getUpdatedGasPriceMinimum(0, 1), expectedCappedUpdatedGasPriceMinimum);
  }

  function test_shouldReturn25PercentLessThanInitialMinimumAndShouldNotBeLimitedByGasPriceMinimumFloorIfNewGasPriceLiesAboveMinimum_WhenTheBlockIsEmtpy()
    public
  {
    uint256 currentGasPriceMinimum = gasPriceMinimum.gasPriceMinimum();

    gasPriceMinimum.setGasPriceMinimumFloor(1);

    uint256 expectedUpdatedGasPriceMinimum = (currentGasPriceMinimum * 3) / 4 + 1;

    assertEq(gasPriceMinimum.getUpdatedGasPriceMinimum(0, 1), expectedUpdatedGasPriceMinimum);
  }

  function test_shouldReturnAnUpdatedGasPriceMinimumThatMatchesARandomNumber_WhenTheFullnessOfTheBlockIsRandom()
    public
  {
    uint256 numIterations = 100;
    uint256 currentGasPriceMinimum = gasPriceMinimum.gasPriceMinimum();
    uint256 gasPriceMinFloor = currentGasPriceMinimum;
    gasPriceMinimum.setGasPriceMinimumFloor(gasPriceMinFloor);

    for (uint256 i = 0; i < numIterations; i++) {
      uint256 currGas = gasPriceMinimum.gasPriceMinimum();

      uint256 blockGasLimit = random(1, 105);
      uint256 gasUsed = random(0, 1) * blockGasLimit;

      uint256 actualUpdatedGasPriceMinimum = gasPriceMinimum.getUpdatedGasPriceMinimum(
        gasUsed,
        blockGasLimit
      );

      uint256 expectedUpdatedGasPriceMinimum = getExpectedUpdatedGasPriceMinimum(
        gasPriceMinFloor,
        currGas,
        FixidityLib.newFixedFraction(gasUsed, blockGasLimit),
        targetDensityFraction,
        adjustmentSpeedFraction
      );

      assertEq(actualUpdatedGasPriceMinimum, expectedUpdatedGasPriceMinimum);
    }
  }
}
