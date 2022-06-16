pragma solidity ^0.5.13;

import "./UsingRegistryV2.sol";

contract UsingRegistryV2BackwardsCompatible is UsingRegistryV2 {
  // Placeholder for registry storage var in UsingRegistry and cannot be renamed
  // without breaking release tooling.
  // Use `registryContract` (in UsingRegistryV2) for the actual registry address.
  IRegistry public registry;
  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }
}
