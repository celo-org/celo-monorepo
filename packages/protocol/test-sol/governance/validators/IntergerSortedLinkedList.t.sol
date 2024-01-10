// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/test/IntegerSortedLinkedListTest.sol";

contract IntegerSortedLinkedListBaseTest is Test {
  IntegerSortedLinkedListTest public integerSortedLinkedListTest;

  struct SortedElement {
    uint256 key;
    uint256 value;
  }

  function setUp() public {
    integerSortedLinkedListTest = new IntegerSortedLinkedListTest();
  }
}

contract IntegerSortedLinkedListInsert is IntegerSortedLinkedListBaseTest {
  uint256 key = 1;
  uint256 value = 5;

  function test_ShouldAddASingleElementToList() public {
    integerSortedLinkedListTest.insert(key, value, 0, 0);
    assertTrue(integerSortedLinkedListTest.contains(key));

    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListTest.getElements();

    assertEq(keys.length, 1);
    assertEq(values.length, 1);

    assertEq(keys[0], key);
    assertEq(values[0], value);
  }

  function test_ShouldIncrementNumElements() public {
    integerSortedLinkedListTest.insert(key, value, 0, 0);
    assertEq(integerSortedLinkedListTest.getNumElements(), 1);
  }

  function test_ShouldUpdateTheHead() public {
    integerSortedLinkedListTest.insert(key, value, 0, 0);
    assertEq(integerSortedLinkedListTest.head(), key);
  }

  function test_ShouldUpdateTail() public {
    integerSortedLinkedListTest.insert(key, value, 0, 0);
    assertEq(integerSortedLinkedListTest.tail(), key);
  }

  function test_RevertIf_KeyIsZero() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListTest.insert(0, value, 0, 0);
  }

  function test_RevertIf_LesserEqualsKey() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListTest.insert(key, value, key, 0);
  }

  function test_RevertIf_GreaterEqualsKey() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListTest.insert(key, value, 0, key);
  }

  function test_RevertWhen_InsertingElementAlreadyInList_WhenListIsNotEmpty() public {
    integerSortedLinkedListTest.insert(key, value, 0, 0);
    vm.expectRevert("invalid key");
    integerSortedLinkedListTest.insert(key, value, 0, key);
  }

  function test_RevertWhen_InsertingNonMaximalElementAtHeadOfList_WhenListIsNotEmpty() public {
    integerSortedLinkedListTest.insert(key, value, 0, 0);

    uint256 nonKey = key - 1;
    uint256 newKey = key + 1;
    vm.expectRevert("greater and lesser key zero");
    integerSortedLinkedListTest.insert(newKey, value - 1, nonKey, 0);
  }
}

contract IntegerSortedLinkedListUpdate is IntegerSortedLinkedListBaseTest {
  uint256 key = 1;
  uint256 value = 10;
  uint256 newValue = 20;

  function setUp() public {
    super.setUp();
    integerSortedLinkedListTest.insert(key, value, 0, 0);
  }

  function test_ShouldUpdateTheValueForExistingElement() public {
    integerSortedLinkedListTest.update(key, newValue, 0, 0);

    assertTrue(integerSortedLinkedListTest.contains(key));
    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListTest.getElements();
    assertEq(keys.length, 1);
    assertEq(values.length, 1);

    assertEq(keys[0], key);
    assertEq(values[0], newValue);
  }

  function test_RevertIf_KeyIsNotInList() public {
    vm.expectRevert("key not in list");
    integerSortedLinkedListTest.update(key + 1, newValue, 0, 0);
  }

  function test_RevertIf_LesserEqualsKey() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListTest.update(key, newValue, key, 0);
  }

  function test_RevertIf_GreaterEqualsKey() public {
    vm.expectRevert("invalid key");
    integerSortedLinkedListTest.update(key, newValue, 0, key);
  }
}

contract IntegerSortedLinkedListRemove is IntegerSortedLinkedListBaseTest {
  uint256 key = 1;
  uint256 value = 10;

  function setUp() public {
    super.setUp();
    integerSortedLinkedListTest.insert(key, value, 0, 0);
  }

  function test_ShouldRemoveElementFromList() public {
    integerSortedLinkedListTest.remove(key);
    assertFalse(integerSortedLinkedListTest.contains(key));

    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListTest.getElements();
    assertEq(keys.length, 0);
    assertEq(values.length, 0);
  }

  function test_ShouldDecrementNumElements() public {
    integerSortedLinkedListTest.remove(key);
    assertEq(integerSortedLinkedListTest.getNumElements(), 0);
  }

  function test_ShouldUpdateHead() public {
    integerSortedLinkedListTest.remove(key);
    assertEq(integerSortedLinkedListTest.head(), 0);
  }

  function test_ShouldUpdateTail() public {
    integerSortedLinkedListTest.remove(key);
    assertEq(integerSortedLinkedListTest.tail(), 0);
  }

  function test_RevertIf_KeyIsNotInList() public {
    vm.expectRevert("key not in list");
    integerSortedLinkedListTest.remove(key + 1);
  }
}

contract IntegerSortedLinkedListPopN is IntegerSortedLinkedListBaseTest {
  uint256 n = 3;
  uint256 numElements = 10;

  function setUp() public {
    super.setUp();

    for (uint256 key = 1; key < numElements + 1; key++) {
      uint256 value = key * 10;
      integerSortedLinkedListTest.insert(key, value, key - 1, 0);
    }
  }

  function test_ShouldRemoveTheNKeyWithLargestValues() public {
    integerSortedLinkedListTest.popN(n);
    for (uint256 key = 1; key < numElements + 1; key++) {
      if (key <= numElements - n) {
        assertTrue(integerSortedLinkedListTest.contains(key));
      } else {
        assertFalse(integerSortedLinkedListTest.contains(key));
      }
    }
    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListTest.getElements();
    assertEq(keys.length, numElements - n);
    assertEq(values.length, numElements - n);
  }

  function test_ShouldReturnTheNKeyWithTheLargestValues() public {
    uint256[] memory popped = integerSortedLinkedListTest.popN(n);

    uint256[] memory expectedPopped = generateExpectedPopped(numElements, n);

    assertEq(popped, expectedPopped);
  }

  function test_ShouldDecrementNumElements() public {
    integerSortedLinkedListTest.popN(n);
    assertEq(integerSortedLinkedListTest.getNumElements(), numElements - n);
  }

  function test_ShouldUpdateHead() public {
    integerSortedLinkedListTest.popN(n);
    assertEq(integerSortedLinkedListTest.head(), numElements - n);
  }

  function test_RevertIf_NIsGreaterThanNumElements() public {
    vm.expectRevert("not enough elements");
    integerSortedLinkedListTest.popN(numElements + 1);
  }

  function generateExpectedPopped(uint256 _numElements, uint256 _n)
    internal
    pure
    returns (uint256[] memory)
  {
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
