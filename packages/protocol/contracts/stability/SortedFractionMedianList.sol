pragma solidity ^0.5.8;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/Initializable.sol";
import "./FractionUtil.sol";


// TODO(asa): Inherit from SortedLinkedList or AddressSortedLinkedList
/**
 * @title Maintains a sorted list of fractions keyed by address with a pointer to the median value.
 */
library SortedFractionMedianList {

  using SafeMath for uint256;
  using FractionUtil for FractionUtil.Fraction;

  enum MedianRelation {
    Undefined,
    Lesser,
    Greater,
    Equal
  }

  enum MedianAction {
    None,
    Lesser,
    Greater
  }

  struct Element {
    uint128 numerator;
    uint128 denominator;
    address lesserKey;
    address greaterKey;
    MedianRelation relation;
  }

  struct List {
    address head;
    address tail;
    address medianKey;
    uint256 numElements;
    mapping(address => Element) elements;
  }

  /**
   * @notice Updates an element in the list, inserting if the key is new.
   * @param key The key of the element to update or insert.
   * @param numerator The element value numerator.
   * @param denominator The element value denominator.
   * @param lesserKey The key of the element which should be just left of the new value.
   * @param greaterKey The key of the element which should be just right of the new value.
   * @dev Values are passed as uint128 to avoid uint256 overflow when multiplying.
   * @dev Note that only one of "lesserKey" or "greaterKey" needs to be correct to reduce friction.
   */
  function insertOrUpdate(
    List storage list,
    address key,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    public
  {
    if (contains(list, key)) {
      update(list, key, numerator, denominator, lesserKey, greaterKey);
    } else {
      insert(list, key, numerator, denominator, lesserKey, greaterKey);
    }
  }

  /**
   * @notice Inserts an element into a doubly linked list and updates the median.
   * @param key The key of the element to insert.
   * @param numerator The element value numerator.
   * @param denominator The element value denominator.
   * @param lesserKey The key of the element to less than the element to insert.
   * @param greaterKey The key of the element greaterKey than the element to insert.
   */
  function insert(
    List storage list,
    address key,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    public
  {
    Element storage element = list.elements[key];
    // TODO: abstract repeated checks
    require(
      key != address(0) && key != lesserKey && key != greaterKey && !contains(list, key),
      "key was null or equal to lesserKey or equal to greaterKey or already in DLL"
    );
    require((lesserKey != address(0) || greaterKey != address(0)) || list.numElements == 0);
    require(contains(list, lesserKey) || lesserKey == address(0));
    require(contains(list, greaterKey) || greaterKey == address(0));
    (lesserKey, greaterKey) = getLesserAndGreater(
      list,
      numerator,
      denominator,
      lesserKey,
      greaterKey
    );
    _insert(list, element, key, numerator, denominator, lesserKey, greaterKey);
  }

  /**
   * @notice Removes an element from the doubly linked list and updates the median.
   * @param key The key of the element to remove.
   */
  function remove(List storage list, address key) public {
    Element storage element = list.elements[key];
    require(key != address(0) && contains(list, key));
    MedianAction action = MedianAction.None;
    if (list.numElements == 1) {
      list.medianKey = address(0);
    } else if (list.numElements % 2 == 0) {
      // When we have an even number of elements, we always choose the higher of the two medians.
      // Thus, if the element we're removing is greaterKey than or equal to the median we need to
      // slide the median left by one.
      if (element.relation == MedianRelation.Greater || element.relation == MedianRelation.Equal) {
        action = MedianAction.Lesser;
      }
    } else {
      // When we don't have an even number of elements, we just choose the median value.
      // Thus, if the element we're removing is less than or equal to the median, we need to slide
      // median right by one.
      if (element.relation == MedianRelation.Lesser || element.relation == MedianRelation.Equal) {
        action = MedianAction.Greater;
      }
    }

    updateMedian(list, action);

    if (element.lesserKey != address(0)) {
      Element storage lesserElement = list.elements[element.lesserKey];
      lesserElement.greaterKey = element.greaterKey;
    } else {
      list.tail = element.greaterKey;
    }

    if (element.greaterKey != address(0)) {
      Element storage greaterElement = list.elements[element.greaterKey];
      greaterElement.lesserKey = element.lesserKey;
    } else {
      list.head = element.lesserKey;
    }

    delete list.elements[key];
    list.numElements = list.numElements.sub(1);
  }

  /**
   * @notice Updates an element in the list.
   * @param numerator The element value numerator.
   * @param denominator The element value denominator.
   * @param lesserKey The key of the element which should be just left of the new value.
   * @param greaterKey The key of the element which should be just right of the new value.
   * @dev Values are passed as uint128 to avoid uint256 overflow when multiplying.
   * @dev Note that only one of "lesserKey" or "greaterKey" needs to be correct to reduce friction.
   */
  function update(
    List storage list,
    address key,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    public
  {
    Element storage element = list.elements[key];
    // TODO: abstract repeated checks
    require(
      key != address(0) && key != lesserKey && key != greaterKey && contains(list, key),
      "key was null or equal to lesserKey or equal to greaterKey or already in DLL"
    );
    // TODO(asa): Optimize by not making any changes other than value if lesserKey and greaterKey
    // don't change.
    // TODO(asa): Optimize by not updating lesserKey/greaterKey for key
    remove(list, key);
    (lesserKey, greaterKey) = getLesserAndGreater(
      list,
      numerator,
      denominator,
      lesserKey,
      greaterKey
    );
    _insert(list, element, key, numerator, denominator, lesserKey, greaterKey);
  }

  /**
   * @notice Returns whether or not a particular key is present in the sorted list.
   * @param key The element key.
   * @return Whether or not the key is in the sorted list.
   */
  function contains(List storage list, address key) public view returns (bool) {
    Element storage element = list.elements[key];
    return element.relation != MedianRelation.Undefined;
  }

  /**
   * @notice Gets all elements from the doubly linked list.
   * @return An unpacked list of elements from largest to smallest.
   */
  function getElements(
    List storage list
  )
    public
    view
    returns (address[] memory, uint256[] memory, uint256[] memory, MedianRelation[] memory)
  {
    uint256 length = list.numElements;
    address[] memory addresses = new address[](length);
    uint256[] memory numerators = new uint256[](length);
    uint256[] memory denominators = new uint256[](length);
    MedianRelation[] memory relations = new MedianRelation[](length);
    address key = list.head;
    for (uint256 i = 0; i < length; i = i.add(1)) {
      Element storage element = list.elements[key];
      addresses[i] = key;
      numerators[i] = element.numerator;
      denominators[i] = element.denominator;
      relations[i] = element.relation;
      key = element.lesserKey;
    }
    return (addresses, numerators, denominators, relations);
  }

  // TODO(asa): Gas optimizations by passing in elements to isValueBetween
  /**
   * @notice Returns the keys of the elements greaterKey than and less than the provided value.
   * @param numerator The element value numerator.
   * @param denominator The element value denominator.
   * @param lesserKey The key of the element which could be just left of the new value.
   * @param greaterKey The key of the element which could be just right of the new value.
   * @return The correct lesserKey/greaterKey keys.
   * @dev Reverts if neither of the provided `lesserKey` and `greaterKey` keys are correct.
   */
  function getLesserAndGreater(
    List storage list,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    private
    view
    returns (address, address)
  {
    // Check for one of the following conditions and fail if none are met:
    //   1. The value is less than the current lowest value
    //   2. The value is greater than the current greatest value
    //   3. The value is just greater than the value for `lesserKey`
    //   4. The value is just less than the value for `greaterKey`
    if (lesserKey == address(0) && 
        isValueBetween(list, numerator, denominator, lesserKey, list.tail)) 
    {
      return (lesserKey, list.tail);
    } else if (
      greaterKey == address(0) &&
      isValueBetween(list, numerator, denominator, list.head, greaterKey)
    ) {
      return (list.head, greaterKey);
    } else if (
      isValueBetween(list, numerator, denominator, lesserKey, list.elements[lesserKey].greaterKey)
    ) {
      return (lesserKey, list.elements[lesserKey].greaterKey);
    } else if (
      isValueBetween(list, numerator, denominator, list.elements[greaterKey].lesserKey, greaterKey)
    ) {
      return (list.elements[greaterKey].lesserKey, greaterKey);
    } else {
      // TODO: abstract repeated checks
      require(false, "neither lesserKey nor greaterKey was correct");
    }
  }

  /**
   * @notice Returns whether or not a given element is between two other elements.
   * @param numerator The element value numerator.
   * @param denominator The element value denominator.
   * @param lesserKey The key of the element whose value should be lesserKey.
   * @param greaterKey The key of the element whose value should be greaterKey.
   * @return True if the given element is between the two other elements.
   */
  function isValueBetween(
    List storage list,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    private
    view
    returns (bool)
  {
    Element storage lesserElement = list.elements[lesserKey];
    Element storage greaterElement = list.elements[greaterKey];
    FractionUtil.Fraction memory lesserValue = FractionUtil.Fraction(
      lesserElement.numerator,
      lesserElement.denominator
    );
    FractionUtil.Fraction memory greaterValue = FractionUtil.Fraction(
      greaterElement.numerator,
      greaterElement.denominator
    );
    FractionUtil.Fraction memory elementValue = FractionUtil.Fraction(
      numerator,
      denominator
    );
    bool isLesser = lesserKey == address(0) || lesserValue.isLessThanOrEqualTo(elementValue);
    bool isGreater = greaterKey == address(0) || greaterValue.isGreaterThanOrEqualTo(elementValue);
    return isLesser && isGreater;
  }

  /**
   * @notice Moves the median pointer right or left of its current value.
   * @param action Which direction to move the median pointer.
   */
  function updateMedian(List storage list, MedianAction action) private {
    Element storage previousMedian = list.elements[list.medianKey];
    if (action == MedianAction.Lesser) {
      list.medianKey = previousMedian.lesserKey;
      previousMedian.relation = MedianRelation.Greater;
    } else if (action == MedianAction.Greater) {
      list.medianKey = previousMedian.greaterKey;
      previousMedian.relation = MedianRelation.Lesser;
    }
    list.elements[list.medianKey].relation = MedianRelation.Equal;
  }

  /**
   * @notice Inserts an element into a doubly linked list and updates the median.
   * @param key The key of the element to insert.
   * @param numerator The element value numerator.
   * @param denominator The element value denominator.
   * @param lesserKey The key of the element to less than the element to insert.
   * @param greaterKey The key of the element greaterKey than the element to insert.
   */
  function _insert(
    List storage list,
    Element storage element,
    address key,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    private
  {
    element.numerator = numerator;
    element.denominator = denominator;
    element.lesserKey = lesserKey;
    element.greaterKey = greaterKey;

    if (lesserKey == address(0)) {
      // We don't have a lesser element => update the tail
      list.tail = key;
    } else {
      // We have a lesser element => point greaterKey to ourselves
      list.elements[element.lesserKey].greaterKey = key;
    }

    if (greaterKey == address(0)) {
      // We don't have a greater element => update the head
      list.head = key;
    } else {
      // We have a greater element => point lesserKey to ourselves
      list.elements[element.greaterKey].lesserKey = key;
    }

    MedianAction action = MedianAction.None;
    if (list.numElements == 0) {
      list.medianKey = key;
      element.relation = MedianRelation.Equal;
    } else if (list.numElements % 2 == 0) {
      // When we have an even number of elements, we always choose the higher of the two medians.
      // Thus, if the element we're inserting is less than the median we need to slide the median
      // left by one.
      if (lesserKey == address(0) || 
        list.elements[element.lesserKey].relation == MedianRelation.Lesser) 
      {
        action = MedianAction.Lesser;
        element.relation = MedianRelation.Lesser;
      } else {
        element.relation = MedianRelation.Greater;
      }
    } else {
      // When we have an even number of elements, we always choose the higher of the two medians.
      // Thus, if the element we're adding is greaterKey than the median, we need to slide the
      // median right by one.
      if (greaterKey == address(0) || 
        list.elements[element.greaterKey].relation == MedianRelation.Greater) 
      {
        action = MedianAction.Greater;
        element.relation = MedianRelation.Greater;
      } else {
        element.relation = MedianRelation.Lesser;
      }
    }

    list.numElements = list.numElements.add(1);
    updateMedian(list, action);
  }
}
