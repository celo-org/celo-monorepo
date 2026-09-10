// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { Accounts } from "@celo-contracts-8/common/Accounts.sol";
import { GoldToken } from "@celo-contracts-8/common/GoldToken.sol";
import { Registry } from "@celo-contracts-8/common/Registry.sol";
import { Governance } from "@celo-contracts-8/governance/Governance.sol";

interface IHasIsOwner {
  function isOwner() external view returns (bool);
  function owner() external view returns (address);
}

// The Solidity 0.5 implementations exposed isOwner() through OpenZeppelin 2.5's Ownable.
// The upgraded implementations keep the selector so callers of the proxies do not break.
contract IsOwnerTest is TestWithUtils08 {
  address stranger = actor("stranger");

  function assertIsOwnerFollowsOwner(address contractAddress) internal {
    IHasIsOwner target = IHasIsOwner(contractAddress);
    vm.prank(target.owner());
    assertTrue(target.isOwner());
    vm.prank(stranger);
    assertFalse(target.isOwner());
  }

  function test_IsOwner_Accounts() public {
    assertIsOwnerFollowsOwner(address(new Accounts(true)));
  }

  function test_IsOwner_GoldToken() public {
    assertIsOwnerFollowsOwner(address(new GoldToken(true)));
  }

  function test_IsOwner_Registry() public {
    assertIsOwnerFollowsOwner(address(new Registry(true)));
  }

  function test_IsOwner_Governance() public {
    assertIsOwnerFollowsOwner(address(new Governance(true)));
  }
}
