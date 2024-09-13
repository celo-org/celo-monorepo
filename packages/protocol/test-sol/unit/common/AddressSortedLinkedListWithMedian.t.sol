// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/test/AddressSortedLinkedListWithMedianMock.sol";

contract AddressSortedLinkedListWithMedianTest is Test {
  AddressSortedLinkedListWithMedianMock sortedList;

  function setUp() public {
    sortedList = new AddressSortedLinkedListWithMedianMock();
  }
}

contract AddressSortedLinkedListWithMedianTest_insert is AddressSortedLinkedListWithMedianTest {
  address key = actor("key");
  uint256 numerator = 2;

  function test_ShouldAddASingleElementToTheList() public {
    sortedList.insert(key, numerator, address(0), address(0));
    assertEq(sortedList.contains(key), true, "should contain the key");
    (address[] memory addresses, uint256[] memory numerators, ) = sortedList.getElements();
    assertEq(addresses.length, 1, "addresses should have a single element");
    assertEq(addresses[0], key, "should have the correct key");

    assertEq(numerators.length, 1, "numerators should have a single element");
    assertEq(numerators[0], numerator, "should have the correct numerator");
  }

  function test_ShouldIncrementNumElements() public {
    sortedList.insert(key, numerator, address(0), address(0));
    assertEq(sortedList.getNumElements(), 1, "should have a single element");
  }

  function test_ShouldUpdateTheHead() public {
    sortedList.insert(key, numerator, address(0), address(0));
    assertEq(sortedList.head(), key, "should have the correct head");
  }

  function test_ShouldUpdateTheTail() public {
    sortedList.insert(key, numerator, address(0), address(0));
    assertEq(sortedList.tail(), key, "should have the correct tail");
  }

  function test_ShouldUpdateTheMedian() public {
    sortedList.insert(key, numerator, address(0), address(0));
    assertEq(sortedList.medianKey(), key, "should have the correct median");
  }

  function test_ShouldRevertIfKeyIsZero() public {
    vm.expectRevert("invalid key");
    sortedList.insert(address(0), numerator, address(0), address(0));
  }

  function test_ShouldRevertIfLesserIsEqualToKey() public {
    vm.expectRevert("invalid key");
    sortedList.insert(key, numerator, key, address(0));
  }

  function test_ShouldRevertIfGreaterIsEqualToKey() public {
    vm.expectRevert("invalid key");
    sortedList.insert(key, numerator, address(0), key);
  }

  function test_ShouldRevert_WhenInsertingElementAlreadyInTheList() public {
    sortedList.insert(key, numerator, address(0), address(0));
    vm.expectRevert("invalid key");
    sortedList.insert(key, numerator, address(0), address(0));
  }
}

contract AddressSortedLinkedListWithMedianTest_update is AddressSortedLinkedListWithMedianTest {
  address key = actor("key");
  address key2 = actor("key2");
  uint256 numerator = 2;
  uint256 newNumerator = 3;

  function setUp() public {
    super.setUp();
    sortedList.insert(key, numerator, address(0), address(0));
  }

  function test_ShouldUpdateValueForAnExistingElement() public {
    sortedList.update(key, newNumerator, address(0), address(0));
    (address[] memory addresses, uint256[] memory numerators, ) = sortedList.getElements();
    assertEq(addresses.length, 1, "addresses should have a single element");
    assertEq(addresses[0], key, "should have the correct key");

    assertEq(numerators.length, 1, "numerators should have a single element");
    assertEq(numerators[0], newNumerator, "should have the correct numerator");
  }

  function test_ShouldRevertIfTheKEyIsNotInTheList() public {
    vm.expectRevert("key not in list");
    sortedList.update(key2, newNumerator, address(0), address(0));
  }

  function test_ShouldRevertIfLesserIsEqualToKey() public {
    vm.expectRevert("invalid key");
    sortedList.update(key, newNumerator, key, address(0));
  }

  function test_ShouldRevertIfGreaterIsEqualToKey() public {
    vm.expectRevert("invalid key");
    sortedList.update(key, newNumerator, address(0), key);
  }
}

contract AddressSortedLinkedListWithMedianTest_remove is AddressSortedLinkedListWithMedianTest {
  address key = actor("key");
  address key2 = actor("key2");
  uint256 numerator = 2;

  function setUp() public {
    super.setUp();
    sortedList.insert(key, numerator, address(0), address(0));
  }

  function test_ShouldRemoveTheELementFromTheList() public {
    sortedList.remove(key);
    assertEq(sortedList.contains(key), false, "should not contain the key");
  }

  function test_ShouldDecrementNumElements() public {
    sortedList.remove(key);
    assertEq(sortedList.getNumElements(), 0, "should have no elements");
  }

  function test_ShouldUpdateTheHead() public {
    sortedList.remove(key);
    assertEq(sortedList.head(), address(0), "should have the correct head");
  }

  function test_ShouldUpdateTheTail() public {
    sortedList.remove(key);
    assertEq(sortedList.tail(), address(0), "should have the correct tail");
  }

  function test_ShouldUpdateTheMedian() public {
    sortedList.remove(key);
    assertEq(sortedList.medianKey(), address(0), "should have the correct median");
  }

  function test_ShouldRevertIfTheKeyIsNotInTheList() public {
    vm.expectRevert("key not in list");
    sortedList.remove(key2);
  }
}

contract AddressSortedLinkedListWithMedianTest_WhenThereAreMultipleActions is
  AddressSortedLinkedListWithMedianTest
{
  uint256 nonce = 0;

  enum SortedListActionType {
    Update,
    Remove,
    Insert
  }

  struct SortedElement {
    address key;
    uint256 numerator;
  }

  struct SortedListAction {
    SortedListActionType actionType;
    SortedElement element;
  }

  function getLesserAndGreater(
    uint256 numerator
  ) internal view returns (address lesser, address greater) {
    // Fetch all elements from the list
    (address[] memory keys, uint256[] memory numerators, ) = sortedList.getElements();
    uint256 length = keys.length;

    lesser = address(0); // Initialize with the default values
    greater = address(0);

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
    if (greater == address(0) && length > 0) {
      lesser = keys[length - 1];
    }
  }

  function random(uint256 maxNumber) public returns (uint256) {
    nonce += 1;
    return
      uint256(keccak256(abi.encodePacked(nonce, msg.sender, blockhash(block.number - 1)))) %
      maxNumber;
  }

  function getLesserAndGreaterIncorrect() internal returns (address lesser, address greater) {
    (address[] memory keys, , ) = sortedList.getElements();

    uint256 random1 = random(100);
    if (random1 < 50) {
      return (address(0), address(0));
    } else {
      uint256 random2 = random(keys.length);
      uint256 random3 = random(keys.length);
      return (keys[random2], keys[random3]);
    }
  }

  function assertSortedFractionListInvariants() internal view {
    // Fetch all elements from the list
    (
      address[] memory keys,
      uint256[] memory numerators,
      SortedLinkedListWithMedian.MedianRelation[] memory relations
    ) = sortedList.getElements();
    uint256 numElements = sortedList.getNumElements(); // Assuming getNumElements() returns the total number of elements
    address medianKey = sortedList.medianKey(); // Assuming medianKey() returns the key of the median element

    // Assert the number of elements is correct
    require(keys.length == numElements, "Incorrect number of elements");

    // Assert keys are sorted in descending order of numerators
    for (uint256 i = 1; i < keys.length; i++) {
      require(numerators[i - 1] >= numerators[i], "Elements not sorted");
    }

    // Assert median key is correct
    uint256 medianIndex = (keys.length - 1) / 2;
    require(keys.length == 0 || keys[medianIndex] == medianKey, "Incorrect median element");

    // Assert relations are correct according to median
    for (uint256 i = 0; i < relations.length; i++) {
      if (i < medianIndex) {
        require(
          relations[i] == SortedLinkedListWithMedian.MedianRelation.Greater,
          "Incorrect relation for lesser element"
        );
      } else if (i == medianIndex) {
        require(
          relations[i] == SortedLinkedListWithMedian.MedianRelation.Equal,
          "Incorrect relation for median element"
        );
      } else {
        require(
          relations[i] == SortedLinkedListWithMedian.MedianRelation.Lesser,
          "Incorrect relation for greater element"
        );
      }
    }
  }

  function test_MultipleInsertsUpdatesRemovals() public {
    address[100] memory keys;
    uint256[100] memory numerators;

    // Initialize keys and numerators
    for (uint256 i = 0; i < 100; i++) {
      keys[i] = address(uint160(i + 1));
      numerators[i] = i * 100; // Example numerator values
    }

    // Simulating the action sequence
    for (uint256 i = 0; i < 100; i++) {
      address key = keys[i];
      uint256 numerator = numerators[i];

      // Randomly decide on action: Insert, Update, or Remove
      uint256 actionType = i % 3; // This is a simplification of random selection

      if (actionType == uint256(SortedListActionType.Insert)) {
        (address greater, address lesser) = getLesserAndGreater(numerator);
        sortedList.insert(key, numerator, greater, lesser);
        assertTrue(sortedList.contains(key));
      } else if (actionType == uint256(SortedListActionType.Update)) {
        if (sortedList.contains(key)) {
          (address greater, address lesser) = getLesserAndGreater(numerator);
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
    address[100] memory keys;
    uint256[100] memory numerators;

    // Initialize keys and numerators
    for (uint256 i = 0; i < 100; i++) {
      keys[i] = address(uint160(i + 1));
      numerators[i] = i * 100; // Example numerator values
    }

    // Simulating the action sequence
    for (uint256 i = 0; i < 100; i++) {
      address key = keys[i];
      uint256 numerator = numerators[i];

      // Randomly decide on action: Insert, Update, or Remove
      uint256 actionType = i % 3; // This is a simplification of random selection

      if (actionType == uint256(SortedListActionType.Insert)) {
        (address greater, address lesser) = getLesserAndGreaterIncorrect();
        (bool success, ) = address(sortedList).call(
          abi.encodeWithSelector(sortedList.insert.selector, key, numerator, greater, lesser)
        );
        if (success) {
          assertTrue(sortedList.contains(key));
        }
        // Handle failure case if needed
      } else if (actionType == uint256(SortedListActionType.Update)) {
        if (sortedList.contains(key)) {
          (address greater, address lesser) = getLesserAndGreaterIncorrect();
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
