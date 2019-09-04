pragma solidity ^0.5.8;

import "../FixidityLib.sol";


contract FixidityTest {
  using FixidityLib for FixidityLib.Fraction;

  function newFixed(uint256 a) external view returns (uint256) {
    return FixidityLib.newFixed(a).unwrap();
  }

  function add(uint256 a, uint256 b) external view returns (uint256) {
    return FixidityLib.wrap(a).add(FixidityLib.wrap(b)).unwrap();
  }

  function subtract(uint256 a, uint256 b) external view returns (uint256) {
    return FixidityLib.wrap(a).subtract(FixidityLib.wrap(b)).unwrap();
  }

  function multiply(uint256 a, uint256 b) external view returns (uint256) {
    return FixidityLib.wrap(a).multiply(FixidityLib.wrap(b)).unwrap();
  }

  function divide(uint256 a, uint256 b) external view returns (uint256) {
    return FixidityLib.wrap(a).divide(FixidityLib.wrap(b)).unwrap();
  }
}
