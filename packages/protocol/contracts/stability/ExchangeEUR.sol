pragma solidity ^0.5.13;

import "./Exchange.sol";

contract ExchangeEUR is Exchange {
  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Exchange(test) {}

  /**
  * @notice Returns the storage, major, minor, and patch version of the contract.
  * @dev This function is overloaded to maintain a distinct version from Exchange.sol.
  * @return The storage, major, minor, and patch version of the contract.
  */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 2, 0, 0);
  }
}
