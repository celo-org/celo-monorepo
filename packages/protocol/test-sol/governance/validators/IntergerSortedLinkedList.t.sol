// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;
pragma experimental ABIEncoderV2;

import "celo-foundry-8/Test.sol";
import "forge-std-8/console.sol";

import { CommonBase } from "forge-std-8/Base.sol";
import { StdCheats } from "forge-std-8/StdCheats.sol";
import { StdUtils } from "forge-std-8/StdUtils.sol";

import "@celo-contracts/common/FixidityLib.sol";

import "@openzeppelin/contracts8/utils/math/SafeMath.sol";
import "@celo-contracts-8/common/test/IntegerSortedLinkedListTest.sol";

contract IntegerSortedLinkedListBaseTest is Test {
  IntegerSortedLinkedListTest public integerSortedLinkedListTest;

  enum ActionType { Update, Remove, Insert }

  struct Action {
    ActionType actionType;
    SortedElement element;
  }

  struct SortedElement {
    uint256 key;
    uint256 value;
  }

  uint256[] public listKeys;

  function setUp() public virtual {
    integerSortedLinkedListTest = new IntegerSortedLinkedListTest();
  }

  /// Simulate randomness using the current block's hash
  function getRandomValue() internal view returns (uint256) {
    bytes32 hash = blockhash(block.number);
    return uint256(hash);
  }

  /// Simulate randomness using the last block's hash
  function getRandomActionType() internal returns (ActionType) {
    uint256 randomValue = uint256(keccak256(abi.encodePacked(vm.unixTime()))) % 2;
    vm.sleep(1);

    return ActionType(randomValue);
  }

  function makeActionSequence(uint256 _length, uint256 _numKeys)
    internal
    returns (Action[] memory)
  {
    require(_numKeys > 0, "numKeys must be greater than 0");

    Action[] memory sequence = new Action[](_length);
    uint256[] memory _listKeys = new uint256[](_length);
    uint256[] memory keyOptions = new uint256[](_numKeys);

    for (uint256 j = 0; j < _numKeys; j++) {
      keyOptions[j] = j + 1;
    }

    uint256 currentIndex = 0;

    for (uint256 i = 0; i < _length; i++) {
      uint256 key = randomElement(keyOptions);

      ActionType action;

      if (contains(_listKeys, key)) {
        action = getRandomActionType();

        if (action == ActionType.Remove) {
          _listKeys = removeFromArray(_listKeys, key);
        }
      } else {
        action = ActionType.Insert;

        _listKeys[currentIndex] = key;
        currentIndex++;
      }

      sequence[i] = Action({
        actionType: action,
        element: SortedElement({ key: key, value: getRandomValue() })
      });
    }

    return sequence;
  }

  function doActionsAndAssertInvariants(uint256 numActions, uint256 numKeys, bool allowFailingTx)
    internal
  {
    Action[] memory sequence = makeActionSequence(numActions, numKeys);

    uint256 successes = 0;

    for (uint256 i = 0; i < numActions; i++) {
      Action memory action = sequence[i];

      if (action.actionType == ActionType.Remove) {
        integerSortedLinkedListTest.remove(action.element.key);
        listKeys = removeFromArray(listKeys, action.element.key);
      } else {
        (uint256 lesser, uint256 greater) = getLesserAndGreater(action.element);

        if (action.actionType == ActionType.Insert) {
          integerSortedLinkedListTest.insert(
            action.element.key,
            action.element.value,
            lesser,
            greater
          );

          listKeys.push(action.element.key);
        } else if (action.actionType == ActionType.Update) {
          integerSortedLinkedListTest.update(
            action.element.key,
            action.element.value,
            lesser,
            greater
          );
        }
      }

      successes += 1;
      (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListTest.getElements();
      assertSortedLinkedListInvariants(
        keys,
        values,
        integerSortedLinkedListTest.getNumElements(),
        integerSortedLinkedListTest.head(),
        integerSortedLinkedListTest.tail(),
        listKeys
      );

      if (allowFailingTx) {
        uint256 expectedSuccessRate = (2 * 10**18) / numKeys; // 2.0 represented in fixed-point
        require(
          (successes * 10**18) / numActions >= (expectedSuccessRate * 75) / 100,
          "Success rate not met"
        );
      }
    }
  }

  function contains(uint256[] memory array, uint256 value) internal pure returns (bool) {
    for (uint256 i = 0; i < array.length; i++) {
      if (array[i] == value) {
        return true;
      }
    }
    return false;
  }

  function removeFromArray(uint256[] memory inputArray, uint256 indexToRemove)
    internal
    pure
    returns (uint256[] memory)
  {
    require(indexToRemove < inputArray.length, "Index out of bounds");

    uint256[] memory newArray = new uint256[](inputArray.length - 1);

    for (uint256 i = 0; i < indexToRemove; i++) {
      newArray[i] = inputArray[i];
    }

    for (uint256 i = indexToRemove; i < inputArray.length - 1; i++) {
      newArray[i] = inputArray[i + 1];
    }

    return newArray;
  }

  function getLesserAndGreater(SortedElement memory element)
    internal
    view
    returns (uint256 lesser, uint256 greater)
  {
    uint256[] memory keys;
    uint256[] memory values;
    (keys, values) = integerSortedLinkedListTest.getElements();
    SortedElement[] memory sortedElements = parseElements(keys, values);

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

  function parseElements(uint256[] memory keys, uint256[] memory values)
    internal
    pure
    returns (SortedElement[] memory)
  {
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

  function assertSortedLinkedListInvariants(
    uint256[] memory keys,
    uint256[] memory values,
    uint256 numElements, // fetched
    uint256 head, // fetched
    uint256 tail, // fetched
    uint256[] memory expectedKeys // from handler
  ) internal {
    SortedElement[] memory sortedElements = parseElements(keys, values);

    assertEq(numElements, expectedKeys.length, "Incorrect number of elements");
    assertEq(sortedElements.length, expectedKeys.length, "Incorrect number of elements");
    assertSorted(sortedElements);
    if (sortedElements.length > 0) {
      assertEq(head, sortedElements[0].key, "Incorrect head");
      assertEq(tail, sortedElements[sortedElements.length - 1].key, "Incorrect tail");
    } else {
      assertEq(head, 0, "Head not zero");
      assertEq(tail, 0, "Tail not Zero");
    }
  }

  function randomElement(uint256[] memory list) internal returns (uint256) {
    uint256 curTime = vm.unixTime();

    uint256 index = 0;

    if (list.length == 0) {
      index = 0;
    }
    index = uint256(keccak256(abi.encodePacked(curTime))) % list.length;

    vm.sleep(1); // Halts execution for 1 milliseconds

    return list[index];
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

  function setUp() public override {
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

  function setUp() public override {
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

  function setUp() public override {
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
    public
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

contract IntegerSortedLinkedListInvariant_WhenLesserAndGreaterAreCorrect_WhenMultipleInsertsUpdatesAndRemovals is
  IntegerSortedLinkedListBaseTest
{
  Handler public handler;

  function setUp() public override {
    super.setUp();

    handler = new Handler(integerSortedLinkedListTest);
    targetContract(address(handler));

    bytes4[] memory selectors = new bytes4[](3);

    selectors[0] = handler.insertCorrectKeys.selector;
    selectors[1] = handler.updateExisting.selector;
    selectors[2] = handler.removeExisting.selector;
    targetSelector(FuzzSelector({ addr: address(handler), selectors: selectors }));
  }

  function assertInvariants() public {
    assertEq(
      integerSortedLinkedListTest.getNumElements(),
      handler.actionListLength(),
      "Incorrect number of elements here"
    );

    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListTest.getElements();
    SortedElement[] memory sortedElements = parseElements(keys, values);
    assertSorted(sortedElements);
    if (sortedElements.length > 0) {
      assertEq(integerSortedLinkedListTest.head(), sortedElements[0].key, "Incorrect head");
      assertEq(
        integerSortedLinkedListTest.tail(),
        sortedElements[sortedElements.length - 1].key,
        "Incorrect tail"
      );
    } else {
      assertEq(integerSortedLinkedListTest.head(), 0, "Head not zero");
      assertEq(integerSortedLinkedListTest.tail(), 0, "Tail not Zero");
    }
  }

  // TODO some insert are still failing.
  /// forge-config: default.invariant.runs = 256
  /// forge-config: default.invariant.depth = 100
  /// forge-config: default.invariant.fail-on-revert = true

  function invariant_ShouldMaintainInvariants_WhenLesserAndGreaterAreCorrect() public {
    // May have to created a second contract for incorrect leseer and greater keys
    assertInvariants();
  }
}

contract IntegerSortedLinkedListInvariant_WhenLesserAndGreaterAreIncorrect_WhenMultipleInsertsUpdatesAndRemovals is
  IntegerSortedLinkedListBaseTest
{
  Handler public handler;

  function setUp() public override {
    super.setUp();

    handler = new Handler(integerSortedLinkedListTest);
    targetContract(address(handler));

    bytes4[] memory selectors = new bytes4[](3);

    selectors[0] = handler.insertRandomly.selector;
    selectors[1] = handler.updateRandomly.selector;
    selectors[2] = handler.removeExisting.selector;
    targetSelector(FuzzSelector({ addr: address(handler), selectors: selectors }));
  }

  function assertInvariants() public {
    assertEq(
      integerSortedLinkedListTest.getNumElements(),
      handler.actionListLength(),
      "Incorrect number of elements here"
    );

    (uint256[] memory keys, uint256[] memory values) = integerSortedLinkedListTest.getElements();
    SortedElement[] memory sortedElements = parseElements(keys, values);
    assertSorted(sortedElements);
    if (sortedElements.length > 0) {
      assertEq(integerSortedLinkedListTest.head(), sortedElements[0].key, "Incorrect head");
      assertEq(
        integerSortedLinkedListTest.tail(),
        sortedElements[sortedElements.length - 1].key,
        "Incorrect tail"
      );
    } else {
      assertEq(integerSortedLinkedListTest.head(), 0, "Head not zero");
      assertEq(integerSortedLinkedListTest.tail(), 0, "Tail not Zero");
    }
  }

  /// forge-config: default.invariant.runs = 256
  /// forge-config: default.invariant.depth = 200
  /// forge-config: default.invariant.fail-on-revert = false

  function invariant_ShouldMaintainInvariantsWhenLesserAndGreaterAreIncorrect() public {
    assertInvariants();
  }
}

contract Handler is CommonBase, StdCheats, StdUtils {
  constructor(IntegerSortedLinkedListTest _integerSortedLinkedList) {
    listTest = _integerSortedLinkedList;
  }

  struct ActionElement {
    uint256 key;
    uint256 value;
  }
  uint256 public actionListLength;

  IntegerSortedLinkedListTest private listTest;

  function getLesserAndGreater(ActionElement memory element)
    internal
    view
    returns (uint256 lesser, uint256 greater)
  {
    uint256[] memory keys;
    uint256[] memory values;
    (keys, values) = getElements();
    ActionElement[] memory sortedElements = parseElements(keys, values);

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

  function parseElements(uint256[] memory keys, uint256[] memory values)
    internal
    pure
    returns (ActionElement[] memory)
  {
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

  function insertRandomly(uint256 key, uint256 value, uint256 lesserKey, uint256 greaterKey)
    external
  {
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

  function updateRandomly(uint256 key, uint256 value, uint256 lesserKey, uint256 greaterKey)
    external
  {
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

  // function removeRandomly(uint256 key) external {
  //   key = bound(key, 1, 10);

  //   actionListLength--;

  //   listTest.remove(key);
  // }

  function getNumElements() external view returns (uint256) {
    return listTest.getNumElements();
  }

  function getElements() public view returns (uint256[] memory, uint256[] memory) {
    return listTest.getElements();
  }

  function contains(uint256 key) public view returns (bool) {
    return listTest.contains(key);
  }
}
