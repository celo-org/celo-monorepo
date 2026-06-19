// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts-8/common/Blockable.sol";
import "@celo-contracts/common/interfaces/IBlockable.sol";
import "@celo-contracts/common/interfaces/IBlocker.sol";
import { TestBlocker } from "@test-sol/unit/common/mocks/TestBlocker.sol";
import { Ownable } from "@openzeppelin/contracts8/access/Ownable.sol";

contract BlockableMock is Blockable, Ownable {
  function setBlockedByContract(address _blockedBy) public override onlyOwner {
    _setBlockedBy(_blockedBy);
  }
}

contract TestBlockable is BlockableMock {
  function functionToBeBlocked() public view onlyWhenNotBlocked {
    return;
  }
}

contract BlockableTest is Test {
  IBlockable blockable;
  TestBlocker blocker;
  address notOwner;

  event BlockedBySet(address indexed _blockedBy);

  function setUp() public virtual {
    blockable = new BlockableMock();
    blocker = new TestBlocker();
    notOwner = actor("notOwner");
  }
}

contract BlockableTest_setBlockable is BlockableTest {
  function test_setBlockable() public {
    blockable.setBlockedByContract(address(blocker));
    assert(blockable.getBlockedByContract() == address(blocker));
  }

  function test_Reverts_WhenNotCalledByOwner() public {
    vm.prank(notOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    blockable.setBlockedByContract(address(blocker));
  }

  function test_Emits_BlockedBySet() public {
    vm.expectEmit(false, false, false, true);
    emit BlockedBySet(address(blocker));
    blockable.setBlockedByContract(address(blocker));
  }
}

contract BlockableTest_isBlocked is BlockableTest {
  function test_isFalse_WhenBlockableNotSet() public view {
    assert(blockable.isBlocked() == false);
  }

  function test_isBlocked() public {
    assertTrue(blockable.isBlocked() == false);
    blocker.mockSetBlocked(true);
    blockable.setBlockedByContract(address(blocker));
    assertTrue(blockable.isBlocked());
  }
}

contract BlockableTest_onlyWhenNotBlocked is BlockableTest {
  TestBlockable blockableWithFunction;

  function setUp() public override {
    super.setUp();
    blockableWithFunction = new TestBlockable();
    blockableWithFunction.setBlockedByContract(address(blocker));
  }

  function test_Reverts_WhenBlocked() public {
    blocker.mockSetBlocked(true);
    vm.expectRevert("Contract is blocked from performing this action");
    blockableWithFunction.functionToBeBlocked();
  }

  function test_callsucceeds_WhenNotBlocked() public view {
    blockableWithFunction.functionToBeBlocked();
  }
}
