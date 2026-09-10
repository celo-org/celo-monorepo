// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

/**
 * @title A contract for transaction testing in 0.8 governance tests.
 */
contract TestTransactions08 {
  mapping(uint256 => uint256) public values;

  function setValue(uint256 key, uint256 value, bool shouldSucceed) external {
    require(shouldSucceed);
    values[key] = value;
  }

  function getValue(uint256 key) external view returns (uint256) {
    return values[key];
  }
}
