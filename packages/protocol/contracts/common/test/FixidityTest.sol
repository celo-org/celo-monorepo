pragma solidity ^0.5.8;

import "../FixidityLib.sol";


contract FixidityTest {
  using FixidityLib2 for FixidityLib2.Fraction;

  function add(uint256 a, uint256 b) external view returns (int256) {
    return FixidityLib2.wrapUint256(a).add(FixidityLib2.wrapUint256(b)).value;
  }

  function subtract(uint256 a, uint256 b) external view returns (int256) {
    return FixidityLib2.wrapUint256(a).subtract(FixidityLib2.wrapUint256(b)).value;
  }

  function multiply(uint256 a, uint256 b) external view returns (int256) {
    return FixidityLib2.wrapUint256(a).multiply(FixidityLib2.wrapUint256(b)).value;
  }

  function divide(uint256 a, uint256 b) external view returns (int256) {
    return FixidityLib2.wrapUint256(a).divide(FixidityLib2.wrapUint256(b)).value;
  }
}
