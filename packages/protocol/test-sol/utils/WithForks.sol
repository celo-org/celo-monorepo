// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

contract WithForks is Test {
  uint256 mainnetForkId;

  constructor() public {
    mainnetForkId = vm.createFork(vm.rpcUrl("celo_mainnet"));
  }
}
