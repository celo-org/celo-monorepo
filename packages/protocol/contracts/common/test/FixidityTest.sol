pragma solidity ^0.5.8;

import "../FixidityLib.sol";


contract FixidityTest {
  using FixidityLib2 for FixidityLib2.Fraction;

  function add(uint256 a, uint256 b) external view returns (uint256) {
    return FixidityLib2.wrap(a).add(FixidityLib2.wrap(b)).unwrap();
  }

  function subtract(uint256 a, uint256 b) external view returns (uint256) {
    return FixidityLib2.wrap(a).subtract(FixidityLib2.wrap(b)).unwrap();
  }

  function multiply(uint256 a, uint256 b) external view returns (uint256) {
    return FixidityLib2.wrap(a).multiply(FixidityLib2.wrap(b)).unwrap();
  }

  function divide(uint256 a, uint256 b) external view returns (uint256) {
    return FixidityLib2.wrap(a).divide(FixidityLib2.wrap(b)).unwrap();
  }
}
