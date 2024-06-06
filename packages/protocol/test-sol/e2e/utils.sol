// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "forge-std-8/console2.sol";

import { Constants } from "@celo-migrations/constants.sol";

import "@celo-contracts-8/common/UsingRegistry.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import "@celo-contracts/stability/interfaces/ISortedOracles.sol";

contract Devchain is Constants, UsingRegistry {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  IRegistry devchainRegistry = IRegistry(registryAddress);

  // This is Anvil's default account
  address constant deployerAccount = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

  // Option 1: Mapping
  // mapping(string => address) public devchainRegistry;

  // Option 2: Objects
  ISortedOracles sortedOracles;
  FeeCurrencyDirectory feeCurrencyDirectory;

  constructor() {
    // Option 1: Mapping
    // for (uint256 i = 0; i < contractsInRegistry.length; i++) {
    //   string memory contractName = contractsInRegistry[i];
    //   address contractAddressOnDevchain = registry.getAddressForStringOrDie(contractName);
    //   devchainRegistry[contractName] = contractAddressOnDevchain;
    // }

    // Option 2: Variables

    // Option 2.A: UsingRegistry
    setRegistry(registryAddress); // The following  line is required by UsingRegistry.sol
    sortedOracles = getSortedOracles(); // OPTION: UsingRegistry

    // Option 2.B: Calling contracts explicitly
    sortedOracles = ISortedOracles(
      devchainRegistry.getAddressForStringOrDie("SortedOracles")
    );
    feeCurrencyDirectory = FeeCurrencyDirectory(
      devchainRegistry.getAddressForStringOrDie("FeeCurrencyDirectory")
    );
  }
}
