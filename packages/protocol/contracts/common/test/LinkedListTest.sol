pragma solidity ^0.5.13;

import "../linkedlists/LinkedList.sol";

contract LinkedListTest {
  using LinkedList for LinkedList.List;

  LinkedList.List private list;

  function insert(bytes32 key, bytes32 previousKey, bytes32 nextKey) external {
    list.insert(key, previousKey, nextKey);
  }

  function update(bytes32 key, bytes32 previousKey, bytes32 nextKey) external {
    list.update(key, previousKey, nextKey);
  }

  function remove(bytes32 key) external {
    list.remove(key);
  }

  function contains(bytes32 key) external view returns (bool) {
    return list.contains(key);
  }

  function getNumElements() external view returns (uint256) {
    return list.numElements;
  }

  function getKeys() external view returns (bytes32[] memory) {
    return list.getKeys();
  }

  function head() external view returns (bytes32) {
    return list.head;
  }

  function tail() external view returns (bytes32) {
    return list.tail;
  }

}
