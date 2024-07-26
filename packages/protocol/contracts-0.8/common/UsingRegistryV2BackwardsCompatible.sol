// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

import "./UsingRegistryV2.sol";

contract UsingRegistryV2BackwardsCompatible is UsingRegistryV2 {
  // Placeholder for registry storage var in UsingRegistry and cannot be renamed
  // without breaking release tooling.
  // Use `registryContract` (in UsingRegistryV2) for the actual registry address.
  IRegistry public registry;
}
