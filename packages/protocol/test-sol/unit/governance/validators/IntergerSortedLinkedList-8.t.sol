// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.8.20;

import "celo-foundry-8/Test.sol";

import { CommonBase } from "forge-std-8/Base.sol";
import { StdCheats } from "forge-std-8/StdCheats.sol";
import { StdUtils } from "forge-std-8/StdUtils.sol";

import "@test-sol/unit/governance/validators/IntegerSortedLinkedListMock-8.sol";

contract IntegerSortedLinkedListTest8 is Test {
  IntegerSortedLinkedListMock public integerSortedLinkedListMock;
  Handler public handler;

  struct SortedElement {
    uint256 key;
    uint256 value;
  }

  function setUp() public virtual {
    integerSortedLinkedListMock = new IntegerSortedLinkedListMock();
  }

  function parseElements(
    uint256[] memory keys,
    uint256[] memory values
  ) internal pure returns (SortedElement[] memory) {
    require(
      keys.length == values.length,
      "Invalid input: keys and values must have the same length"
    );

    SortedElement[] memory elements = new SortedElement[](keys.length);

    for (uint256 i = 0; i < keys.length; i++) {
      elements[i] = SortedElement({ key: keys[i], value: values[i] });
    }

    return elements;
  }

  function assertSorted(SortedElement[] memory elements) internal pure {
    for (uint256 i = 0; i < elements.length; i++) {
      if (i > 0) {
        require(elements[i].value <= elements[i - 1].value, "Elements not sorted");
      }
    }
  }

  function assertInvariants() internal {
    assertEq(
      integerSortedLinkedListMock.getNumElements(),
      handler.actionListLength(),
      "Incorrect number of elements here"
    );

    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListMock.getElements();
    SortedElement[] memory sortedElements = parseElements(keys, values);
    assertSorted(sortedElements);
    if (sortedElements.length > 0) {
      assertEq(integerSortedLinkedListMock.head(), sortedElements[0].key, "Incorrect head");
      assertEq(
        integerSortedLinkedListMock.tail(),
        sortedElements[sortedElements.length - 1].key,
        "Incorrect tail"
      );
    } else {
      assertEq(integerSortedLinkedListMock.head(), 0, "Head not zero");
      assertEq(integerSortedLinkedListMock.tail(), 0, "Tail not Zero");
    }
  }
}

contract IntegerSortedLinkedListTest8_Insert is IntegerSortedLinkedListTest8 {
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

contract IntegerSortedLinkedListTest8_Update is IntegerSortedLinkedListTest8 {
  uint256 key = 1;
  uint256 value = 10;
  uint256 newValue = 20;

  function setUp() public override {
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

contract IntegerSortedLinkedListTest8_Remove is IntegerSortedLinkedListTest8 {
  uint256 key = 1;
  uint256 value = 10;

  function setUp() public override {
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

contract IntegerSortedLinkedListTest8_PopN is IntegerSortedLinkedListTest8 {
  uint256 n = 3;
  uint256 numElements = 10;

  function setUp() public override {
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

contract IntegerSortedLinkedListTest8_Invariant_WhenLesserAndGreaterAreCorrect_WhenMultipleInsertsUpdatesAndRemovals is
  IntegerSortedLinkedListTest8
{
  function setUp() public override {
    super.setUp();

    handler = new Handler(integerSortedLinkedListMock);
    targetContract(address(handler));

    bytes4[] memory selectors = new bytes4[](3);

    selectors[0] = handler.insertCorrectKeys.selector;
    selectors[1] = handler.updateExisting.selector;
    selectors[2] = handler.removeExisting.selector;
    targetSelector(FuzzSelector({ addr: address(handler), selectors: selectors }));
  }

  // XXX: Inline foundry config, DO NOT REMOVE!
  /// forge-config: default.invariant.depth = 100
  /// forge-config: default.invariant.fail-on-revert = true

  function invariant_ShouldMaintainInvariants_WhenLesserAndGreaterAreCorrect() public {
    assertInvariants();
  }
}

contract IntegerSortedLinkedListTest8_Invariant_WhenLesserAndGreaterAreIncorrect_WhenMultipleInsertsUpdatesAndRemovals is
  IntegerSortedLinkedListTest8
{
  function setUp() public override {
    super.setUp();

    handler = new Handler(integerSortedLinkedListMock);
    targetContract(address(handler));

    bytes4[] memory selectors = new bytes4[](3);

    selectors[0] = handler.insertRandomly.selector;
    selectors[1] = handler.updateRandomly.selector;
    selectors[2] = handler.removeExisting.selector;
    targetSelector(FuzzSelector({ addr: address(handler), selectors: selectors }));
  }

  // XXX: Inline foundry config, DO NOT REMOVE!
  /// forge-config: default.invariant.depth = 200
  /// forge-config: default.invariant.fail-on-revert = false

  function invariant_ShouldMaintainInvariantsWhenLesserAndGreaterAreIncorrect() public {
    assertInvariants();
  }
}

contract Handler is CommonBase, StdCheats, StdUtils {
  constructor(IntegerSortedLinkedListMock _integerSortedLinkedList) {
    listTest = _integerSortedLinkedList;
  }

  struct ActionElement {
    uint256 key;
    uint256 value;
  }
  uint256 public actionListLength;

  IntegerSortedLinkedListMock private listTest;

  function getLesserAndGreater(
    ActionElement memory element
  ) internal view returns (uint256 lesser, uint256 greater) {
    uint256[] memory keys;
    uint256[] memory values;
    (keys, values) = getElements();
    ActionElement[] memory sortedElements = parseActionElements(keys, values);

    for (uint256 i = 0; i < sortedElements.length; i++) {
      if (sortedElements[i].key != element.key) {
        if (sortedElements[i].value >= element.value) {
          greater = sortedElements[i].key;
        }
      }

      uint256 j = sortedElements.length - i - 1;

      if (sortedElements[j].key != element.key) {
        if (sortedElements[j].value <= element.value) {
          lesser = sortedElements[j].key;
        }
      }
    }

    return (lesser, greater);
  }

  function parseActionElements(
    uint256[] memory keys,
    uint256[] memory values
  ) internal pure returns (ActionElement[] memory) {
    require(
      keys.length == values.length,
      "Invalid input: keys and values must have the same length"
    );

    ActionElement[] memory elements = new ActionElement[](keys.length);

    for (uint256 i = 0; i < keys.length; i++) {
      elements[i] = ActionElement({ key: keys[i], value: values[i] });
    }

    return elements;
  }

  function insertCorrectKeys(uint256 key, uint256 value) external {
    key = bound(key, 1, 10);
    if (!contains(key)) {
      (uint256 lesserKey, uint256 greaterKey) = getLesserAndGreater(
        ActionElement({ key: key, value: value })
      );

      actionListLength++;

      listTest.insert(key, value, lesserKey, greaterKey);
    }
  }

  function insertRandomly(
    uint256 key,
    uint256 value,
    uint256 lesserKey,
    uint256 greaterKey
  ) external {
    key = bound(key, 1, 10);
    lesserKey = bound(lesserKey, 0, 11);
    greaterKey = bound(greaterKey, 0, 11);

    actionListLength++;

    listTest.insert(key, value, lesserKey, greaterKey);
  }

  function updateExisting(uint256 key, uint256 value) external {
    key = bound(key, 1, 10);
    if (contains(key)) {
      (uint256 lesserKey, uint256 greaterKey) = getLesserAndGreater(
        ActionElement({ key: key, value: value })
      );

      listTest.update(key, value, lesserKey, greaterKey);
    }
  }

  function updateRandomly(
    uint256 key,
    uint256 value,
    uint256 lesserKey,
    uint256 greaterKey
  ) external {
    key = bound(key, 1, 10);
    lesserKey = bound(lesserKey, 0, 11);
    greaterKey = bound(greaterKey, 0, 11);

    listTest.update(key, value, lesserKey, greaterKey);
  }

  function removeExisting(uint256 key) external {
    key = bound(key, 1, 10);

    if (contains(key)) {
      actionListLength--;

      listTest.remove(key);
    }
  }

  function getElements() public view returns (uint256[] memory, uint256[] memory) {
    return listTest.getElements();
  }

  function contains(uint256 key) public view returns (bool) {
    return listTest.contains(key);
  }
}
