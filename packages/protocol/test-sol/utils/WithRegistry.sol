// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test } from "celo-foundry/Test.sol";

import { IRegistry } from "contracts/common/interfaces/IRegistry.sol";
import { Registry } from "contracts/common/Registry.sol";

import { GetCode } from "./GetCode.sol";

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
