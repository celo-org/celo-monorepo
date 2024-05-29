// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "forge-std/console2.sol";

import "celo-foundry/Test.sol";
import { Constants } from "@test-sol/constants.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

contract IntegrationTest is Test, Constants {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  IRegistry registry = IRegistry(registryAddress);

  address account1 = actor("account1");
  address account2 = actor("account2");

  function setUp() public {}
}

contract RegistryIntegrationTest is IntegrationTest {
  string[23] expectedContractsInRegistry;
  
  constructor() public {
    expectedContractsInRegistry = [
      "Accounts",
      "BlockchainParameters",
      "DoubleSigningSlasher",
      "DowntimeSlasher",
      "Election",
      "EpochRewards",
      "Escrow",
      "FederatedAttestations",
      "FeeCurrencyWhitelist",
      "FeeCurrencyDirectory",
      "Freezer",
      "FeeHandler",
      "GoldToken",
      "Governance",
      "GovernanceSlasher",
      "LockedGold",
      "OdisPayments",
      "Random",
      "Registry",
      "SortedOracles",
      "UniswapFeeHandlerSeller",
      "MentoFeeHandlerSeller",
      "Validators"
    ];
  }

  function test_shouldHaveAddressInRegistry() public {
    for (uint256 i = 0; i < expectedContractsInRegistry.length; i++) { 
      string memory contractName = expectedContractsInRegistry[i];
      address contractAddress = registry.getAddressFor(keccak256(abi.encodePacked(contractName)));
      console2.log(contractName, "address in Registry is: ", contractAddress);
      assert(contractAddress != address(0));
    }
  }
}