// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "forge-std/console.sol";

import "@celo-contracts/common/FixidityLib.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "@celo-contracts/common/test/IntegerSortedLinkedListTest.sol";

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

  function setUp() public {
    integerSortedLinkedListTest = new IntegerSortedLinkedListTest();
  }

  /// Simulate randomness using the current block's hash
  function getRandomValue() internal view returns (uint256) {
    bytes32 hash = blockhash(block.number);
    return uint256(hash);
  }

  /// Simulate randomness using the last block's hash
  function getRandomActionType() internal view returns (ActionType) {
    bytes32 hash = blockhash(block.number - 1);
    uint256 randomValue = uint256(hash) % 2;
    return ActionType(randomValue);
  }

  function makeActionSequence(uint256 _length, uint256 _numKeys)
    internal
    view
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
      uint256 key = keyOptions[i % _numKeys];
      ActionType action;

      if (contains(_listKeys, key)) {
        action = getRandomActionType();

        if (action == ActionType.Remove) {
          _listKeys = removeFromArray(_listKeys, key);
        }
      } else {
        action = ActionType.Insert;
        console.log("Inserted Action type");
        console.log(key);
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

  function containz(uint256[] memory array, uint256 value) internal returns (bool) {
    for (uint256 i = 0; i < array.length; i++) {
      console.log("### Index");
      console.log(i);
      console.log("### expected value");
      console.log(value);
      if (array[i] == value) {
        console.log("### contains stuff");
        return true;
      }
    }
    console.log("### does not contains stuff");
    return false;
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
    uint256 numElements,
    uint256 head,
    uint256 tail,
    uint256[] memory expectedKeys
  ) internal {
    console.log("### Asserting Invariants");
    SortedElement[] memory sortedElements = parseElements(keys, values);

    assertEq(numElements, expectedKeys.length, "Incorrect number of elements here");
    assertEq(sortedElements.length, expectedKeys.length, "Incorrect number of elements");
    assertSorted(sortedElements);
    if (sortedElements.length > 0) {
      assertEq(head, sortedElements[0].key, "Incorrect head");
      assertEq(tail, sortedElements[sortedElements.length - 1].key, "Incorrect tail");
    } else {
      assertEq(head, 0, "Head not zero");
      assertEq(tail, 0, "Tail not Zero");
    }
    console.log("### Asserted Invariants");
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

contract IntegerSortedLinkedListWhenMultipleInsertsUpdatesAndRemovals is
  IntegerSortedLinkedListBaseTest
{
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  function test_ShouldMaintainInvariantsWhenLesserAndGreaterAreCorrect() public {
    doActionsAndAssertInvariants(100, 20, false);
  }

  function test_ShouldMaintainInvariantsWhenLesserAndGreaterAreIncorrect() public {
    doActionsAndAssertInvariants2(200, 10, true);
  }

  uint256 ay = 0;

  function nonElement(uint256[] memory _keys) internal returns (uint256) {
    // uint256 i = 0;
    if (_keys.length < 1) {
      console.log("### No keys found");
      return ay;
    }
    while (containz(_keys, ay)) {
      ay = ay.add(1);
      console.log("### contained ay");
    }
    console.log("### returning ay");
    console.log(ay);
    return ay;
  }

  function getRandomKeys() public returns (uint256 lesser, uint256 greater) {
    console.log("### getting random keys");
    (uint256[] memory _keys, ) = integerSortedLinkedListTest.getElements();
    console.log("### keys length");
    console.log(_keys.length);

    if (_keys.length > 0) {
      console.log("### first key:");
      console.log(_keys[0]);
    }

    lesser = getLesserOrGreater(_keys);
    greater = getLesserOrGreater(_keys);

    console.log("### final lesser & greater");
    console.log(lesser);
    console.log(greater);
  }

  function getLesserOrGreater(uint256[] memory _keys) internal returns (uint256) {
    uint256 r = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % 100;
    // uint256 r = uint256(71) % 100;
    console.log("### r value");
    console.log(r);

    if (r < 33) {
      uint256 rand = randomElement(_keys);
      console.log("### returning Random");
      console.log(rand);
      return rand;
      // return randomElement(_keys);
    } else if (r < 66) {
      uint256 nonElem = nonElement(_keys);
      console.log("### returning nonElement");
      console.log(nonElem);
      return nonElem;
      // return nonElement(_keys);
    } else {
      return 0;
    }
  }

  function randomElement(uint256[] memory list) internal view returns (uint256) {
    uint256 index = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) %
      list.length;
    return list[index];
  }

  function doActionsAndAssertInvariants2(uint256 numActions, uint256 numKeys, bool allowFailingTx)
    internal
  {
    Action[] memory sequence = makeActionSequence(numActions, numKeys);

    console.log("### sequence length");
    console.log(sequence.length);

    uint256 successes = 0;

    for (uint256 i = 0; i < numActions; i++) {
      Action memory action = sequence[i];

      if (action.actionType == ActionType.Remove) {
        console.log("### Remove Action");
        integerSortedLinkedListTest.remove(action.element.key);
        listKeys = removeFromArray(listKeys, action.element.key);
      } else {
        (uint256 lesser, uint256 greater) = getRandomKeys();

        // (uint256 lesser, uint256 greater) = getLesserAndGreater(action.element);

        if (action.actionType == ActionType.Insert) {
          console.log("### inserting Action");
          console.log(action.element.key);
          console.log(action.element.value);

          integerSortedLinkedListTest.insert(
            action.element.key,
            action.element.value,
            lesser,
            greater
          );

          listKeys.push(action.element.key);
        } else if (action.actionType == ActionType.Update) {
          console.log("### Update Action");
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

      // if (allowFailingTx) {
      //   uint256 expectedSuccessRate = (2 * 10 ** 18) / numKeys; // 2.0 represented in fixed-point
      //   successes
      //   require(
      //     (successes * 10 ** 18) / numActions >= (expectedSuccessRate * 75) / 100,
      //     "Success rate not met"
      //   );
      // }
      if (allowFailingTx) {
        FixidityLib.Fraction memory expectedSuccessRate = FixidityLib.newFixedFraction(2, numKeys);
        FixidityLib.Fraction memory seventyFivePercent = FixidityLib.newFixedFraction(75, 100);
        FixidityLib.Fraction memory successRatio = FixidityLib.newFixedFraction(
          successes,
          numActions
        );

        require(
          FixidityLib.fromFixed(successRatio) >=
            FixidityLib.fromFixed(expectedSuccessRate).mul(
              FixidityLib.fromFixed(seventyFivePercent)
            ),
          "Success rate not met"
        );
        console.log("### success Rate Met");
        // require(
        //   successes.div(numActions) >= expectedSuccessRate.mul(seventyFivePercent),
        //   "Success rate not met"
        // );
      }
    }
  }
}
