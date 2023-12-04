// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// import { Test as ForgeTest } from "forge-std/Test.sol";
import "./test/Test.sol";
import "forge-std8/console.sol";
import "../../contracts/common/FixidityLib.sol";
import "../../contracts-0.8/common/Registry8.sol";

// Contract to test
import "../../contracts-0.8/common/GasPriceMinimum.sol";

contract GasPriceMinimumTest is Test {
  using FixidityLib for FixidityLib.Fraction;
  Registry8 registry;
  GasPriceMinimum public gasPriceMinimum;
  address owner;



  uint256 gasPriceMinimumFloor = 100;
  uint256 initialGasPriceMinimum = gasPriceMinimumFloor;
  uint256 targetDensity = FixidityLib.newFixedFraction(5, 10).unwrap();
  uint256 adjustmentSpeed = FixidityLib.newFixedFraction(5, 10).unwrap();

  function setUp() public virtual {
    owner = address(this);
    address registryAddress = 0x000000000000000000000000000000000000ce10;
    deployCodeTo("Registry8.sol", abi.encode(false), registryAddress);
    gasPriceMinimum = new GasPriceMinimum(true);

    registry = Registry8(registryAddress);

    registry.setAddressFor("GasPriceMinimum", address(gasPriceMinimum));

    gasPriceMinimum.initialize(
      registryAddress,
      gasPriceMinimumFloor,
      targetDensity,
      adjustmentSpeed,
      0
    );
  }
}

contract GasPriceMinimumInitialize is GasPriceMinimumTest {
  function setUp() public override {
    super.setUp();
  }

  function test_shouldHaveSetOwner() public {
    assertEq(gasPriceMinimum.owner(), owner);
  }
}
