// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/test/IntegerSortedLinkedListMock.sol";

contract IntegerSortedLinkedListTest is Test {
  IntegerSortedLinkedListMock public integerSortedLinkedListMock;

  struct SortedElement {
    uint256 key;
    uint256 value;
  }

  function setUp() public {
    integerSortedLinkedListMock = new IntegerSortedLinkedListMock();
  }
}

contract IntegerSortedLinkedListTest_Insert is IntegerSortedLinkedListTest {
  uint256 key = 1;
  uint256 value = 5;

  function test_ShouldAddASingleElementToList() public {
    integerSortedLinkedListMock.insert(key, value, 0, 0);
    assertTrue(integerSortedLinkedListMock.contains(key));

    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListMock.getElements();

    assertEq(keys.length, 1);
    assertEq(values.length, 1);

    assertEq(keys[0], key);
    assertEq(values[0], value);
  }

  function test_ShouldIncrementNumElements() public {
    integerSortedLinkedListMock.insert(key, value, 0, 0);
    assertEq(integerSortedLinkedListMock.getNumElements(), 1);
  }

  function test_ShouldUpdateTheHead() public {
    integerSortedLinkedListMock.insert(key, value, 0, 0);
    assertEq(integerSortedLinkedListMock.head(), key);
  }

  function test_ShouldUpdateTail() public {
    integerSortedLinkedListMock.insert(key, value, 0, 0);
    assertEq(integerSortedLinkedListMock.tail(), key);
  }

  function test_Reverts_IfKeyIsZero() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListMock.insert(0, value, 0, 0);
  }

  function test_Reverts_IfLesserEqualsKey() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListMock.insert(key, value, key, 0);
  }

  function test_Reverts_IfGreaterEqualsKey() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListMock.insert(key, value, 0, key);
  }

  function test_Reverts_WhenInsertingElementAlreadyInList_WhenListIsNotEmpty() public {
    integerSortedLinkedListMock.insert(key, value, 0, 0);
    vm.expectRevert("invalid key");
    integerSortedLinkedListMock.insert(key, value, 0, key);
  }

  function test_Reverts_WhenInsertingNonMaximalElementAtHeadOfList_WhenListIsNotEmpty() public {
    integerSortedLinkedListMock.insert(key, value, 0, 0);

    uint256 nonKey = key - 1;
    uint256 newKey = key + 1;
    vm.expectRevert("greater and lesser key zero");
    integerSortedLinkedListMock.insert(newKey, value - 1, nonKey, 0);
  }
}

contract IntegerSortedLinkedListTest_Update is IntegerSortedLinkedListTest {
  uint256 key = 1;
  uint256 value = 10;
  uint256 newValue = 20;

  function setUp() public {
    super.setUp();
    integerSortedLinkedListMock.insert(key, value, 0, 0);
  }

  function test_ShouldUpdateTheValueForExistingElement() public {
    integerSortedLinkedListMock.update(key, newValue, 0, 0);

    assertTrue(integerSortedLinkedListMock.contains(key));
    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListMock.getElements();
    assertEq(keys.length, 1);
    assertEq(values.length, 1);

    assertEq(keys[0], key);
    assertEq(values[0], newValue);
  }

  function test_Reverts_IfKeyIsNotInList() public {
    vm.expectRevert("key not in list");
    integerSortedLinkedListMock.update(key + 1, newValue, 0, 0);
  }

  function test_Reverts_IfLesserEqualsKey() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListMock.update(key, newValue, key, 0);
  }

  function test_Reverts_IfGreaterEqualsKey() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListMock.update(key, newValue, 0, key);
  }
}

contract IntegerSortedLinkedListTest_Remove is IntegerSortedLinkedListTest {
  uint256 key = 1;
  uint256 value = 10;

  function setUp() public {
    super.setUp();
    integerSortedLinkedListMock.insert(key, value, 0, 0);
  }

  function test_ShouldRemoveElementFromList() public {
    integerSortedLinkedListMock.remove(key);
    assertFalse(integerSortedLinkedListMock.contains(key));

    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListMock.getElements();
    assertEq(keys.length, 0);
    assertEq(values.length, 0);
  }

  function test_ShouldDecrementNumElements() public {
    integerSortedLinkedListMock.remove(key);
    assertEq(integerSortedLinkedListMock.getNumElements(), 0);
  }

  function test_ShouldUpdateHead() public {
    integerSortedLinkedListMock.remove(key);
    assertEq(integerSortedLinkedListMock.head(), 0);
  }

  function test_ShouldUpdateTail() public {
    integerSortedLinkedListMock.remove(key);
    assertEq(integerSortedLinkedListMock.tail(), 0);
  }

  function test_Reverts_IfKeyIsNotInList() public {
    vm.expectRevert("key not in list");
    integerSortedLinkedListMock.remove(key + 1);
  }
}

contract IntegerSortedLinkedListTest_PopN is IntegerSortedLinkedListTest {
  uint256 n = 3;
  uint256 numElements = 10;

  function setUp() public {
    super.setUp();

    for (uint256 key = 1; key < numElements + 1; key++) {
      uint256 value = key * 10;
      integerSortedLinkedListMock.insert(key, value, key - 1, 0);
    }
  }

  function test_ShouldRemoveTheNKeyWithLargestValues() public {
    integerSortedLinkedListMock.popN(n);
    for (uint256 key = 1; key < numElements + 1; key++) {
      if (key <= numElements - n) {
        assertTrue(integerSortedLinkedListMock.contains(key));
      } else {
        assertFalse(integerSortedLinkedListMock.contains(key));
      }
    }
    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListMock.getElements();
    assertEq(keys.length, numElements - n);
    assertEq(values.length, numElements - n);
  }

  function test_ShouldReturnTheNKeyWithTheLargestValues() public {
    uint256[] memory popped = integerSortedLinkedListMock.popN(n);

    uint256[] memory expectedPopped = generateExpectedPopped(numElements, n);

    assertEq(popped, expectedPopped);
  }

  function test_ShouldDecrementNumElements() public {
    integerSortedLinkedListMock.popN(n);
    assertEq(integerSortedLinkedListMock.getNumElements(), numElements - n);
  }

  function test_ShouldUpdateHead() public {
    integerSortedLinkedListMock.popN(n);
    assertEq(integerSortedLinkedListMock.head(), numElements - n);
  }

  function test_Reverts_IfNIsGreaterThanNumElements() public {
    vm.expectRevert("not enough elements");
    integerSortedLinkedListMock.popN(numElements + 1);
  }

  function generateExpectedPopped(
    uint256 _numElements,
    uint256 _n
  ) internal pure returns (uint256[] memory) {
    require(_n <= _numElements, "Invalid input: _n must be less than or equal to _numElements");

    uint256[] memory expectedPopped = new uint256[](_n);
    uint256 currentIndex = 0;

    for (uint256 i = _numElements; i > _numElements - _n; i--) {
      expectedPopped[currentIndex] = i;
      currentIndex++;
    }

    return expectedPopped;
  }
}
