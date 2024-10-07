pragma solidity ^0.5.13;

import "../linkedlists/SortedLinkedList.sol";

contract SortedLinkedListMock {
  using SortedLinkedList for SortedLinkedList.List;

  SortedLinkedList.List private list;

  function insert(bytes32 key, uint256 numerator, bytes32 lesserKey, bytes32 greaterKey) external {
    list.insert(key, numerator, lesserKey, greaterKey);
  }

  function update(bytes32 key, uint256 numerator, bytes32 lesserKey, bytes32 greaterKey) external {
    list.update(key, numerator, lesserKey, greaterKey);
  }

  function remove(bytes32 key) external {
    list.remove(key);
  }

  function contains(bytes32 key) external view returns (bool) {
    return list.contains(key);
  }

  function getNumElements() external view returns (uint256) {
    return list.list.numElements;
  }

  function getElements() external view returns (bytes32[] memory, uint256[] memory) {
    return list.getElements();
  }

  function head() external view returns (bytes32) {
    return list.list.head;
  }

  function tail() external view returns (bytes32) {
    return list.list.tail;
  }
}
