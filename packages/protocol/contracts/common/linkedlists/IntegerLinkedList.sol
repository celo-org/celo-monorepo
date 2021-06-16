pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./LinkedList.sol";

/**
 * @title Maintains a doubly linked list keyed by uint256.
 * @dev Following the `next` pointers will lead you to the head, rather than the tail.
 */
library IntegerLinkedList {
  using LinkedList for LinkedList.List;
  using SafeMath for uint256;

  /**
   * @notice Inserts an element into a doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to insert.
   * @param previousKey The key of the element that comes before the element to insert.
   * @param nextKey The key of the element that comes after the element to insert.
   */
  function insert(LinkedList.List storage list, uint256 key, uint256 previousKey, uint256 nextKey)
    internal
  {
    list.insert(bytes32(key), bytes32(previousKey), bytes32(nextKey));
  }

  /**
   * @notice Inserts an element at the end of the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to insert.
   */
  function push(LinkedList.List storage list, uint256 key) internal {
    list.insert(bytes32(key), bytes32(0), list.tail);
  }

  /**
   * @notice Removes an element from the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to remove.
   */
  function remove(LinkedList.List storage list, uint256 key) internal {
    list.remove(bytes32(key));
  }

  /**
   * @notice Updates an element in the list.
   * @param list A storage pointer to the underlying list.
   * @param key The element key.
   * @param previousKey The key of the element that comes before the updated element.
   * @param nextKey The key of the element that comes after the updated element.
   */
  function update(LinkedList.List storage list, uint256 key, uint256 previousKey, uint256 nextKey)
    internal
  {
    list.update(bytes32(key), bytes32(previousKey), bytes32(nextKey));
  }

  /**
   * @notice Returns whether or not a particular key is present in the sorted list.
   * @param list A storage pointer to the underlying list.
   * @param key The element key.
   * @return Whether or not the key is in the sorted list.
   */
  function contains(LinkedList.List storage list, uint256 key) internal view returns (bool) {
    return list.elements[bytes32(key)].exists;
  }

  /**
   * @notice Returns the N greatest elements of the list.
   * @param list A storage pointer to the underlying list.
   * @param n The number of elements to return.
   * @return The keys of the greatest elements.
   * @dev Reverts if n is greater than the number of elements in the list.
   */
  function headN(LinkedList.List storage list, uint256 n) internal view returns (uint256[] memory) {
    bytes32[] memory byteKeys = list.headN(n);
    uint256[] memory keys = new uint256[](n);
    for (uint256 i = 0; i < n; i = i.add(1)) {
      keys[i] = uint256(byteKeys[i]);
    }
    return keys;
  }

  /**
   * @notice Gets all element keys from the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @return All element keys from head to tail.
   */
  function getKeys(LinkedList.List storage list) internal view returns (uint256[] memory) {
    return headN(list, list.numElements);
  }
}
