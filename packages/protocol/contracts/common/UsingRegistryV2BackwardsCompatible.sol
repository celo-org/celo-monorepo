pragma solidity ^0.5.13;

import "./UsingRegistryV2.sol";

contract UsingRegistryV2BackwardsCompatible is UsingRegistryV2 {
  // Placeholder for registry storage var in UsingRegistry and cannot be renamed
  // without breaking release tooling.
  // Use `registryContract` (in UsingRegistryV2) for the actual registry address.
  IRegistry public registry;

  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    revert("disabled");
    return (0, 0, 0, 0);
  }

}
