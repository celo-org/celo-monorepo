// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/GoldToken.sol";
import "forge-std/console.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/GoldToken.sol";
import "@celo-contracts/common/UsingRegistry.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "forge-std/console2.sol";

contract IntegrationTest is Test, UsingRegistry {
  address account1 = actor("account1");
  address account2 = actor("account2");
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  IRegistry registry = IRegistry(registryAddress);
  GoldToken goldToken;

  function setUp() public {}
}

contract GoldTokenTest_General is IntegrationTest  {
  function setUp() public {
    goldToken = GoldToken(registry.getAddressForStringOrDie("GoldToken"));
    console2.log("GoldToken address is:", address(goldToken));
  }

  function test_name() public {
    assertEq(goldToken.name(), "Celo native asset");
  }

  function test_symbol() public {
    assertEq(goldToken.symbol(), "CELO");
  }

  function test_decimals() public {
    assertEq(uint256(goldToken.decimals()), 18);
  }
}