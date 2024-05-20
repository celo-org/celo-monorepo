// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/test/LinkedListWrapper.sol";

contract LinkedListTest is Test {
  LinkedListWrapper linkedList;
  bytes32 internal constant NULL_KEY = bytes32(uint256(0x00));
  bytes32 internal constant FIRST_KEY = bytes32(uint256(0x01));
  bytes32 internal constant SECOND_KEY = bytes32(uint256(0x02));
  bytes32 internal constant THIRD_KEY = bytes32(uint256(0x03));
  bytes32 internal constant ADDED_KEY = bytes32(uint256(0x04));

  function setUp() public {
    linkedList = new LinkedListWrapper();
  }
}

contract LinkedListTest_insert is LinkedListTest {
  function setUpListWithManyElements() private {
    linkedList.insert(FIRST_KEY, NULL_KEY, NULL_KEY);
    linkedList.insert(SECOND_KEY, NULL_KEY, FIRST_KEY);
    linkedList.insert(THIRD_KEY, NULL_KEY, SECOND_KEY);
  }

  function testRevertIf_PreviousIsEqualToKeyWhenEmpty() public {
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, ADDED_KEY, NULL_KEY);
  }
  function testRevertIf_NextIsEqualToKeyWhenEmpty() public {
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, NULL_KEY, ADDED_KEY);
  }

  function testRevertIf_NextIsEqualToKeyWhenInsertingToSingleton() public {
    linkedList.insert(FIRST_KEY, NULL_KEY, NULL_KEY);
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, FIRST_KEY, ADDED_KEY);
  }

  function testRevertIf_PreviousIsEqualToKeyWhenInsertingToSingleton() public {
    linkedList.insert(FIRST_KEY, NULL_KEY, NULL_KEY);
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, ADDED_KEY, FIRST_KEY);
  }

  function testRevertIf_NextIsEqualToKey_beginning_ManyElements() public {
    setUpListWithManyElements();
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, FIRST_KEY, ADDED_KEY);
  }

  function testRevertIf_PreviousIsEqualToKey_beginning_ManyElements() public {
    setUpListWithManyElements();
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, ADDED_KEY, FIRST_KEY);
  }

  function testRevertIf_NextIsEqualToKey_end_ManyElements() public {
    setUpListWithManyElements();
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, THIRD_KEY, ADDED_KEY);
  }

  function testRevertIf_PreviousIsEqualToKey_end_ManyElements() public {
    setUpListWithManyElements();
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, ADDED_KEY, THIRD_KEY);
  }

  function testRevertIf_NextIsEqualToKey_middle_ManyElements() public {
    setUpListWithManyElements();
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, SECOND_KEY, ADDED_KEY);
  }

  function testRevertIf_PreviousIsEqualToKey_middle_ManyElements() public {
    setUpListWithManyElements();
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, ADDED_KEY, SECOND_KEY);
  }

  function testRevertIf_NextAndPreviousEqualToKey_ManyElements() public {
    setUpListWithManyElements();
    vm.expectRevert("Key cannot be the same as previousKey or nextKey");
    linkedList.insert(ADDED_KEY, ADDED_KEY, ADDED_KEY);
  }
}

contract LinkedListTest_remove is LinkedListTest {
  function setUpListWithManyElements() private {
    linkedList.insert(FIRST_KEY, NULL_KEY, NULL_KEY);
    linkedList.insert(SECOND_KEY, FIRST_KEY, NULL_KEY);
    linkedList.insert(THIRD_KEY, SECOND_KEY, NULL_KEY);
  }

  function testRevertIf_RemovingFromAnEmptyList() public {
    vm.expectRevert("key not in list");
    linkedList.remove(FIRST_KEY);
  }

  function test_CanRemoveFirstElement() public {
    setUpListWithManyElements();
    linkedList.remove(FIRST_KEY);
    assertFalse(linkedList.contains(FIRST_KEY));
  }

  function test_AfterRemoveSecondElementIsHead() public {
    setUpListWithManyElements();
    linkedList.remove(FIRST_KEY);
    bytes32 tail = linkedList.tail();
    assertEq(tail, SECOND_KEY);
  }

  function test_ReduceNumberOfElementsByOne() public {
    setUpListWithManyElements();
    linkedList.remove(FIRST_KEY);
    assertEq(linkedList.getNumElements(), 2);
  }

  function testRevertIf_removingAlreadyRemovedElement() public {
    setUpListWithManyElements();
    linkedList.remove(FIRST_KEY);
    vm.expectRevert("key not in list");
    linkedList.remove(FIRST_KEY);
  }
}
