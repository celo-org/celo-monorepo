pragma solidity ^0.5.13;

/**
 * @title A mock Exchange for testing.
 */
contract MockExchange {
  function stable() external view returns (address) {
    return address(0);
  }
}
