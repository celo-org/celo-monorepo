pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./AddressLinkedList.sol";
import "./SortedLinkedList.sol";


/**
 * @title Maintains a sorted list of unsigned ints keyed by address.
 */
library AddressSortedLinkedList {

  using SortedLinkedList for SortedLinkedList.List;

  function toBytes(address a) public pure returns (bytes32) {
    return bytes32(uint256(a) << 96);
  }

  function toAddress(bytes32 b) public pure returns (address) {
    return address(uint256(b) >> 96);
  }

  /**
   * @notice Inserts an element into a doubly linked list.
   * @param key The key of the element to insert.
   * @param value The element value.
   * @param lesserKey The key of the element less than the element to insert.
   * @param greaterKey The key of the element greater than the element to insert.
   */
  function insert(
    SortedLinkedList.List storage list,
    address key,
    uint256 value,
    address lesserKey,
    address greaterKey
  )
    public
  {
    list.insert(toBytes(key), value, toBytes(lesserKey), toBytes(greaterKey));
  }

  /**
   * @notice Removes an element from the doubly linked list.
   * @param key The key of the element to remove.
   */
  function remove(SortedLinkedList.List storage list, address key) public {
    list.remove(toBytes(key));
  }

  /**
   * @notice Updates an element in the list.
   * @param key The element key.
   * @param value The element value.
   * @param lesserKey The key of the element will be just left of `key` after the update.
   * @param greaterKey The key of the element will be just right of `key` after the update.
   * @dev Note that only one of "lesserKey" or "greaterKey" needs to be correct to reduce friction.
   */
  function update(
    SortedLinkedList.List storage list,
    address key,
    uint256 value,
    address lesserKey,
    address greaterKey
  )
    public
  {
    list.update(toBytes(key), value, toBytes(lesserKey), toBytes(greaterKey));
  }

  /**
   * @notice Returns whether or not a particular key is present in the sorted list.
   * @param key The element key.
   * @return Whether or not the key is in the sorted list.
   */
  function contains(SortedLinkedList.List storage list, address key) public view returns (bool) {
    return list.contains(toBytes(key));
  }

  /**
   * @notice Returns the value for a particular key in the sorted list.
   * @param key The element key.
   * @return The element value.
   */
  function getValue(SortedLinkedList.List storage list, address key) public view returns (uint256) {
    return list.getValue(toBytes(key));
  }

  /**
   * @notice Gets all elements from the doubly linked list.
   * @return An unpacked list of elements from largest to smallest.
   */
  function getElements(
    SortedLinkedList.List storage list
  )
    public
    view
    returns (address[] memory, uint256[] memory)
  {
    bytes32[] memory byteKeys = list.getKeys();
    address[] memory keys = new address[](byteKeys.length);
    uint256[] memory values = new uint256[](byteKeys.length);
    for (uint256 i = 0; i < byteKeys.length; i++) {
      keys[i] = toAddress(byteKeys[i]);
      values[i] = list.values[byteKeys[i]];
    }
    return (keys, values);
  }
}
