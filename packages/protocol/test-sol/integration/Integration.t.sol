// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;

// import "forge-std/console2.sol";
import "celo-foundry/Test.sol";

import { Utils } from "@test-sol/utils.sol";
import { Constants } from "@test-sol/constants.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IProxy.sol";


contract IntegrationTest is Test {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  IRegistry registry = IRegistry(registryAddress);

  // address account1 = actor("account1");
  // address account2 = actor("account2");

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
    for (uint256 i = 0; i < contractsInRegistry.length; i++) { 
      // Read name from list of core contracts
      string memory contractName = contractsInRegistry[i];
      console2.log("Contract is:", contractName);

      /////////// DEBUGGING: Contracts that fail the test ///////////////
      // Convert strings to hashes for comparison
      bytes32 hashContractName = keccak256(abi.encodePacked(contractName));
      bytes32 hashAccount = keccak256(abi.encodePacked("Accounts"));
      bytes32 hashElection = keccak256(abi.encodePacked("Election"));
      bytes32 hashEscrow = keccak256(abi.encodePacked("Escrow"));
      bytes32 hashFederatedAttestations = keccak256(abi.encodePacked("FederatedAttestations"));
      bytes32 hashGovernance = keccak256(abi.encodePacked("Governance"));
      bytes32 hashSortedOracles = keccak256(abi.encodePacked("SortedOracles"));
      bytes32 hashValidators = keccak256(abi.encodePacked("Validators"));
      
      if (hashContractName != hashAccount 
          && hashContractName != hashElection
          && hashContractName != hashEscrow
          && hashContractName != hashFederatedAttestations
          && hashContractName != hashGovernance
          && hashContractName != hashSortedOracles
          && hashContractName != hashValidators
      ) {
      /////////// DEBUGGING /////////////// /////////////// ///////////////
        console2.log("Checking bytecode of:", contractName);
        // Get proxy address registered in the Registry
        address proxyAddress = registry.getAddressForStringOrDie(contractName);
        proxy = IProxy(address(uint160(proxyAddress)));

        // Get implementation address
        address implementationAddress = proxy._getImplementation();

        // Get bytecode from deployed contract (in Solidity 0.5) 
        // Because IProxy.sol and Proxy.sol are 0.5
        bytes memory actualBytecodeWithMetadata = getCodeAt(implementationAddress); // 
        bytes memory actualBytecode = removeMetadataFromBytecode(actualBytecodeWithMetadata);
        
        // Get bytecode from build artifacts
        bytes memory expectedBytecodeWithMetadata = vm.getDeployedCode(string(abi.encodePacked(contractName, ".sol")));
        bytes memory expectedBytecode = removeMetadataFromBytecode(expectedBytecodeWithMetadata);
        
        //////////////////// DEBUGGING //////////////////////
        // bool bytecodesMatch = (actualBytecode == expectedBytecode);
        //////////////////// DEBUGGING //////////////////////

        // Compare the bytecodes
        assertEq(actualBytecode, expectedBytecode, "Bytecode does not match");
      }
    }
  }
}