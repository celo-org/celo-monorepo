// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;

import { Test } from "forge-std-8/Test.sol";
import "forge-std-8/console2.sol";

import { Constants } from "@celo-migrations/constants.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IProxy.sol";

contract IntegrationTest is Test {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  IRegistry registry = IRegistry(registryAddress);

  function setUp() public {}

  /**
   * @notice  Gets runtime code (or "deployedBytecode") at a contract address.
   *   Using the `.code` or `.runtime` property on a contract is only available in Solidity 0.8.0 and later.
   *   On Solity <0.8.0, inline assembly is necessary to retrieve the bytecode of a contract.
   *   This implementation is taken from the Solidity documentation.
   *   Source: https://docs.soliditylang.org/en/v0.4.24/assembly.html#example
   * @param _addr Contract address.
   * @return o_code The runtime bytecode at the specified contract address.
   */
  function getCodeAt(address _addr) public view returns (bytes memory o_code) {
    assembly {
      // retrieve the size of the code, this needs assembly
      let size := extcodesize(_addr)
      // allocate output byte array - this could also be done without assembly
      // by using o_code = new bytes(size)
      o_code := mload(0x40)
      // new "memory end" including padding
      mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
      // store length in memory
      mstore(o_code, size)
      // actually retrieve the code, this needs assembly
      extcodecopy(_addr, add(o_code, 0x20), 0, size)
    }
  }

  /**
   * @notice Removes CBOR encoded metadata from the tail of the deployedBytecode.
   * @param data Bytecode including the CBOR encoded tail.
   * @return Bytecode without the CBOR encoded metadata.
   */
  function removeMetadataFromBytecode(bytes memory data) public pure returns (bytes memory) {
    // Ensure the data length is at least enough to contain the length specifier
    require(data.length >= 2, "Data too short to contain a valid CBOR length specifier");

    // Calculate the length of the CBOR encoded section from the last two bytes
    uint16 cborLength = uint16(uint8(data[data.length - 2])) *
      256 +
      uint16(uint8(data[data.length - 1]));

    // Ensure the length is valid (not greater than the data array length minus 2 bytes for the length field)
    require(cborLength <= data.length - 2, "Invalid CBOR length");

    // Calculate the new length of the data without the CBOR section
    uint newLength = data.length - 2 - cborLength;

    // Create a new byte array for the result
    bytes memory result = new bytes(newLength);

    // Copy data from the original byte array to the new one, excluding the CBOR section and its length field
    for (uint i = 0; i < newLength; i++) {
      result[i] = data[i];
    }

    return result;
  }
}

contract RegistryIntegrationTest is IntegrationTest, Constants {
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
      bytes32 hashContractName = keccak256(abi.encodePacked(contractName));
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
        bytes memory actualBytecodeOnDevchain = removeMetadataFromBytecode(
          actualBytecodeWithMetadataOnDevchain
        );

        // Get bytecode from build artifacts
        bytes memory expectedBytecodeWithMetadataFromArtifacts = vm.getDeployedCode(
          string(abi.encodePacked(contractName, ".sol"))
        );
        bytes memory expectedBytecodeFromArtifacts = removeMetadataFromBytecode(
          expectedBytecodeWithMetadataFromArtifacts
        );

        // Compare the bytecodes
        assertEq(
          actualBytecodeOnDevchain,
          expectedBytecodeFromArtifacts,
          "Bytecode does not match"
        );
      }
    }
  }
}
