// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/test/SortedLinkedListMock.sol";

contract SortedLinkedListTest is Test {
  SortedLinkedListMock sortedList;

  function setUp() public {
    sortedList = new SortedLinkedListMock();
  }
}

contract SortedLinkedListTest_insert is SortedLinkedListTest {
  bytes32 key = keccak256("key");
  uint256 numerator = 2;

  function test_ShouldAddASingleElementToTheList() public {
    sortedList.insert(key, numerator, bytes32(0), bytes32(0));
    assertEq(sortedList.contains(key), true, "should contain the key");
    (bytes32[] memory keys, uint256[] memory numerators) = sortedList.getElements();
    assertEq(keys.length, 1, "keys should have a single element");
    assertEq(keys[0], key, "should have the correct key");

    assertEq(numerators.length, 1, "numerators should have a single element");
    assertEq(numerators[0], numerator, "should have the correct numerator");
  }

  function test_ShouldIncrementNumElements() public {
    sortedList.insert(key, numerator, bytes32(0), bytes32(0));
    assertEq(sortedList.getNumElements(), 1, "should have a single element");
  }

  function test_ShouldUpdateTheHead() public {
    sortedList.insert(key, numerator, bytes32(0), bytes32(0));
    assertEq(sortedList.head(), key, "should have the correct head");
  }

  function test_ShouldUpdateTheTail() public {
    sortedList.insert(key, numerator, bytes32(0), bytes32(0));
    assertEq(sortedList.tail(), key, "should have the correct tail");
  }

  function test_ShouldRevertIfKeyIsZero() public {
    vm.expectRevert("invalid key");
    sortedList.insert(bytes32(0), numerator, bytes32(0), bytes32(0));
  }

  function test_ShouldRevertIfLesserIsEqualToKey() public {
    vm.expectRevert("invalid key");
    sortedList.insert(key, numerator, key, bytes32(0));
  }

  function test_ShouldRevertIfGreaterIsEqualToKey() public {
    vm.expectRevert("invalid key");
    sortedList.insert(key, numerator, bytes32(0), key);
  }

  function test_ShouldRevert_WhenInsertingElementAlreadyInTheList() public {
    sortedList.insert(key, numerator, bytes32(0), bytes32(0));
    vm.expectRevert("invalid key");
    sortedList.insert(key, numerator, bytes32(0), bytes32(0));
  }
}

contract SortedLinkedListTest_update is SortedLinkedListTest {
  bytes32 key0 = keccak256("key");
  bytes32 key1 = keccak256("key2");
  bytes32 key2 = keccak256("key3");
  bytes32 absentKey = keccak256("absentKey");
  uint256 value0 = 1;
  uint256 value1 = 3;
  uint256 value2 = 5;
  uint256 smallestValue = 0;
  uint256 smallerValue = 2;
  uint256 largerValue = 4;
  uint256 largestValue = 6;

  function setUp() public {
    super.setUp();
    sortedList.insert(key0, value0, bytes32(0), bytes32(0));
    sortedList.insert(key1, value1, key0, bytes32(0));
    sortedList.insert(key2, value2, key1, bytes32(0));
  }

  function test_ShouldUpdateValueForAnExistingElement_whenBecomingTheSmallestElement() public {
    sortedList.update(key1, smallestValue, bytes32(0), key0);
    (bytes32[] memory keys, uint256[] memory values) = sortedList.getElements();
    assertEq(keys.length, 3, "keys should have three elements");
    assertEq(keys[2], key1, "should have the correct key");

    assertEq(values.length, 3, "values should have three elements");
    assertEq(values[2], smallestValue, "should have the correct value");
  }

  function test_ShouldUpdateValueForAnExistingElement_whenBecomingTheLargestElement() public {
    sortedList.update(key1, largestValue, key2, bytes32(0));
    (bytes32[] memory keys, uint256[] memory values) = sortedList.getElements();
    assertEq(keys.length, 3, "keys should have three element");
    assertEq(keys[0], key1, "should have the correct key");

    assertEq(values.length, 3, "values should have three elements");
    assertEq(values[0], largestValue, "should have the correct value");
  }

  function test_ShouldUpdateValueForAnExistingElement_whenIncreasingValueButStayingInPlace()
    public
  {
    sortedList.update(key1, largerValue, key0, key2);
    (bytes32[] memory keys, uint256[] memory values) = sortedList.getElements();
    assertEq(keys.length, 3, "keys should have three element");
    assertEq(keys[1], key1, "should have the correct key");

    assertEq(values.length, 3, "values should have three elements");
    assertEq(values[1], largerValue, "should have the correct value");
  }

  function test_ShouldUpdateValueForAnExistingElement_whenDecreasingValueButStayingInPlace()
    public
  {
    sortedList.update(key1, smallerValue, key0, key2);
    (bytes32[] memory keys, uint256[] memory values) = sortedList.getElements();
    assertEq(keys.length, 3, "keys should have three element");
    assertEq(keys[1], key1, "should have the correct key");

    assertEq(values.length, 3, "values should have three elements");
    assertEq(values[1], smallerValue, "should have the correct value");
  }

  function test_ShouldUpdateValueForAnExistingElement_whenNotChangingValue() public {
    sortedList.update(key1, value1, key0, key2);
    (bytes32[] memory keys, uint256[] memory values) = sortedList.getElements();
    assertEq(keys.length, 3, "keys should have three elements");
    assertEq(keys[1], key1, "should have the correct key");

    assertEq(values.length, 3, "values should have three element");
    assertEq(values[1], value1, "should have the correct value");
  }

  function test_ShouldRevertIfTheKeyIsNotInTheList() public {
    vm.expectRevert("key not in list");
    sortedList.update(absentKey, smallestValue, bytes32(0), key0);
  }

  function test_ShouldRevertIfLesserIsEqualToKey() public {
    vm.expectRevert("invalid key");
    sortedList.update(key1, smallestValue, key1, key0);
  }

  function test_ShouldRevertIfGreaterIsEqualToKey() public {
    vm.expectRevert("invalid key");
    sortedList.update(key1, largestValue, key2, key1);
  }
}

contract SortedLinkedListTest_remove is SortedLinkedListTest {
  bytes32 key = keccak256("key");
  bytes32 key2 = keccak256("key2");
  uint256 numerator = 2;

  function setUp() public {
    super.setUp();
    sortedList.insert(key, numerator, bytes32(0), bytes32(0));
  }

  function test_ShouldRemoveTheElementFromTheList() public {
    sortedList.remove(key);
    assertEq(sortedList.contains(key), false, "should not contain the key");
  }

  function test_ShouldDecrementNumElements() public {
    sortedList.remove(key);
    assertEq(sortedList.getNumElements(), 0, "should have no elements");
  }

  function test_ShouldUpdateTheHead() public {
    sortedList.remove(key);
    assertEq(sortedList.head(), bytes32(0), "should have the correct head");
  }

  function test_ShouldUpdateTheTail() public {
    sortedList.remove(key);
    assertEq(sortedList.tail(), bytes32(0), "should have the correct tail");
  }

  function test_ShouldRevertIfTheKeyIsNotInTheList() public {
    vm.expectRevert("key not in list");
    sortedList.remove(key2);
  }
}

contract SortedLinkedListTest_WhenThereAreMultipleActions is SortedLinkedListTest {
  uint256 nonce = 0;

  enum SortedListActionType {
    Update,
    Remove,
    Insert
  }

  struct SortedElement {
    bytes32 key;
    uint256 numerator;
  }

  struct SortedListAction {
    SortedListActionType actionType;
    SortedElement element;
  }

  function getLesserAndGreater(
    uint256 numerator
  ) internal view returns (bytes32 lesser, bytes32 greater) {
    // Fetch all elements from the list
    (bytes32[] memory keys, uint256[] memory numerators) = sortedList.getElements();
    uint256 length = keys.length;

    lesser = bytes32(0); // Initialize with the default values
    greater = bytes32(0);

    for (uint256 i = 0; i < length; i++) {
      // Find the first key with a numerator greater than the given one
      if (numerators[i] > numerator) {
        greater = keys[i];
        if (i > 0) {
          lesser = keys[i - 1];
        }
        break;
      }
    }

    // If no greater key is found, the last key in the list is considered `lesser`
    if (greater == bytes32(0) && length > 0) {
      lesser = keys[length - 1];
    }
  }

  function random(uint256 maxNumber) public returns (uint256) {
    nonce += 1;
    return
      uint256(keccak256(abi.encodePacked(nonce, msg.sender, blockhash(block.number - 1)))) %
      maxNumber;
  }

  function getLesserAndGreaterIncorrect() internal returns (bytes32 lesser, bytes32 greater) {
    (bytes32[] memory keys, ) = sortedList.getElements();

    uint256 random1 = random(100);
    if (random1 < 50) {
      return (bytes32(0), bytes32(0));
    } else {
      uint256 random2 = random(keys.length);
      uint256 random3 = random(keys.length);
      return (keys[random2], keys[random3]);
    }
  }

  function assertSortedFractionListInvariants() internal view {
    // Fetch all elements from the list
    (bytes32[] memory keys, uint256[] memory numerators) = sortedList.getElements();
    uint256 numElements = sortedList.getNumElements(); // Assuming getNumElements() returns the total number of elements

    // Assert the number of elements is correct
    require(keys.length == numElements, "Incorrect number of elements");

    // Assert keys are sorted in descending order of numerators
    for (uint256 i = 1; i < keys.length; i++) {
      require(numerators[i - 1] >= numerators[i], "Elements not sorted");
    }
  }

  function test_MultipleInsertsUpdatesRemovals() public {
    bytes32[100] memory keys;
    uint256[100] memory numerators;

    // Initialize keys and numerators
    for (uint256 i = 0; i < 100; i++) {
      keys[i] = bytes32(uint256(i + 1));
      numerators[i] = i * 100; // Example numerator values
    }

    // Simulating the action sequence
    for (uint256 i = 0; i < 100; i++) {
      bytes32 key = keys[i];
      uint256 numerator = numerators[i];

      // Randomly decide on action: Insert, Update, or Remove
      uint256 actionType = i % 3; // This is a simplification of random selection

      if (actionType == uint256(SortedListActionType.Insert)) {
        (bytes32 greater, bytes32 lesser) = getLesserAndGreater(numerator);
        sortedList.insert(key, numerator, greater, lesser);
        assertTrue(sortedList.contains(key));
      } else if (actionType == uint256(SortedListActionType.Update)) {
        if (sortedList.contains(key)) {
          (bytes32 greater, bytes32 lesser) = getLesserAndGreater(numerator);
          sortedList.update(key, numerator + 1, greater, lesser);
        }
      } else if (actionType == uint256(SortedListActionType.Remove)) {
        if (sortedList.contains(key)) {
          sortedList.remove(key);
          assertFalse(sortedList.contains(key));
        }
      }
    }

    assertSortedFractionListInvariants();
  }

  function test_MultipleInsertsUpdatesRemovalsIncorrectGreaterAndLesser() public {
    bytes32[100] memory keys;
    uint256[100] memory numerators;

    // Initialize keys and numerators
    for (uint256 i = 0; i < 100; i++) {
      keys[i] = bytes32(uint256(i + 1));
      numerators[i] = i * 100; // Example numerator values
    }

    // Simulating the action sequence
    for (uint256 i = 0; i < 100; i++) {
      bytes32 key = keys[i];
      uint256 numerator = numerators[i];

      // Randomly decide on action: Insert, Update, or Remove
      uint256 actionType = i % 3; // This is a simplification of random selection

      if (actionType == uint256(SortedListActionType.Insert)) {
        (bytes32 greater, bytes32 lesser) = getLesserAndGreaterIncorrect();
        (bool success, ) = address(sortedList).call(
          abi.encodeWithSelector(sortedList.insert.selector, key, numerator, greater, lesser)
        );
        if (success) {
          assertTrue(sortedList.contains(key));
        }
        // Handle failure case if needed
      } else if (actionType == uint256(SortedListActionType.Update)) {
        if (sortedList.contains(key)) {
          (bytes32 greater, bytes32 lesser) = getLesserAndGreaterIncorrect();
          (bool success, ) = address(sortedList).call(
            abi.encodeWithSelector(sortedList.update.selector, key, numerator + 1, greater, lesser)
          );
          if (success) {
            assertTrue(sortedList.contains(key));
          }
        }
      } else if (actionType == uint256(SortedListActionType.Remove)) {
        if (sortedList.contains(key)) {
          (bool success, ) = address(sortedList).call(
            abi.encodeWithSelector(sortedList.remove.selector, key)
          );
          if (success) {
            assertFalse(sortedList.contains(key));
          }
        }
      }
    }

    assertSortedFractionListInvariants();
  }
}
