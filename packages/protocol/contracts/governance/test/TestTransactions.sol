pragma solidity ^0.5.13;

/**
 * @title A contract for transaction testing.
 */
contract TestTransactions {
  mapping(uint256 => uint256) public values;

  function getValue(uint256 key) external view returns (uint256) {
    return values[key];
  }

  function setValue(uint256 key, uint256 value, bool shouldSucceed) external {
    require(shouldSucceed);
    values[key] = value;
  }
}
