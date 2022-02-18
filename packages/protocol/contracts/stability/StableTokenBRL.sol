pragma solidity ^0.5.13;

import "./StableToken.sol";

contract StableTokenBRL is StableToken {
  /**
       * @notice Sets initialized == true on implementation contracts.
     * @param test Set to true to skip implementation initialization.
     */
  constructor(bool test) public StableToken(test) {}

  /**
      * @notice Returns the storage, major, minor, and patch version of the contract.
    * @dev This function is overloaded to maintain a distinct version from StableToken.sol.
    * @return The storage, major, minor, and patch version of the contract.
    */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }
}
