// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/common/UsingRegistry.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";

// All core contracts that are expected to be in the Registry on the devchain
import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import "@celo-contracts/stability/interfaces/ISortedOracles.sol";

contract Devchain is UsingRegistry {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);

  // Used in exceptional circumstances when a contract is not in UsingRegistry.sol
  IRegistry devchainRegistry = IRegistry(registryAddress);

  // All core contracts that are expected to be in the Registry on the devchain
  ISortedOracles sortedOracles;
  FeeCurrencyDirectory feeCurrencyDirectory;

  constructor() {
    // The following line is required by UsingRegistry.sol
    setRegistry(registryAddress);

    // Fetch all core contracts that are expeceted to be in the Registry on the devchain
    sortedOracles = getSortedOracles();
    feeCurrencyDirectory = FeeCurrencyDirectory(
      devchainRegistry.getAddressForStringOrDie("FeeCurrencyDirectory")
    ); // FeeCurrencyDirectory is not in UsingRegistry.sol

    // TODO: Add missing core contracts below (see list in migrations_sol/constants.sol)
    // TODO: Consider asserting that all contracts we expect are available in the Devchain class
    // (see list in migrations_sol/constants.sol)
  }
}
