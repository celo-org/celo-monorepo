// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/GoldToken.sol";
// import "@celo-contracts/common/test/MockGoldToken.sol";
import "forge-std/console.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";

contract IntegrationTest is Test {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  address account1 = actor("account1");
  address account2 = actor("account2");
  IRegistry registry = IRegistry(registryAddress);

  function setUp() public {}

  function test_dummy() public {}
}
