pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SortedLinkedList.sol";

/**
 * @title Maintains a sorted list of unsigned ints keyed by uint256.
 */
library IntegerSortedLinkedList {
  using SafeMath for uint256;
  using SortedLinkedList for SortedLinkedList.List;

  /**
   * @notice Inserts an element into a doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to insert.
   * @param value The element value.
   * @param lesserKey The key of the element less than the element to insert.
   * @param greaterKey The key of the element greater than the element to insert.
   */
  function insert(
    SortedLinkedList.List storage list,
    uint256 key,
    uint256 value,
    uint256 lesserKey,
    uint256 greaterKey
  ) public {
    list.insert(bytes32(key), value, bytes32(lesserKey), bytes32(greaterKey));
  }

  /**
   * @notice Removes an element from the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to remove.
   */
  function remove(SortedLinkedList.List storage list, uint256 key) public {
    list.remove(bytes32(key));
  }

  /**
   * @notice Updates an element in the list.
   * @param list A storage pointer to the underlying list.
   * @param key The element key.
   * @param value The element value.
   * @param lesserKey The key of the element will be just left of `key` after the update.
   * @param greaterKey The key of the element will be just right of `key` after the update.
   * @dev Note that only one of "lesserKey" or "greaterKey" needs to be correct to reduce friction.
   */
  function update(
    SortedLinkedList.List storage list,
    uint256 key,
    uint256 value,
    uint256 lesserKey,
    uint256 greaterKey
  ) public {
    list.update(bytes32(key), value, bytes32(lesserKey), bytes32(greaterKey));
  }

  /**
   * @notice Inserts an element at the end of the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to insert.
   */
  function push(SortedLinkedList.List storage list, uint256 key) public {
    list.push(bytes32(key));
  }

  /**
   * @notice Removes N elements from the head of the list and returns their keys.
   * @param list A storage pointer to the underlying list.
   * @param n The number of elements to pop.
   * @return The keys of the popped elements.
   */
  function popN(SortedLinkedList.List storage list, uint256 n) public returns (uint256[] memory) {
    bytes32[] memory byteKeys = list.popN(n);
    uint256[] memory keys = new uint256[](byteKeys.length);
    for (uint256 i = 0; i < byteKeys.length; i = i.add(1)) {
      keys[i] = uint256(byteKeys[i]);
    }
    return keys;
  }

  /**
   * @notice Returns whether or not a particular key is present in the sorted list.
   * @param list A storage pointer to the underlying list.
   * @param key The element key.
   * @return Whether or not the key is in the sorted list.
   */
  function contains(SortedLinkedList.List storage list, uint256 key) public view returns (bool) {
    return list.contains(bytes32(key));
  }

  /**
   * @notice Returns the value for a particular key in the sorted list.
   * @param list A storage pointer to the underlying list.
   * @param key The element key.
   * @return The element value.
   */
  function getValue(SortedLinkedList.List storage list, uint256 key) public view returns (uint256) {
    return list.getValue(bytes32(key));
  }

  /**
   * @notice Gets all elements from the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @return An unpacked list of elements from largest to smallest.
   */
  function getElements(SortedLinkedList.List storage list)
    public
    view
    returns (uint256[] memory, uint256[] memory)
  {
    bytes32[] memory byteKeys = list.getKeys();
    uint256[] memory keys = new uint256[](byteKeys.length);
    uint256[] memory values = new uint256[](byteKeys.length);
    for (uint256 i = 0; i < byteKeys.length; i = i.add(1)) {
      keys[i] = uint256(byteKeys[i]);
      values[i] = list.values[byteKeys[i]];
    }
    return (keys, values);
  }
}
