// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "contracts/common/Registry.sol";
import "./GetCode.sol";

contract WithRegistry is Test {
  address constant registryAddress = 0x000000000000000000000000000000000000ce10;
  IRegistry public constant registry = IRegistry(registryAddress);

  constructor() public {
    vm.etch(registryAddress, GetCode.at(address(new Registry(true))));
    vm.label(registryAddress, "Registry");
    vm.prank(actor("deployer"));
    Registry(registryAddress).initialize();
  }
}
