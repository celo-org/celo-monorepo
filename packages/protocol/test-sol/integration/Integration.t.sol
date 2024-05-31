// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;

// import "forge-std/console2.sol";

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
  string[23] expectedContractsInRegistry;
  IProxy proxy;

  // TODO(Arthur): Consider moving this to a config file. Perhaps make the migration depend
  // on that file too?
  constructor() public {
    expectedContractsInRegistry = contractsInRegistry;
  }

  function test_shouldHaveAddressInRegistry() public view {
    for (uint256 i = 0; i < expectedContractsInRegistry.length; i++) { 
      string memory contractName = expectedContractsInRegistry[i];
      address contractAddress = registry.getAddressFor(keccak256(abi.encodePacked(contractName)));
      console2.log(contractName, "address in Registry is: ", contractAddress);
      assert(contractAddress != address(0));
    }
  }

  function test_shouldHaveCorrectBytecode() public {
    ////////////////////DEBUGGING: START/////////////////////////
    // SPECIFIC EXAMPLE REGISTRY.SOL BEFORE LOOPING OVER ALL CONTRACTS
    string memory contractName = "Registry";
    address proxyAddress = registry.getAddressForStringOrDie(contractName);
    proxy = IProxy(address(uint160(proxyAddress)));
    ////////////////////DEBUGGING: END///////////////////////////

    address implementationAddress = proxy._getImplementation();
    console2.log("Implementation address is :", implementationAddress);

    // Get bytecode from deployed contract (in Solidity 0.5)
    bytes memory actualBytecode = getCodeAt(implementationAddress); // IProxy.sol and Proxy.sol are 0.5
    // Get bytecode from build artifacts
    bytes memory expectedBytecode = vm.getDeployedCode("Registry.sol");

    // // Get bytecode from deployed contract (in Solidity 0.8)
    // bytes memory actualBytecode = implementationAddress.code;
    // // Get bytecode from build artifacts (in Solidity 0.8)
    // bytes memory expectedBytecode = vm.getDeployedCode(string.concat(contractName, ".sol"));

    // Compare the bytecodes
    assertEq(actualBytecode, expectedBytecode, "Bytecode does not match");
  }
}