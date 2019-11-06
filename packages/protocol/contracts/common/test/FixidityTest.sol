pragma solidity ^0.5.8;

import "../FixidityLib.sol";


contract FixidityTest {
  using FixidityLib for FixidityLib.Fraction;

  function newFixed(uint256 a) external pure returns (uint256) {
    return FixidityLib.newFixed(a).unwrap();
  }

  function newFixedFraction(uint256 a, uint256 b) external pure returns (uint256) {
    return FixidityLib.newFixedFraction(a, b).unwrap();
  }

  function add(uint256 a, uint256 b) external pure returns (uint256) {
    return FixidityLib.wrap(a).add(FixidityLib.wrap(b)).unwrap();
  }

  function subtract(uint256 a, uint256 b) external pure returns (uint256) {
    return FixidityLib.wrap(a).subtract(FixidityLib.wrap(b)).unwrap();
  }

  function multiply(uint256 a, uint256 b) external pure returns (uint256) {
    return FixidityLib.wrap(a).multiply(FixidityLib.wrap(b)).unwrap();
  }

  function reciprocal(uint256 a) external pure returns (uint256) {
    return FixidityLib.wrap(a).reciprocal().unwrap();
  }

  function divide(uint256 a, uint256 b) external pure returns (uint256) {
    return FixidityLib.wrap(a).divide(FixidityLib.wrap(b)).unwrap();
  }

  function gt(uint256 a, uint256 b) external pure returns (bool) {
    return FixidityLib.wrap(a).gt(FixidityLib.wrap(b));
  }

  function gte(uint256 a, uint256 b) external pure returns (bool) {
    return FixidityLib.wrap(a).gte(FixidityLib.wrap(b));
  }

  function lt(uint256 a, uint256 b) external pure returns (bool) {
    return FixidityLib.wrap(a).lt(FixidityLib.wrap(b));
  }

  function lte(uint256 a, uint256 b) external pure returns (bool) {
    return FixidityLib.wrap(a).lte(FixidityLib.wrap(b));
  }
}
