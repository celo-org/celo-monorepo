// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "contracts/common/Registry.sol";
import "./GetCode.sol";

contract WithRegistry is Test {
  address constant registryAddress = 0x000000000000000000000000000000000000ce10;
  IRegistry public constant registry = IRegistry(registryAddress);

  // @param useExisting - don't deploy a new registry contract
  // this is useful for integration testing via forks
  constructor(bool useExisting) public {
    if (!useExisting) {
      vm.etch(registryAddress, GetCode.at(address(new Registry(true))));
      vm.label(registryAddress, "Registry");
      vm.prank(actor("deployer"));
      Registry(registryAddress).initialize();
    }
  }
}
