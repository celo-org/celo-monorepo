pragma solidity ^0.5.13;

import "./Exchange.sol";

contract ExchangeBRL is Exchange {
  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Exchange(test) {}

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @dev This function is overloaded to maintain a distinct version from Exchange.sol.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 3, 0, 0);
  }
}
