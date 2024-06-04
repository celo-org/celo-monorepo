// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;

import "celo-foundry/Test.sol";

import { Utils } from "@test-sol/utils.sol";
import { Constants } from "@test-sol/constants.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IProxy.sol";

contract IntegrationTest is Test {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  IRegistry registry = IRegistry(registryAddress);

  function setUp() public {}
}

contract RegistryIntegrationTest is IntegrationTest, Utils, Constants {
  IProxy proxy;

  function test_shouldHaveAddressInRegistry() public view {
    for (uint256 i = 0; i < contractsInRegistry.length; i++) {
      string memory contractName = contractsInRegistry[i];
      address contractAddress = registry.getAddressFor(keccak256(abi.encodePacked(contractName)));
      console2.log(contractName, "address in Registry is: ", contractAddress);
      assert(contractAddress != address(0));
    }
  }

  function test_shouldHaveCorrectBytecode() public {
    // Converting contract names to hashes for comparison
    bytes32 hashContractName = keccak256(abi.encodePacked(contractName));
    bytes32 hashAccount = keccak256(abi.encodePacked("Accounts"));
    bytes32 hashElection = keccak256(abi.encodePacked("Election"));
    bytes32 hashEscrow = keccak256(abi.encodePacked("Escrow"));
    bytes32 hashFederatedAttestations = keccak256(abi.encodePacked("FederatedAttestations"));
    bytes32 hashGovernance = keccak256(abi.encodePacked("Governance"));
    bytes32 hashSortedOracles = keccak256(abi.encodePacked("SortedOracles"));
    bytes32 hashValidators = keccak256(abi.encodePacked("Validators"));

    for (uint256 i = 0; i < contractsInRegistry.length; i++) {
      // Read name from list of core contracts
      string memory contractName = contractsInRegistry[i];
      console2.log("Checking bytecode of:", contractName);


      // Skipping test for contracts that depend on linked libraries
      // This is a known limitation in Foundry at the moment:
      // Source: https://github.com/foundry-rs/foundry/issues/6120
      if (
        hashContractName != hashAccount &&
        hashContractName != hashElection &&
        hashContractName != hashEscrow &&
        hashContractName != hashFederatedAttestations &&
        hashContractName != hashGovernance &&
        hashContractName != hashSortedOracles &&
        hashContractName != hashValidators
      ) {
        // Get proxy address registered in the Registry
        address proxyAddress = registry.getAddressForStringOrDie(contractName);
        proxy = IProxy(address(uint160(proxyAddress)));

        // Get implementation address
        address implementationAddress = proxy._getImplementation();

        // Get bytecode from deployed contract
        bytes memory actualBytecodeWithMetadataOnDevchain = getCodeAt(implementationAddress);
        bytes memory actualBytecodeOnDevchain = removeMetadataFromBytecode(actualBytecodeWithMetadataOnDevchain);

        // Get bytecode from build artifacts
        bytes memory expectedBytecodeFromArtifactsWithMetadata = vm.getDeployedCode(
          string(abi.encodePacked(contractName, ".sol"))
        );
        bytes memory expectedBytecodeFromArtifacts = removeMetadataFromBytecode(expectedBytecodeFromArtifactsWithMetadata);

        // Compare the bytecodes
        assertEq(actualBytecodeOnDevchain, expectedBytecodeFromArtifacts, "Bytecode does not match");
      }
    }
  }
}
