// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "forge-std/console.sol";

import "@celo-contracts/common/FixidityLib.sol";

import "@celo-contracts/common/test/IntegerSortedLinkedListTest.sol";

contract IntegerSortedLinkedListBaseTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  IntegerSortedLinkedListTest public integerSortedLinkedListTest;
  // Accounts accounts;
  // GoldToken goldToken;
  // MockStableToken stableToken;
  // MockElection election;
  // MockGovernance governance;
  // MockValidators validators;
  // LockedGold lockedGold;
  // ReleaseGold releaseGold;

  uint256 HOUR = 60 * 60;
  uint256 DAY = 24 * HOUR;
  uint256 unlockingPeriod = 3 * DAY;

  address randomAddress = actor("randomAddress");
  address caller = address(this);

  event UnlockingPeriodSet(uint256 period);
  event GoldLocked(address indexed account, uint256 value);
  event GoldUnlocked(address indexed account, uint256 value, uint256 available);
  event GoldRelocked(address indexed account, uint256 value);
  event GoldWithdrawn(address indexed account, uint256 value);
  event SlasherWhitelistAdded(string indexed slasherIdentifier);
  event SlasherWhitelistRemoved(string indexed slasherIdentifier);
  event AccountSlashed(
    address indexed slashed,
    uint256 penalty,
    address indexed reporter,
    uint256 reward
  );
  event CeloDelegated(
    address indexed delegator,
    address indexed delegatee,
    uint256 percent,
    uint256 amount
  );
  event DelegatedCeloRevoked(
    address indexed delegator,
    address indexed delegatee,
    uint256 percent,
    uint256 amount
  );
  event MaxDelegateesCountSet(uint256 value);

  function setUp() public {
    // address registryAddress = 0x000000000000000000000000000000000000ce10;
    // deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    // registry = Registry(registryAddress);

    integerSortedLinkedListTest = new IntegerSortedLinkedListTest();
    // accounts = new Accounts(true);
    // lockedGold = new LockedGold(true);
    // election = new MockElection();
    // validators = new MockValidators();
    // governance = new MockGovernance();
    // stableToken = new MockStableToken();

    // registry.setAddressFor("Accounts", address(accounts));
    // registry.setAddressFor("Election", address(election));
    // registry.setAddressFor("GoldToken", address(goldToken));
    // registry.setAddressFor("Governance", address(governance));
    // registry.setAddressFor("LockedGold", address(lockedGold));
    // registry.setAddressFor("Validators", address(validators));
    // registry.setAddressFor("StableToken", address(stableToken));
    // lockedGold.initialize(address(registry), unlockingPeriod);
    // accounts.createAccount();
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
  enum ActionType { Update, Remove, Insert }

  struct Element {
    uint256 key;
    uint256 value;
  }

  struct Action {
    ActionType actionType;
    Element element;
  }

  struct SortedElement {
    uint256 key;
    uint256 value;
  }

  uint256[] public listKeyz;

  function getRandomElement(uint256[] memory list) internal view returns (uint256) {
    uint256 blockHashAsNumber = uint256(blockhash(block.number - 1));
    uint256 randomIndex = blockHashAsNumber % list.length;

    return list[randomIndex];
  }

  function makeActionSequence(uint256 length, uint256 numKeys)
    public
    view
    returns (Action[] memory)
  {
    require(numKeys > 0, "numKeys must be greater than 0");

    Action[] memory sequence = new Action[](length);
    uint256[] memory listKeys = new uint256[](length);
    uint256[] memory keyOptions = new uint256[](numKeys);
    // uint256[] memory actionTypeList = new uint256[](2);

    for (uint256 j = 0; j < numKeys; j++) {
      keyOptions[j] = j + 1;
    }

    uint256 currentIndex = 0;

    for (uint256 i = 0; i < length; i++) {
      // uint key = getRandomElement(keyOptions);
      uint256 key = keyOptions[i % numKeys];
      ActionType action;

      if (contains(listKeys, key)) {
        action = getRandomAction();

        // console.log(action);
        // actionTypeList[0] = uint256(ActionType.Update);
        // actionTypeList[1] = uint256(ActionType.Remove);

        // action = ActionType(getRandomElement(actionTypeList));
        if (action == ActionType.Remove) {
          listKeys = removeFromArray(listKeys, key);
        }
      } else {
        action = ActionType.Insert;
        // listKeys.push(key);
        listKeys[currentIndex] = key;
        currentIndex++;
      }

      sequence[i] = Action({
        actionType: action,
        element: Element({ key: key, value: getRandomValue() })
      });
    }

    return sequence;
  }

  function getRandomValue() internal view returns (uint256) {
    // Simulate randomness using the current block's hash
    bytes32 hash = blockhash(block.number);
    return uint256(hash);
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

  function getRandomAction() internal view returns (ActionType) {
    // Simulate randomness using the last block's hash
    bytes32 hash = blockhash(block.number - 1);
    uint256 randomValue = uint256(hash) % 2; // 0 or 1
    return ActionType(randomValue);
  }

  function getLesserAndGreater(Element memory element)
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
    console.log("### Got lesser and greater");
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

  function assertSorted(SortedElement[] memory elements) internal {
    for (uint256 i = 0; i < elements.length; i++) {
      if (i > 0) {
        require(elements[i].value <= elements[i - 1].value, "Elements not sorted");
      }
    }
    console.log("### Was sorted");
  }

  function assertSortedLinkedListInvariants(
    uint256[] memory keys,
    uint256[] memory values,
    uint256 numElements,
    uint256 head,
    uint256 tail,
    uint256[] memory expectedKeys
  ) internal {
    console.log("### asserting");
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
    console.log("### Done asserting");
  }

  function doActionsAndAssertInvariants(uint256 numActions, uint256 numKeys, bool allowFailingTx)
    internal
  {
    Action[] memory sequence = makeActionSequence(numActions, numKeys);
    // uint256[] memory listKeys;
    // uint256[] memory listKeys = new uint256[];
    uint256 successes = 0;
    console.log("### HERE");
    for (uint256 i = 0; i < numActions; i++) {
      Action memory action = sequence[i];

      if (action.actionType == ActionType.Remove) {
        integerSortedLinkedListTest.remove(action.element.key);
        listKeyz = removeFromArray(listKeyz, action.element.key);
        console.log("### Done removing from array");
      } else {
        (uint256 lesser, uint256 greater) = getLesserAndGreater(action.element);

        if (action.actionType == ActionType.Insert) {
          integerSortedLinkedListTest.insert(
            action.element.key,
            action.element.value,
            lesser,
            greater
          );

          listKeyz.push(action.element.key);
          // listKeys[i] = action.element.key;
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
        listKeyz
      );

      if (allowFailingTx) {
        uint256 expectedSuccessRate = (2 * 10**18) / numKeys; // 2.0 represented in fixed-point
        require(
          (successes * 10**18) / numActions >= (expectedSuccessRate * 75) / 100,
          "Success rate not met"
        );
        console.log("### successRateMet");
      }
    }
  }

  function test_ShouldMaintainInvariantsWhenLesserAndGreaterAreCorrect() public {
    doActionsAndAssertInvariants(100, 20, false);
  }
}
