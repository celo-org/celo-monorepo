pragma solidity >=0.5.13 <0.8.20;

import "../linkedlists/IntegerSortedLinkedList.sol";
import "forge-std-8/console.sol";

contract IntegerSortedLinkedListTest {
  using IntegerSortedLinkedList for SortedLinkedList.List;

  SortedLinkedList.List private list;

  function insert(uint256 key, uint256 value, uint256 lesserKey, uint256 greaterKey) external {
    // console.log("### Inserting real");
    // console.log(key);
    // console.log(value);
    // console.log(lesserKey);
    // console.log(greaterKey);
    list.insert(key, value, lesserKey, greaterKey);
    console.log("### Inserted real");
  }

  function update(uint256 key, uint256 value, uint256 lesserKey, uint256 greaterKey) external {
    list.update(key, value, lesserKey, greaterKey);
  }

  function remove(uint256 key) external {
    list.remove(key);
  }

  function popN(uint256 n) external returns (uint256[] memory) {
    return list.popN(n);
  }

  function contains(uint256 key) external view returns (bool) {
    return list.contains(key);
  }

  function getNumElements() external view returns (uint256) {
    return list.list.numElements;
  }

  function getElements() external view returns (uint256[] memory, uint256[] memory) {
    return list.getElements();
  }

  function head() external view returns (uint256) {
    return uint256(list.list.head);
  }

  function tail() external view returns (uint256) {
    return uint256(list.list.tail);
  }
}
