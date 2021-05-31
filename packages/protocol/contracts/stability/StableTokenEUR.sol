pragma solidity ^0.5.13;

import "./StableToken.sol";

contract StableTokenEUR is StableToken {
  /**
  * @notice Returns the storage, major, minor, and patch version of the contract.
  * @return The storage, major, minor, and patch version of the contract.
  */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }
}
