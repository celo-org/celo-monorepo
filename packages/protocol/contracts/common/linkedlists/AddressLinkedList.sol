pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./LinkedList.sol";

/**
 * @title Maintains a doubly linked list keyed by address.
 * @dev Following the `next` pointers will lead you to the head, rather than the tail.
 */
library AddressLinkedList {
  using LinkedList for LinkedList.List;
  using SafeMath for uint256;

  function toBytes(address a) public pure returns (bytes32) {
    return bytes32(uint256(a) << 96);
  }

  function toAddress(bytes32 b) public pure returns (address) {
    return address(uint256(b) >> 96);
  }

  /**
   * @notice Inserts an element into a doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to insert.
   * @param previousKey The key of the element that comes before the element to insert.
   * @param nextKey The key of the element that comes after the element to insert.
   */
  function insert(LinkedList.List storage list, address key, address previousKey, address nextKey)
    public
  {
    list.insert(toBytes(key), toBytes(previousKey), toBytes(nextKey));
  }

  /**
   * @notice Inserts an element at the end of the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to insert.
   */
  function push(LinkedList.List storage list, address key) public {
    list.insert(toBytes(key), bytes32(0), list.tail);
  }

  /**
   * @notice Removes an element from the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @param key The key of the element to remove.
   */
  function remove(LinkedList.List storage list, address key) public {
    list.remove(toBytes(key));
  }

  /**
   * @notice Updates an element in the list.
   * @param list A storage pointer to the underlying list.
   * @param key The element key.
   * @param previousKey The key of the element that comes before the updated element.
   * @param nextKey The key of the element that comes after the updated element.
   */
  function update(LinkedList.List storage list, address key, address previousKey, address nextKey)
    public
  {
    list.update(toBytes(key), toBytes(previousKey), toBytes(nextKey));
  }

  /**
   * @notice Returns whether or not a particular key is present in the sorted list.
   * @param list A storage pointer to the underlying list.
   * @param key The element key.
   * @return Whether or not the key is in the sorted list.
   */
  function contains(LinkedList.List storage list, address key) public view returns (bool) {
    return list.elements[toBytes(key)].exists;
  }

  /**
   * @notice Returns the N greatest elements of the list.
   * @param list A storage pointer to the underlying list.
   * @param n The number of elements to return.
   * @return The keys of the greatest elements.
   * @dev Reverts if n is greater than the number of elements in the list.
   */
  function headN(LinkedList.List storage list, uint256 n) public view returns (address[] memory) {
    bytes32[] memory byteKeys = list.headN(n);
    address[] memory keys = new address[](n);
    for (uint256 i = 0; i < n; i = i.add(1)) {
      keys[i] = toAddress(byteKeys[i]);
    }
    return keys;
  }

  /**
   * @notice Gets all element keys from the doubly linked list.
   * @param list A storage pointer to the underlying list.
   * @return All element keys from head to tail.
   */
  function getKeys(LinkedList.List storage list) public view returns (address[] memory) {
    return headN(list, list.numElements);
  }
}
