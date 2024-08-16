pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/Blockable.sol";
import "@celo-contracts/common/interfaces/IBlockable.sol";
import "@celo-contracts/common/interfaces/IBlocker.sol";

contract TestBlocker is IBlocker {
  bool public blocked;

  function mockSetBlocked(bool _blocked) public {
    blocked = _blocked;
  }

  function isBlocked() external view returns (bool) {
    return blocked;
  }
}

contract TestBlockable is Blockable {
  function funtionToBeBlocked() public onlyWhenNotBlocked {
    return;
  }
}

contract BlockableTest is Test {
  IBlockable blockable;
  TestBlocker blocker;
  address notOwner;

  event BlockedBySet(address indexed _blockedBy);

  function setUp() public {
    blockable = new Blockable();
    blocker = new TestBlocker();
    notOwner = actor("notOwner");
  }
}

contract BlockableTest_setBlockable is BlockableTest {
  function test_setBlockable() public {
    blockable.setBlockedByContract(address(blocker));
    assert(blockable.getBlockedbyContract() == address(blocker));
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
  function test_isFalse_WhenBlockableNotSet() public {
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

  function setUp() public {
    super.setUp();
    blockableWithFunction = new TestBlockable();
    blockableWithFunction.setBlockedByContract(address(blocker));
  }

  function test_Reverts_WhenBlocked() public {
    blocker.mockSetBlocked(true);
    vm.expectRevert("Contract is blocked from performin this action");
    blockableWithFunction.funtionToBeBlocked();
  }

  function test_callsucceeds_WhenNotBlocked() public {
    blockableWithFunction.funtionToBeBlocked();
  }
}
